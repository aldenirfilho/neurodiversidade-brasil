/** Commerce boundary: a payment pays for editorial work, never a score or seal. */
export const OFFER = Object.freeze({id:'relatorio-avulso',version:'relatorio-avulso-1',amount:3990,currency:'brl',quantity:1,
  title:'FOCO CLARO — relatório editorial avulso',globalDailyAttemptLimit:3});
const enc=new TextEncoder();
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const clean=(v,max=1200)=>typeof v==='string'?v.trim().slice(0,max):'';
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export class CommerceError extends Error{constructor(message,status=400,code='INVALID_REQUEST'){super(message);this.status=status;this.code=code;}}
const fail=(message,status=400,code='INVALID_REQUEST')=>{throw new CommerceError(message,status,code);};
function identity(actor){if(actor?.authenticated!==true||!clean(actor.id,200))fail('Autenticação necessária.',401,'AUTH_REQUIRED');return actor.id;}
function operator(actor){identity(actor);if(actor.role!=='operator')fail('Aprovação do operador necessária.',403,'OPERATOR_REQUIRED');}
function requiredUUID(value,label){if(typeof value!=='string'||!UUID.test(value))fail(label+' inválido.');return value;}
function configured(config){
  if(config?.checkoutEnabled!==true||config.paymentIntegrationValidated!==true||config.persistenceValidated!==true)
    fail('Checkout ainda não habilitado e validado.',503,'CHECKOUT_NOT_ENABLED');
  if(config.webhookEnabled!==true||typeof config.webhookSecret!=='string'||!config.webhookSecret.startsWith('whsec_'))
    fail('Confirme o webhook de pagamento antes de abrir o checkout.',503,'WEBHOOK_NOT_CONFIGURED');
  if(!/^price_[A-Za-z0-9]+$/.test(config.priceId||'')||!/^acct_[A-Za-z0-9]+$/.test(config.accountId||'')||typeof config.livemode!=='boolean'||!clean(config.operatorOwnerId,200))
    fail('Configuração de pagamento incompleta.',503,'CHECKOUT_NOT_CONFIGURED');
  stableOrigin(config.publicBaseUrl);
}
function stableOrigin(value){
  let u;try{u=new URL(value);}catch{fail('Endereço de retorno não configurado.',503,'CHECKOUT_NOT_CONFIGURED');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||u.hostname.endsWith('.local')||u.hostname==='localhost'||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':'))
    fail('Endereço de retorno não autorizado.',503,'CHECKOUT_NOT_CONFIGURED');
  return u.origin;
}
function randomSuffix(){const out=[];while(out.length<8){for(const byte of crypto.getRandomValues(new Uint8Array(16))){if(byte<234)out.push(String.fromCharCode(97+byte%26));if(out.length===8)break;}}return out.join('');}
export function catalogue(config={}){let enabled=false;try{configured(config);enabled=true;}catch{}return {offer:{...OFFER,unit_amount:OFFER.amount},price_confirmed:true,
  checkout_enabled:enabled,mode:enabled?'configured':'pilot_no_charge',
  availability:'Prazo e capacidade sujeitos à confirmação do operador.',
  notice:'Um objeto/edição/amostra por relatório. Pagamento não garante nota ou selo. A cota de 3 tentativas/dia é global, não por comprador.'};}

/** Only an authenticated operator can create this trusted, immutable quote snapshot. */
export function createQuote(input,actor,{now=Date.now(),uuid=()=>crypto.randomUUID()}={}){
  operator(actor);
  if(!obj(input)||input.capacityApproved!==true)fail('Confirme o prazo e a capacidade antes de cotar.',409,'CAPACITY_NOT_APPROVED');
  const customerId=clean(input.customerId,200),scope=clean(input.scope),title=clean(input.title,240);
  if(!customerId||!scope||!title||!['jogo','filme','serie','site','pdf'].includes(input.category))fail('Identifique comprador, objeto, categoria e escopo.');
  if(typeof input.scope!=='string'||input.scope.length>1200||typeof input.title!=='string'||input.title.length>240||input.customerId.length>200)fail('Cotação acima do limite de tamanho.');
  const due=Date.parse(input.deliveryDueAt);if(!Number.isFinite(due)||due<=now)fail('Defina um prazo futuro de entrega.');
  if(!clean(input.termsVersion,80))fail('Defina a versão dos termos.');
  return Object.freeze({id:requiredUUID(uuid(),'ID da cotação'),briefingId:requiredUUID(input.briefingId,'ID do briefing'),customerId,title,category:input.category,scope,
    offerId:OFFER.id,offerVersion:OFFER.version,amount:OFFER.amount,currency:OFFER.currency,quantity:1,
    capacityApproved:true,operatorId:actor.id,approvedAt:now,deliveryDueAt:new Date(due).toISOString(),termsVersion:input.termsVersion,
    expiresAt:now+30*60*1000,version:1});
}
function rejectFinancialFields(input){for(const key of ['price','priceId','price_id','amount','unit_amount','amount_total','currency','paid','payment_status','seal','score'])if(Object.hasOwn(input,key))fail('Preço, pagamento e resultado não são definidos pelo cliente.');if(input.quantity!==undefined&&input.quantity!==1)fail('Cada pedido cobre exatamente um relatório.');}
function checkOwner(order,actor){const id=identity(actor);if(order.customerId!==id)fail('Pedido não autorizado.',403,'ORDER_FORBIDDEN');}
function checkQuote(quote,request,actor,now){
  checkOwner(quote,actor);
  if(quote.expiresAt<=now)fail('A cotação expirou. Peça uma nova confirmação.',409,'QUOTE_EXPIRED');
  if(quote.capacityApproved!==true||!quote.operatorId)fail('Capacidade sem aprovação.',409,'CAPACITY_NOT_APPROVED');
  if(quote.amount!==OFFER.amount||quote.currency!==OFFER.currency||quote.offerVersion!==OFFER.version||quote.quantity!==1)fail('Cotação incompatível com a oferta.',409,'QUOTE_MISMATCH');
  if(request.quoteVersion!==quote.version||request.acceptedTermsVersion!==quote.termsVersion)fail('Confira a versão da cotação e aceite os termos atuais.',409,'TERMS_MISMATCH');
}
/** Repository.reserveOrder must atomically recheck quote state + idempotency and reserve once. */
export async function reserveOrder(repo,request,actor,config,{now=Date.now(),uuid=()=>crypto.randomUUID()}={}){
  identity(actor);configured(config);if(!obj(request))fail('Pedido inválido.');rejectFinancialFields(request);
  const quoteId=requiredUUID(request.quoteId,'Cotação'),key=requiredUUID(request.idempotencyKey,'Chave do pedido');
  if(repo?.durable!==true||typeof repo.reserveOrder!=='function'||typeof repo.getQuote!=='function')fail('Persistência comercial indisponível.',503,'PERSISTENCE_UNAVAILABLE');
  const quote=await repo.getQuote(quoteId);if(!quote)fail('Cotação não encontrada.',404,'QUOTE_NOT_FOUND');checkQuote(quote,request,actor,now);
  if(quote.operatorId!==config.operatorOwnerId)fail('Cotação não aprovada pelo operador autorizado.',403,'OPERATOR_REQUIRED');
  const order={id:requiredUUID(uuid(),'Pedido'),quoteId,quoteVersion:quote.version,briefingId:quote.briefingId,customerId:quote.customerId,
    offerId:OFFER.id,offerVersion:OFFER.version,amount:OFFER.amount,currency:OFFER.currency,quantity:1,
    title:quote.title,category:quote.category,scope:quote.scope,deliveryDueAt:quote.deliveryDueAt,termsVersion:quote.termsVersion,
    capacityApproved:true,approvedBy:quote.operatorId,createdAt:now,reservationExpiresAt:now+35*60*1000,
    stripeAccountId:config.accountId,livemode:config.livemode,integrationIdentifier:'foco_claro_avulso_'+randomSuffix(),
    paymentStatus:'pending',fulfillmentStatus:'not_started',stripeSessionId:null,checkoutUrl:null,revision:0};
  return repo.reserveOrder({quoteId,quoteVersion:quote.version,customerId:actor.id,idempotencyKey:key,acceptedTermsVersion:request.acceptedTermsVersion,now,order});
}
function payableOrder(order,actor,config,now){
  configured(config);checkOwner(order,actor);
  if(order.paymentStatus!=='pending'||order.capacityApproved!==true||!order.approvedBy)fail('Pedido sem aprovação para pagamento.',409,'ORDER_NOT_PAYABLE');
  if(order.reservationExpiresAt<=now)fail('Reserva expirada.',409,'RESERVATION_EXPIRED');
  if(order.amount!==OFFER.amount||order.currency!==OFFER.currency||order.quantity!==1||order.offerVersion!==OFFER.version||order.stripeAccountId!==config.accountId||order.livemode!==config.livemode)
    fail('Pedido ou ambiente incompatível.',409,'ORDER_MISMATCH');
  if(!/^foco_claro_avulso_[a-z]{8}$/.test(order.integrationIdentifier||''))fail('Identificação da integração inválida.',409);
}
export function checkoutParameters(order,actor,config,{now=Date.now()}={}){
  payableOrder(order,actor,config,now);
  if(order.reservationExpiresAt<now+31*60*1000)fail('Renove a reserva antes de iniciar o pagamento.',409,'RESERVATION_EXPIRED');
  const base=stableOrigin(config.publicBaseUrl);
  return {params:{mode:'payment',line_items:[{price:config.priceId,quantity:1}],client_reference_id:order.id,
    metadata:{order_id:order.id,offer_version:OFFER.version,quote_id:order.quoteId},
    success_url:base+'/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}',cancel_url:base+'/pedido/cancelado?order_id='+order.id,
    expires_at:Math.floor(order.reservationExpiresAt/1000),integration_identifier:order.integrationIdentifier},idempotencyKey:'foco-checkout-'+order.id};
}
export async function startCheckout(repo,orderId,actor,config,createSession,{now=Date.now()}={}){
  configured(config);requiredUUID(orderId,'Pedido');const order=await repo.getOrder(orderId);if(!order)fail('Pedido não encontrado.',404);checkOwner(order,actor);
  payableOrder(order,actor,config,now);
  if(order.stripeSessionId&&order.checkoutUrl)return {orderId:order.id,sessionId:order.stripeSessionId,url:order.checkoutUrl,reused:true};
  const request=checkoutParameters(order,actor,config,{now});
  if(typeof createSession!=='function'||typeof repo.attachCheckout!=='function')fail('Pagamento ainda não configurado.',503,'CHECKOUT_NOT_CONFIGURED');
  // The provider adapter must send this idempotency key; no retry with a new key after uncertainty.
  let session;try{session=await createSession(request.params,{idempotencyKey:request.idempotencyKey});}catch{fail('Pagamento não confirmado. Reconciliar esta tentativa antes de repetir.',502,'CHECKOUT_UNCERTAIN');}
  let url;try{url=new URL(session?.url);}catch{fail('Sessão de pagamento inválida.',502);}
  if(!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(session.id||'')||session.livemode!==config.livemode||url.protocol!=='https:'||url.hostname!=='checkout.stripe.com'||url.username||url.password||url.port)
    fail('Sessão incompatível com o ambiente.',502,'CHECKOUT_MISMATCH');
  const saved=await repo.attachCheckout({orderId:order.id,sessionId:session.id,url:url.href,expectedRevision:order.revision});
  return {orderId:order.id,sessionId:saved.stripeSessionId,url:saved.checkoutUrl,reused:false};
}
const fromHex=h=>Uint8Array.from(h.match(/../g)||[],part=>parseInt(part,16));
export async function verifyWebhook(rawBody,signatureHeader,secret,{now=Date.now(),toleranceSeconds=300}={}){
  if(typeof secret!=='string'||!secret.startsWith('whsec_')||secret.length<12)fail('Segredo de webhook indisponível.',503,'WEBHOOK_NOT_CONFIGURED');
  if(typeof rawBody!=='string'||enc.encode(rawBody).length>262144)fail('Corpo de evento inválido ou excessivo.',413,'INVALID_WEBHOOK');
  if(typeof signatureHeader!=='string'||signatureHeader.length>2048||toleranceSeconds!==300)fail('Assinatura inválida.',400,'INVALID_SIGNATURE');
  const pairs=signatureHeader.split(',').map(s=>s.trim().split('='));const times=pairs.filter(([k])=>k==='t');
  if(times.length!==1||!/^\d{1,12}$/.test(times[0][1]||''))fail('Assinatura inválida.',400,'INVALID_SIGNATURE');
  const timestamp=Number(times[0][1]);if(Math.abs(Math.floor(now/1000)-timestamp)>300)fail('Evento fora do intervalo de segurança.',400,'STALE_EVENT');
  const signatures=pairs.filter(([k,v])=>k==='v1'&&/^[a-f\d]{64}$/i.test(v||'')).slice(0,5);if(!signatures.length)fail('Assinatura inválida.',400,'INVALID_SIGNATURE');
  const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const body=enc.encode(String(timestamp)+'.'+rawBody);let verified=false;
  for(const [,sig]of signatures)verified=(await crypto.subtle.verify('HMAC',key,fromHex(sig),body))||verified;
  if(!verified)fail('Assinatura inválida.',400,'INVALID_SIGNATURE');
  let event;try{event=JSON.parse(rawBody);}catch{fail('Evento JSON inválido.',400,'INVALID_WEBHOOK');}
  if(!obj(event)||!/^evt_[A-Za-z0-9]+$/.test(event.id||'')||typeof event.type!=='string'||!obj(event.data?.object)||typeof event.livemode!=='boolean')fail('Evento inválido.',400,'INVALID_WEBHOOK');
  return event;
}
const handled=new Set(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired']);
function validatePaidObject(event,session,order,config){
  const account=event.account;
  if(account!==undefined&&account!==config.accountId)fail('Conta de evento incompatível.',400,'EVENT_ACCOUNT_MISMATCH');
  if(account===undefined&&config.directAccountWebhook!==true)fail('Vinculação da conta do webhook não confirmada.',503,'ACCOUNT_BINDING_UNCONFIRMED');
  if(config.accountId!==order.stripeAccountId||config.livemode!==order.livemode||event.livemode!==order.livemode||session.livemode!==order.livemode)
    fail('Ambiente de evento incompatível.',400,'EVENT_ENV_MISMATCH');
  if(session.id!==order.stripeSessionId||session.metadata?.order_id!==order.id||session.client_reference_id!==order.id||session.metadata?.offer_version!==order.offerVersion||session.metadata?.quote_id!==order.quoteId)
    fail('Evento não corresponde ao pedido.',400,'EVENT_ORDER_MISMATCH');
  if(session.mode!=='payment'||session.currency!==order.currency||session.currency!==OFFER.currency||session.amount_total!==order.amount||session.amount_total!==OFFER.amount||order.quantity!==1)
    fail('Valor ou modalidade incompatível.',400,'EVENT_AMOUNT_MISMATCH');
}
function transition(event,order,now){
  const session=event.data.object;let payment=order.paymentStatus,fulfillment=order.fulfillmentStatus;
  if(event.type==='checkout.session.async_payment_succeeded'&&session.payment_status!=='paid')fail('Sucesso assíncrono sem pagamento confirmado.',400,'PAYMENT_NOT_PAID');
  if((event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded')&&session.payment_status==='paid'){
    payment='paid_confirmed';if(fulfillment==='not_started')fulfillment='queued_assisted';
  }else if(payment!=='paid_confirmed'){
    if(event.type==='checkout.session.async_payment_failed')payment='failed';
    else if(event.type==='checkout.session.expired')payment='expired';
    else if(!['failed','expired'].includes(payment))payment='pending';
  }
  return {paymentStatus:payment,fulfillmentStatus:fulfillment,updatedAt:now,lastStripeEventId:event.id};
}
/** commitWebhook must atomically dedupe event ID and compare-and-swap the order revision. */
export async function processWebhook(repo,rawBody,signatureHeader,config,{now=Date.now()}={}){
  if(config?.webhookEnabled!==true||config.paymentIntegrationValidated!==true||config.persistenceValidated!==true||repo?.durable!==true)
    fail('Webhook ainda não habilitado e validado.',503,'WEBHOOK_NOT_ENABLED');
  if(['getEvent','getOrder','commitWebhook'].some(k=>typeof repo[k]!=='function'))fail('Persistência comercial indisponível.',503,'PERSISTENCE_UNAVAILABLE');
  const event=await verifyWebhook(rawBody,signatureHeader,config.webhookSecret,{now});
  if(!handled.has(event.type))return {received:true,ignored:true};
  const session=event.data.object,orderId=requiredUUID(session.metadata?.order_id,'Pedido do evento');
  for(let attempt=0;attempt<3;attempt++){
    if(await repo.getEvent(event.id))return {received:true,duplicate:true};
    const order=await repo.getOrder(orderId);if(!order)fail('Pedido do evento não encontrado.',404,'EVENT_ORDER_NOT_FOUND');
    validatePaidObject(event,session,order,config);
    const update=transition(event,order,now);
    const result=await repo.commitWebhook({eventId:event.id,eventType:event.type,orderId,sessionId:session.id,expectedRevision:order.revision,update,receivedAt:now});
    if(result?.conflict)continue;
    return {received:true,duplicate:result?.duplicate===true,paymentStatus:result?.order?.paymentStatus||order.paymentStatus,
      fulfillmentStatus:result?.order?.fulfillmentStatus||order.fulfillmentStatus};
  }
  fail('Evento aguardando reconciliação concorrente.',503,'EVENT_CONFLICT');
}

/** Bind callbacks from a trusted StripeClient instance; verify the actual immutable Price before creating a chargeable session. */
export function validatedSessionCreator({retrievePrice,createSession},config){
  if(typeof retrievePrice!=='function'||typeof createSession!=='function')fail('Adaptador Stripe indisponível.',503,'CHECKOUT_NOT_CONFIGURED');
  return async(params,options)=>{
    configured(config);
    if(params?.mode!=='payment'||params.line_items?.length!==1||params.line_items[0]?.price!==config.priceId||params.line_items[0]?.quantity!==1)
      fail('Parâmetros de pagamento divergentes.',400,'PRICE_MISMATCH');
    let price;try{price=await retrievePrice(config.priceId);}catch{fail('Preço não verificado; checkout não iniciado.',502,'PRICE_UNVERIFIED');}
    if(price?.id!==config.priceId||price.active!==true||price.type!=='one_time'||price.unit_amount!==OFFER.amount||price.currency!==OFFER.currency||price.livemode!==config.livemode||price.recurring)
      fail('Preço Stripe não corresponde à oferta aprovada.',409,'PRICE_MISMATCH');
    return createSession(params,options);
  };
}
