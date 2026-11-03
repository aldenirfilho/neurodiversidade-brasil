import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync}from'node:sqlite';
import {randomUUID}from'node:crypto';
import {OFFER,CommerceError,catalogue,createQuote,reserveOrder,checkoutParameters,startCheckout,verifyWebhook,processWebhook,validatedSessionCreator}from'./core.mjs';
import worker,{createCommerceHandler}from'./worker.mjs';

const now=Date.UTC(2026,10,3,12),customer={id:'buyer-1',authenticated:true,role:'customer'},admin={id:'operator-1',authenticated:true,role:'operator'};
const config={checkoutEnabled:true,paymentIntegrationValidated:true,persistenceValidated:true,webhookEnabled:true,
  operatorOwnerId:'operator-1',
  priceId:'price_fixture3990',accountId:'acct_fixture',livemode:false,publicBaseUrl:'https://example.com',
  webhookSecret:'whsec_fixture_only_not_a_real_secret',directAccountWebhook:true};
const quoteInput=()=>({briefingId:randomUUID(),customerId:customer.id,title:'Objeto de teste',category:'site',scope:'Amostra identificada',capacityApproved:true,termsVersion:'termos-1',deliveryDueAt:new Date(now+86400000).toISOString()});
const req=q=>({quoteId:q.id,quoteVersion:q.version,acceptedTermsVersion:q.termsVersion,idempotencyKey:randomUUID(),quantity:1});
const parse=row=>row?JSON.parse(row.body):null;
function repository(){
  const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE quotes(id TEXT PRIMARY KEY,body TEXT NOT NULL);
    CREATE TABLE orders(id TEXT PRIMARY KEY,quote_id TEXT NOT NULL UNIQUE,body TEXT NOT NULL);
    CREATE TABLE reservations(customer_id TEXT NOT NULL,idem TEXT NOT NULL,quote_id TEXT NOT NULL,order_id TEXT NOT NULL,PRIMARY KEY(customer_id,idem));
    CREATE TABLE events(id TEXT PRIMARY KEY,body TEXT NOT NULL);`);
  function atomic(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
  const getOrder=id=>parse(db.prepare('SELECT body FROM orders WHERE id=?').get(id));
  const saveOrder=o=>db.prepare('UPDATE orders SET body=? WHERE id=?').run(JSON.stringify(o),o.id);
  return {durable:true,db,close:()=>db.close(),putQuote:q=>db.prepare('INSERT INTO quotes VALUES(?,?)').run(q.id,JSON.stringify(q)),
    async getQuote(id){return parse(db.prepare('SELECT body FROM quotes WHERE id=?').get(id));},async getOrder(id){return getOrder(id);},
    async getEvent(id){return parse(db.prepare('SELECT body FROM events WHERE id=?').get(id));},
    async reserveOrder(args){return atomic(()=>{
      const q=parse(db.prepare('SELECT body FROM quotes WHERE id=?').get(args.quoteId));
      if(!q||q.customerId!==args.customerId||q.version!==args.quoteVersion||q.termsVersion!==args.acceptedTermsVersion||q.expiresAt<=args.now||q.capacityApproved!==true||q.amount!==OFFER.amount||q.currency!==OFFER.currency)
        throw new CommerceError('Cotação alterada.',409,'QUOTE_CHANGED');
      const existing=db.prepare('SELECT * FROM reservations WHERE customer_id=? AND idem=?').get(args.customerId,args.idempotencyKey);
      if(existing){if(existing.quote_id!==args.quoteId)throw new CommerceError('Chave reutilizada para outro pedido.',409,'IDEMPOTENCY_CONFLICT');return getOrder(existing.order_id);}
      if(db.prepare('SELECT id FROM orders WHERE quote_id=?').get(args.quoteId))throw new CommerceError('Cotação já reservada.',409,'QUOTE_ALREADY_RESERVED');
      db.prepare('INSERT INTO orders VALUES(?,?,?)').run(args.order.id,args.quoteId,JSON.stringify(args.order));
      db.prepare('INSERT INTO reservations VALUES(?,?,?,?)').run(args.customerId,args.idempotencyKey,args.quoteId,args.order.id);return args.order;
    });},
    async attachCheckout({orderId,sessionId,url,expectedRevision}){return atomic(()=>{
      const o=getOrder(orderId);if(o.stripeSessionId===sessionId)return o;
      if(o.revision!==expectedRevision||o.stripeSessionId)throw new CommerceError('Conflito de sessão.',409,'SESSION_CONFLICT');
      o.stripeSessionId=sessionId;o.checkoutUrl=url;o.revision++;saveOrder(o);return o;
    });},
    async commitWebhook(args){return atomic(()=>{
      const seen=parse(db.prepare('SELECT body FROM events WHERE id=?').get(args.eventId));if(seen)return{duplicate:true,order:getOrder(args.orderId)};
      const o=getOrder(args.orderId);if(o.revision!==args.expectedRevision)return{conflict:true};
      Object.assign(o,args.update);o.revision++;saveOrder(o);
      db.prepare('INSERT INTO events VALUES(?,?)').run(args.eventId,JSON.stringify({id:args.eventId,orderId:args.orderId}));return{order:o,duplicate:false};
    });}
  };
}
async function setup(){const repo=repository(),q=createQuote(quoteInput(),admin,{now});repo.putQuote(q);const order=await reserveOrder(repo,req(q),customer,config,{now});return{repo,q,order};}
const sessionFor=o=>({id:'cs_test_fixture123',livemode:false,mode:'payment',amount_total:3990,currency:'brl',payment_status:'paid',
  metadata:{order_id:o.id,offer_version:o.offerVersion,quote_id:o.quoteId},client_reference_id:o.id});
async function attach(repo,o){return repo.attachCheckout({orderId:o.id,sessionId:'cs_test_fixture123',url:'https://checkout.stripe.com/c/pay/cs_test_fixture123',expectedRevision:o.revision});}
const eventFor=(o,overrides={})=>({id:'evt_'+randomUUID().replaceAll('-',''),type:'checkout.session.completed',livemode:false,data:{object:sessionFor(o)},...overrides});
async function signed(event,{at=now,secret=config.webhookSecret,raw=JSON.stringify(event)}={}){
  const t=Math.floor(at/1000),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw));
  return{raw,header:'t='+t+',v1='+Array.from(new Uint8Array(sig),b=>b.toString(16).padStart(2,'0')).join('')};
}

test('catalogue offers BRL39.90 but checkout stays disabled without explicit validation',()=>{
  assert.equal(catalogue().offer.unit_amount,3990);assert.equal(catalogue().checkout_enabled,false);assert.match(catalogue().notice,/global/);
  assert.equal(catalogue({...config,priceId:'invalid'}).checkout_enabled,false);assert.equal(catalogue({...config,checkoutEnabled:'false'}).checkout_enabled,false);
  assert.equal(catalogue({...config,webhookEnabled:false}).checkout_enabled,false);
});
test('quotes require authenticated operator, capacity approval and concrete scope/deadline',()=>{
  assert.throws(()=>createQuote(quoteInput(),customer,{now}),e=>e.code==='OPERATOR_REQUIRED');
  for(const patch of [{capacityApproved:false},{scope:''},{deliveryDueAt:new Date(now-1).toISOString()}])assert.throws(()=>createQuote({...quoteInput(),...patch},admin,{now}));
  const q=createQuote(quoteInput(),admin,{now});assert.equal(q.amount,3990);assert.ok(Object.isFrozen(q));
});
test('reservations reject client financial fields, altered quantity, wrong owner and unvalidated integration',async()=>{
  const repo=repository(),q=createQuote(quoteInput(),admin,{now});repo.putQuote(q);
  try{
    for(const patch of [{amount:1},{price:'price_free'},{paid:true},{seal:'OURO'},{quantity:2}])await assert.rejects(reserveOrder(repo,{...req(q),...patch},customer,config,{now}));
    await assert.rejects(reserveOrder(repo,req(q),{...customer,id:'other'},config,{now}),e=>e.code==='ORDER_FORBIDDEN');
    await assert.rejects(reserveOrder(repo,req(q),customer,{...config,paymentIntegrationValidated:false},{now}),e=>e.code==='CHECKOUT_NOT_ENABLED');
    await assert.rejects(reserveOrder({...repo,durable:false},req(q),customer,config,{now}),e=>e.code==='PERSISTENCE_UNAVAILABLE');
  }finally{repo.close();}
});
test('SQLite concurrent reservation is idempotent and one quote cannot create two orders',async()=>{
  const repo=repository(),q=createQuote(quoteInput(),admin,{now});repo.putQuote(q);const request=req(q);
  try{
    const rows=await Promise.all(Array.from({length:8},()=>reserveOrder(repo,request,customer,config,{now})));
    assert.equal(new Set(rows.map(o=>o.id)).size,1);assert.equal(repo.db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,1);
    await assert.rejects(reserveOrder(repo,req(q),customer,config,{now}),e=>e.code==='QUOTE_ALREADY_RESERVED');
  }finally{repo.close();}
});
test('quote/terms changes and expiry cannot be bypassed by a UUID or stale accepted version',async()=>{
  const repo=repository(),q=createQuote(quoteInput(),admin,{now});repo.putQuote(q);
  try{
    await assert.rejects(reserveOrder(repo,{...req(q),acceptedTermsVersion:'old'},customer,config,{now}),e=>e.code==='TERMS_MISMATCH');
    await assert.rejects(reserveOrder(repo,req(q),customer,config,{now:q.expiresAt}),e=>e.code==='QUOTE_EXPIRED');
  }finally{repo.close();}
});
test('Checkout uses server price, payment mode, stable idempotency, safe URLs and 8-letter integration suffix',async()=>{
  const{repo,order}=await setup();try{
    const a=checkoutParameters(order,customer,config,{now}),b=checkoutParameters(order,customer,config,{now});
    assert.deepEqual(a,b);assert.equal(a.params.mode,'payment');assert.deepEqual(a.params.line_items,[{price:'price_fixture3990',quantity:1}]);
    assert.equal(a.params.client_reference_id,order.id);assert.equal(a.params.metadata.offer_version,OFFER.version);
    assert.match(a.params.integration_identifier,/^foco_claro_avulso_[a-z]{8}$/);assert.equal(a.params.payment_method_types,undefined);
    assert.ok(a.params.expires_at>=Math.floor(now/1000)+1800);assert.ok(a.params.success_url.startsWith('https://example.com/'));
    for(const url of ['javascript:alert(1)','https://example.com@evil.com/path','https://127.0.0.1/','http://example.com/','https://example.com/?return=evil'])assert.throws(()=>checkoutParameters(order,customer,{...config,publicBaseUrl:url},{now}));
    assert.throws(()=>checkoutParameters(order,customer,config,{now:now+5*60000}),e=>e.code==='RESERVATION_EXPIRED');
  }finally{repo.close();}
});
test('startCheckout never calls provider when guards fail and uncertain outcome is not automatically retried',async()=>{
  const{repo,order}=await setup();let calls=0;try{
    const provider=async()=>{calls++;throw Error('synthetic-provider-body');};
    await assert.rejects(startCheckout(repo,order.id,customer,{...config,checkoutEnabled:false},provider,{now}),e=>e.code==='CHECKOUT_NOT_ENABLED');assert.equal(calls,0);
    await assert.rejects(startCheckout(repo,order.id,customer,config,provider,{now}),e=>e.code==='CHECKOUT_UNCERTAIN'&&!e.message.includes('synthetic'));assert.equal(calls,1);
  }finally{repo.close();}
});
test('same successful Checkout session is reused and provider account environment/host is validated',async()=>{
  const{repo,order}=await setup();let calls=0;try{
    const provider=async()=>{calls++;return{id:'cs_test_fixture123',livemode:false,url:'https://checkout.stripe.com/c/pay/cs_test_fixture123'};};
    const first=await startCheckout(repo,order.id,customer,config,provider,{now});const second=await startCheckout(repo,order.id,customer,config,provider,{now:now+10*60000});
    assert.equal(calls,1);assert.equal(first.sessionId,second.sessionId);assert.equal(second.reused,true);
    await assert.rejects(startCheckout(repo,order.id,customer,config,provider,{now:now+36*60000}),e=>e.code==='RESERVATION_EXPIRED');assert.equal(calls,1);
  }finally{repo.close();}
});

test('concurrent Checkout calls carry the same provider idempotency key and attach one session',async()=>{
  const{repo,order}=await setup(),keys=[];try{
    const provider=async(_params,options)=>{keys.push(options.idempotencyKey);return{id:'cs_test_fixture123',livemode:false,url:'https://checkout.stripe.com/c/pay/cs_test_fixture123'};};
    const sessions=await Promise.all([startCheckout(repo,order.id,customer,config,provider,{now}),startCheckout(repo,order.id,customer,config,provider,{now})]);
    assert.equal(new Set(keys).size,1);assert.equal(new Set(sessions.map(s=>s.sessionId)).size,1);assert.equal((await repo.getOrder(order.id)).revision,1);
  }finally{repo.close();}
});
test('WebCrypto validates exact raw body, rejects invalid signature/replay/future timestamp and accepts secret rotation signatures',async()=>{
  const event={id:'evt_fixture',type:'ignored',livemode:false,data:{object:{}}};const good=await signed(event);
  assert.equal((await verifyWebhook(good.raw,good.header,config.webhookSecret,{now})).id,event.id);
  assert.equal((await verifyWebhook(good.raw,good.header+',v1='+'0'.repeat(64),config.webhookSecret,{now})).id,event.id);
  await assert.rejects(verifyWebhook(good.raw+' ',good.header,config.webhookSecret,{now}),e=>e.code==='INVALID_SIGNATURE');
  for(const delta of [-301000,301000]){const stale=await signed(event,{at:now+delta});await assert.rejects(verifyWebhook(stale.raw,stale.header,config.webhookSecret,{now}),e=>e.code==='STALE_EVENT');}
  await assert.rejects(verifyWebhook(good.raw,good.header,config.webhookSecret,{now,toleranceSeconds:0}));
});
test('signed paid event queues assisted work, never delivers, starts AI or writes a seal',async()=>{
  const{repo,order}=await setup();await attach(repo,order);try{
    const event=eventFor(order),s=await signed(event);const out=await processWebhook(repo,s.raw,s.header,config,{now});const stored=await repo.getOrder(order.id);
    assert.equal(out.paymentStatus,'paid_confirmed');assert.equal(out.fulfillmentStatus,'queued_assisted');
    assert.equal(stored.seal,undefined);assert.equal(stored.score,undefined);assert.equal(stored.deliveredAt,undefined);
  }finally{repo.close();}
});
test('concurrent duplicate webhook produces one persisted event and one state change',async()=>{
  const{repo,order}=await setup();const current=await attach(repo,order);try{
    const event=eventFor(order),s=await signed(event);await Promise.all(Array.from({length:8},()=>processWebhook(repo,s.raw,s.header,config,{now})));
    assert.equal(repo.db.prepare('SELECT COUNT(*) AS n FROM events').get().n,1);assert.equal((await repo.getOrder(order.id)).revision,current.revision+1);
  }finally{repo.close();}
});
test('completed unpaid is pending; later asynchronous paid event queues work',async()=>{
  const{repo,order}=await setup();await attach(repo,order);try{
    const event=eventFor(order);event.data.object.payment_status='unpaid';let s=await signed(event);
    assert.equal((await processWebhook(repo,s.raw,s.header,config,{now})).paymentStatus,'pending');assert.equal((await repo.getOrder(order.id)).fulfillmentStatus,'not_started');
    const paid=eventFor(order,{type:'checkout.session.async_payment_succeeded'});s=await signed(paid);
    assert.equal((await processWebhook(repo,s.raw,s.header,config,{now})).paymentStatus,'paid_confirmed');
  }finally{repo.close();}
});
test('async success without paid is rejected; failure/expiry cannot downgrade a paid order',async()=>{
  const{repo,order}=await setup();await attach(repo,order);try{
    const bad=eventFor(order,{type:'checkout.session.async_payment_succeeded'});bad.data.object.payment_status='unpaid';let s=await signed(bad);
    await assert.rejects(processWebhook(repo,s.raw,s.header,config,{now}),e=>e.code==='PAYMENT_NOT_PAID');
    const paid=eventFor(order);s=await signed(paid);await processWebhook(repo,s.raw,s.header,config,{now});
    for(const type of ['checkout.session.async_payment_failed','checkout.session.expired']){s=await signed(eventFor(order,{type}));assert.equal((await processWebhook(repo,s.raw,s.header,config,{now})).paymentStatus,'paid_confirmed');}
  }finally{repo.close();}
});
test('amount, currency, account, environment, mode, session and metadata mismatches cannot confirm payment',async()=>{
  for(const change of [e=>e.data.object.amount_total=1,e=>e.data.object.currency='usd',e=>e.account='acct_other',e=>e.livemode=true,e=>e.data.object.livemode=true,e=>e.data.object.mode='subscription',e=>e.data.object.id='cs_test_other',e=>e.data.object.client_reference_id=randomUUID(),e=>e.data.object.metadata.offer_version='other',e=>e.data.object.metadata.quote_id=randomUUID()]){
    const{repo,order}=await setup();await attach(repo,order);try{
      const e=eventFor(order);change(e);const s=await signed(e);await assert.rejects(processWebhook(repo,s.raw,s.header,config,{now}));assert.equal((await repo.getOrder(order.id)).paymentStatus,'pending');assert.equal(repo.db.prepare('SELECT COUNT(*) AS n FROM events').get().n,0);
    }finally{repo.close();}
  }
});
test('direct-account binding, webhook validation and durable persistence are required',async()=>{
  const{repo,order}=await setup();await attach(repo,order);try{
    const s=await signed(eventFor(order));
    await assert.rejects(processWebhook(repo,s.raw,s.header,{...config,directAccountWebhook:false},{now}),e=>e.code==='ACCOUNT_BINDING_UNCONFIRMED');
    for(const patch of [{webhookEnabled:false},{paymentIntegrationValidated:false},{persistenceValidated:false}])await assert.rejects(processWebhook(repo,s.raw,s.header,{...config,...patch},{now}),e=>e.code==='WEBHOOK_NOT_ENABLED');
    await assert.rejects(processWebhook({...repo,durable:false},s.raw,s.header,config,{now}),e=>e.code==='WEBHOOK_NOT_ENABLED');
  }finally{repo.close();}
});

test('concurrent different events and late unpaid completed events preserve terminal payment state',async()=>{
  const{repo,order}=await setup();await attach(repo,order);try{
    const paid=await signed(eventFor(order));const expired=await signed(eventFor(order,{type:'checkout.session.expired'}));
    await Promise.all([processWebhook(repo,paid.raw,paid.header,config,{now}),processWebhook(repo,expired.raw,expired.header,config,{now})]);
    assert.equal((await repo.getOrder(order.id)).paymentStatus,'paid_confirmed');
    const late=eventFor(order);late.data.object.payment_status='unpaid';const s=await signed(late);await processWebhook(repo,s.raw,s.header,config,{now});
    assert.equal((await repo.getOrder(order.id)).paymentStatus,'paid_confirmed');
  }finally{repo.close();}
});

test('default Worker exposes an honest catalogue and cannot start a payment or accept webhook',async()=>{
  const cat=await worker.fetch(new Request('https://example.com/api/comercio/catalogo'));assert.equal(cat.status,200);assert.equal((await cat.json()).checkout_enabled,false);
  const checkout=await worker.fetch(new Request('https://example.com/api/comercio/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:randomUUID()})}));assert.equal(checkout.status,401);
  const webhook=await worker.fetch(new Request('https://example.com/api/comercio/webhook',{method:'POST',body:'{}'}));assert.equal(webhook.status,503);
});

test('Worker rejects fake identity, client prices, cross-origin POST, and another buyer order',async()=>{
  const{repo,order}=await setup();let calls=0;try{
    const handler=createCommerceHandler({repository:repo,resolveIdentity:async()=>customer,config,createStripeSession:async()=>{calls++;throw Error();},now:()=>now});
    const req=(data,origin='https://example.com')=>new Request('https://example.com/api/comercio/checkout',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(data)});
    assert.equal((await handler(req({orderId:order.id,price:1}))).status,400);
    assert.equal((await handler(req({orderId:order.id},'https://evil.example'))).status,403);
    const other=createCommerceHandler({repository:repo,resolveIdentity:async()=>({...customer,id:'other'}),config,now:()=>now});
    assert.equal((await other(new Request('https://example.com/api/comercio/pedidos/'+order.id))).status,404);assert.equal(calls,0);
  }finally{repo.close();}
});

test('authentication and flags require boolean true; role cannot make an arbitrary user the operator',async()=>{
  assert.throws(()=>createQuote(quoteInput(),{...admin,authenticated:'false'},{now}),e=>e.code==='AUTH_REQUIRED');
  const repo=repository();try{
    const handler=createCommerceHandler({repository:repo,resolveIdentity:async()=>({...customer,role:'operator'}),config,now:()=>now});
    const response=await handler(new Request('https://example.com/api/comercio/cotacoes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(quoteInput())}));
    assert.equal(response.status,403);assert.equal(repo.db.prepare('SELECT COUNT(*) AS n FROM quotes').get().n,0);
    const fake=createCommerceHandler({resolveIdentity:async()=>({...admin,authenticated:'false'}),config});
    assert.equal((await fake(new Request('https://example.com/api/comercio/checkout',{method:'POST'}))).status,401);
  }finally{repo.close();}
});

test('actual Stripe Price must be active, one-time 3990 BRL in the same environment before creating Checkout',async()=>{
  const{repo,order}=await setup();let calls=0;try{
    const params=checkoutParameters(order,customer,config,{now});
    const base={id:config.priceId,active:true,type:'one_time',unit_amount:3990,currency:'brl',livemode:false};
    for(const patch of [{active:false},{type:'recurring'},{unit_amount:1},{currency:'usd'},{livemode:true},{recurring:{interval:'month'}}]){
      const create=validatedSessionCreator({retrievePrice:async()=>({...base,...patch}),createSession:async()=>{calls++;}},config);
      await assert.rejects(create(params.params,{idempotencyKey:params.idempotencyKey}),e=>e.code==='PRICE_MISMATCH');
    }
    assert.equal(calls,0);
    const create=validatedSessionCreator({retrievePrice:async()=>base,createSession:async(p,o)=>{calls++;return{p,o};}},config);
    const result=await create(params.params,{idempotencyKey:params.idempotencyKey});assert.equal(calls,1);assert.equal(result.o.idempotencyKey,params.idempotencyKey);
  }finally{repo.close();}
});
