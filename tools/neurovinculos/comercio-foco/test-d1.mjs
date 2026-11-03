import test from'node:test';
import assert from'node:assert/strict';
import {DatabaseSync}from'node:sqlite';
import {readFileSync,mkdtempSync,rmSync}from'node:fs';
import {join}from'node:path';
import {tmpdir}from'node:os';
import {randomUUID}from'node:crypto';
import {createD1Repository}from'./d1-repository.mjs';
import {createQuote,reserveOrder,processWebhook}from'./core.mjs';
const now=Date.UTC(2026,10,3,12),customer={id:'buyer',authenticated:true,role:'customer'},operator={id:'owner',authenticated:true,role:'operator'};
const config={checkoutEnabled:true,paymentIntegrationValidated:true,persistenceValidated:true,webhookEnabled:true,operatorOwnerId:'owner',priceId:'price_fixture3990',accountId:'acct_fixture',livemode:false,publicBaseUrl:'https://example.com',webhookSecret:'whsec_fixture_for_test_only',directAccountWebhook:true};
const migration=readFileSync(new URL('./drizzle/0000_comercio_foco.sql',import.meta.url),'utf8');
function d1({filename=':memory:',migrate=true}={}){
  const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON');if(migrate)sqlite.exec(migration);
  function query(sql,params){const stmt=sqlite.prepare(sql);if(stmt.columns().length)return{success:true,results:stmt.all(...params),meta:{}};const r=stmt.run(...params);return{success:true,results:[],meta:{changes:Number(r.changes)}};}
  return{sqlite,close:()=>sqlite.close(),prepare(sql){return{bind(...params){return{sql,params,async first(){return query(sql,params).results[0]||null;},async all(){return query(sql,params);},async run(){return query(sql,params);}};}};},
    async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const rows=statements.map(s=>query(s.sql,s.params));sqlite.exec('COMMIT');return rows;}catch(e){sqlite.exec('ROLLBACK');throw e;}}
  };
}
function quote(){return createQuote({briefingId:randomUUID(),customerId:customer.id,title:'Objeto de teste',category:'site',scope:'Amostra de teste',capacityApproved:true,termsVersion:'t1',deliveryDueAt:new Date(now+86400000).toISOString()},operator,{now});}
const request=q=>({quoteId:q.id,quoteVersion:q.version,acceptedTermsVersion:q.termsVersion,idempotencyKey:randomUUID()});
async function setup(){const db=d1(),repo=createD1Repository(db,{operatorOwnerId:'owner'}),q=quote();await repo.putQuote(q);const order=await reserveOrder(repo,request(q),customer,config,{now});return{db,repo,q,order};}
async function eventFor(o,type='checkout.session.completed'){
  const event={id:'evt_'+randomUUID().replaceAll('-',''),type,livemode:false,data:{object:{id:'cs_test_fixture123',livemode:false,mode:'payment',amount_total:3990,currency:'brl',payment_status:'paid',metadata:{order_id:o.id,offer_version:o.offerVersion,quote_id:o.quoteId},client_reference_id:o.id}}};
  const raw=JSON.stringify(event),t=Math.floor(now/1000),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(config.webhookSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw));return{event,raw,signature:'t='+t+',v1='+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')};
}
test('D1 requires a database, batch API and explicit operator identity',()=>{
  assert.throws(()=>createD1Repository({prepare(){}}));const db=d1();try{assert.throws(()=>createD1Repository(db));}finally{db.close();}
});
test('D1 quote is immutable and rejects another signed-in operator',async()=>{
  const db=d1(),repo=createD1Repository(db,{operatorOwnerId:'owner'}),q=quote();try{
    await repo.putQuote(q);await repo.putQuote(q);
    await assert.rejects(repo.putQuote({...q,scope:'changed'}),e=>e.code==='QUOTE_IMMUTABLE');
    await assert.rejects(repo.putQuote({...q,id:randomUUID(),operatorId:'attacker'}),e=>e.code==='OPERATOR_REQUIRED');
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM foco_commerce_quotes').get().n,1);
  }finally{db.close();}
});
test('real D1 SQL reserves one quote once under concurrent calls and persists idempotency',async()=>{
  const db=d1(),repo=createD1Repository(db,{operatorOwnerId:'owner'}),q=quote();await repo.putQuote(q);const r=request(q);try{
    const orders=await Promise.all(Array.from({length:10},()=>reserveOrder(repo,r,customer,config,{now})));
    assert.equal(new Set(orders.map(o=>o.id)).size,1);assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM foco_commerce_orders').get().n,1);
    await assert.rejects(reserveOrder(repo,request(q),customer,config,{now}),e=>e.code==='QUOTE_ALREADY_RESERVED');
    const other=quote();await repo.putQuote(other);await assert.rejects(reserveOrder(repo,{...request(other),idempotencyKey:r.idempotencyKey},customer,config,{now}),e=>e.code==='IDEMPOTENCY_CONFLICT');
  }finally{db.close();}
});
test('D1 Checkout link uses CAS and cannot attach a second session',async()=>{
  const{db,repo,order}=await setup();try{
    const args={orderId:order.id,sessionId:'cs_test_fixture123',url:'https://checkout.stripe.com/c/pay/cs_test_fixture123',expectedRevision:0};
    const rows=await Promise.all([repo.attachCheckout(args),repo.attachCheckout(args)]);assert.equal(rows[0].revision,1);assert.equal(rows[1].revision,1);
    await assert.rejects(repo.attachCheckout({...args,sessionId:'cs_test_other',expectedRevision:1}),e=>e.code==='SESSION_CONFLICT');
  }finally{db.close();}
});
test('D1 batch commits paid state and unique processed event atomically under concurrent deliveries',async()=>{
  const{db,repo,order}=await setup();await repo.attachCheckout({orderId:order.id,sessionId:'cs_test_fixture123',url:'https://checkout.stripe.com/c/pay/cs_test_fixture123',expectedRevision:0});try{
    const e=await eventFor(order);await Promise.all(Array.from({length:8},()=>processWebhook(repo,e.raw,e.signature,config,{now})));
    const row=await repo.getOrder(order.id);assert.equal(row.paymentStatus,'paid_confirmed');assert.equal(row.fulfillmentStatus,'queued_assisted');assert.equal(row.revision,2);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM foco_commerce_events WHERE processed=1').get().n,1);
    assert.equal(row.seal,undefined);assert.equal(row.deliveredAt,undefined);
  }finally{db.close();}
});
test('D1 rollback removes the event claim when the order update fails',async()=>{
  const{db,repo,order}=await setup();await repo.attachCheckout({orderId:order.id,sessionId:'cs_test_fixture123',url:'https://checkout.stripe.com/c/pay/cs_test_fixture123',expectedRevision:0});
  db.sqlite.exec(`CREATE TRIGGER fixture_fail_update BEFORE UPDATE ON foco_commerce_orders BEGIN SELECT RAISE(ABORT,'synthetic_failure'); END;`);
  try{
    const e=await eventFor(order);await assert.rejects(processWebhook(repo,e.raw,e.signature,config,{now}),e=>e.code==='PERSISTENCE_UNAVAILABLE');
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM foco_commerce_events').get().n,0);assert.equal((await repo.getOrder(order.id)).paymentStatus,'pending');
  }finally{db.close();}
});
test('D1 missing schema fails closed without leaking raw database error',async()=>{
  const db=d1({migrate:false}),repo=createD1Repository(db,{operatorOwnerId:'owner'});try{
    await assert.rejects(repo.getOrder(randomUUID()),e=>e.code==='PERSISTENCE_UNAVAILABLE'&&!e.message.includes('no such table'));
  }finally{db.close();}
});
test('D1 adapter state survives a real SQLite file close and reopen',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'foco-commerce-')),filename=join(dir,'fixture.sqlite');let db=d1({filename}),repo=createD1Repository(db,{operatorOwnerId:'owner'});const q=quote();
  try{
    await repo.putQuote(q);const r=request(q),order=await reserveOrder(repo,r,customer,config,{now});db.close();db=d1({filename,migrate:false});repo=createD1Repository(db,{operatorOwnerId:'owner'});
    assert.equal((await repo.getOrder(order.id)).amount,3990);assert.equal((await reserveOrder(repo,r,customer,config,{now})).id,order.id);
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
