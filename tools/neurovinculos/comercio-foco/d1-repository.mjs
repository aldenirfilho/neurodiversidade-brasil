import {CommerceError,OFFER}from'./core.mjs';
const parse=row=>row?.body?JSON.parse(row.body):null;
const error=(message,status=503,code='PERSISTENCE_UNAVAILABLE')=>{throw new CommerceError(message,status,code);};
const validID=v=>typeof v==='string'&&/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(v);
const ownersEqual=(a,b)=>typeof a==='string'&&a===b;

/** Real D1 prepared statements; no schema creation in request handling and no memory fallback. */
export function createD1Repository(db,{operatorOwnerId}={}){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||typeof operatorOwnerId!=='string'||!operatorOwnerId.trim()||operatorOwnerId.length>200)
    error('Banco e operador autorizado precisam estar configurados.');
  const statement=(sql,...args)=>db.prepare(sql).bind(...args);
  async function first(sql,...args){try{return await statement(sql,...args).first();}catch(e){if(e instanceof CommerceError)throw e;error('Persistência comercial indisponível.');}}
  const getOrder=async id=>parse(await first('SELECT body FROM foco_commerce_orders WHERE id=?1',id));
  async function getEvent(id){const row=await first('SELECT * FROM foco_commerce_events WHERE id=?1',id);if(row&&row.processed!==1)error('Evento aguardando reconciliação.');return row;}
  return {durable:true,
    async putQuote(quote){
      if(!validID(quote?.id)||!ownersEqual(quote.operatorId,operatorOwnerId)||quote.capacityApproved!==true||quote.amount!==OFFER.amount||quote.currency!==OFFER.currency||quote.offerVersion!==OFFER.version||quote.quantity!==1)
        error('Cotação não aprovada pelo operador autorizado.',403,'OPERATOR_REQUIRED');
      const body=JSON.stringify(quote);
      const row=await first(`INSERT INTO foco_commerce_quotes(id,customer_id,operator_id,version,terms_version,expires_at,capacity_approved,body)
        VALUES(?1,?2,?3,?4,?5,?6,1,?7) ON CONFLICT(id) DO NOTHING RETURNING body`,
        quote.id,quote.customerId,operatorOwnerId,quote.version,quote.termsVersion,quote.expiresAt,body);
      if(row)return parse(row);
      const stored=await first('SELECT body FROM foco_commerce_quotes WHERE id=?1',quote.id);
      if(stored?.body!==body)error('Uma cotação emitida é imutável. Crie uma nova versão/ID.',409,'QUOTE_IMMUTABLE');return parse(stored);
    },
    async getQuote(id){return parse(await first('SELECT body FROM foco_commerce_quotes WHERE id=?1',id));},
    getOrder,getEvent,
    async reserveOrder(args){
      const o=args.order;
      if(!validID(o?.id)||o.quoteId!==args.quoteId||o.customerId!==args.customerId||o.amount!==OFFER.amount||o.currency!==OFFER.currency||o.quantity!==1||o.offerVersion!==OFFER.version||o.approvedBy!==operatorOwnerId||o.capacityApproved!==true||o.revision!==0||o.stripeSessionId!==null)
        error('Snapshot do pedido incompatível.',409,'ORDER_MISMATCH');
      const row=await first(`INSERT INTO foco_commerce_orders(id,quote_id,customer_id,idempotency_key,stripe_session_id,revision,body)
        SELECT ?1,?2,?3,?4,NULL,0,?5 WHERE EXISTS (
          SELECT 1 FROM foco_commerce_quotes q WHERE q.id=?2 AND q.customer_id=?3 AND q.version=?6
          AND q.terms_version=?7 AND q.expires_at>?8 AND q.capacity_approved=1 AND q.operator_id=?9
          AND json_extract(q.body,'$.amount')=3990 AND json_extract(q.body,'$.currency')='brl'
          AND json_extract(q.body,'$.offerVersion')=?10)
        ON CONFLICT DO NOTHING RETURNING body`,
        o.id,args.quoteId,args.customerId,args.idempotencyKey,JSON.stringify(o),args.quoteVersion,args.acceptedTermsVersion,args.now,operatorOwnerId,OFFER.version);
      if(row)return parse(row);
      const existing=await first('SELECT body,quote_id FROM foco_commerce_orders WHERE customer_id=?1 AND idempotency_key=?2',args.customerId,args.idempotencyKey);
      if(existing){if(existing.quote_id!==args.quoteId)error('Chave reutilizada para outra cotação.',409,'IDEMPOTENCY_CONFLICT');return parse(existing);}
      const reserved=await first('SELECT id FROM foco_commerce_orders WHERE quote_id=?1',args.quoteId);
      if(reserved)error('Cotação já reservada.',409,'QUOTE_ALREADY_RESERVED');
      error('Cotação alterada, expirada ou não aprovada.',409,'QUOTE_CHANGED');
    },
    async attachCheckout({orderId,sessionId,url,expectedRevision}){
      const row=await first(`UPDATE foco_commerce_orders SET stripe_session_id=?1,revision=revision+1,
        body=json_set(body,'$.stripeSessionId',?1,'$.checkoutUrl',?2,'$.revision',revision+1)
        WHERE id=?3 AND revision=?4 AND stripe_session_id IS NULL AND json_extract(body,'$.paymentStatus')='pending' RETURNING body`,
        sessionId,url,orderId,expectedRevision);
      if(row)return parse(row);
      const stored=await getOrder(orderId);
      if(stored?.stripeSessionId===sessionId&&stored.checkoutUrl===url)return stored;
      error('Pedido alterado ou já vinculado a outra sessão.',409,'SESSION_CONFLICT');
    },
    async commitWebhook(args){
      const update=args.update;
      if(!validID(args.orderId)||typeof args.eventId!=='string'||!/^evt_[A-Za-z0-9]+$/.test(args.eventId)||!Number.isSafeInteger(args.expectedRevision)||args.expectedRevision<0||!Number.isFinite(args.receivedAt)||
        !update||Object.keys(update).some(k=>!['paymentStatus','fulfillmentStatus','updatedAt','lastStripeEventId'].includes(k))||update.lastStripeEventId!==args.eventId||
        !['pending','paid_confirmed','failed','expired'].includes(update.paymentStatus)||!['not_started','queued_assisted'].includes(update.fulfillmentStatus))
        error('Transição de evento inválida.',409,'INVALID_TRANSITION');
      const insert=statement(`INSERT INTO foco_commerce_events(id,order_id,session_id,event_type,expected_revision,received_at,processed)
        SELECT ?1,?2,?3,?4,?5,?6,0 WHERE EXISTS (
          SELECT 1 FROM foco_commerce_orders WHERE id=?2 AND revision=?5 AND stripe_session_id=?3)
        ON CONFLICT(id) DO NOTHING`,args.eventId,args.orderId,args.sessionId,args.eventType,args.expectedRevision,args.receivedAt);
      const apply=statement(`UPDATE foco_commerce_orders SET revision=revision+1,
        body=json_set(json_patch(body,?1),'$.revision',revision+1)
        WHERE id=?2 AND revision=?3 AND EXISTS (
          SELECT 1 FROM foco_commerce_events WHERE id=?4 AND order_id=?2 AND expected_revision=?3 AND processed=0)
        RETURNING body`,JSON.stringify(update),args.orderId,args.expectedRevision,args.eventId);
      const done=statement(`UPDATE foco_commerce_events SET processed=1 WHERE id=?1 AND processed=0 AND EXISTS (
        SELECT 1 FROM foco_commerce_orders WHERE id=?2 AND revision=?3+1 AND json_extract(body,'$.lastStripeEventId')=?1)`,
        args.eventId,args.orderId,args.expectedRevision);
      let results;try{results=await db.batch([insert,apply,done]);}catch{error('Evento não persistido; nova entrega deve ser reconciliada.');}
      if(results?.some(r=>r.success===false))error('Evento não persistido; nova entrega deve ser reconciliada.');
      const row=results?.[1]?.results?.[0];
      if(row){const event=await getEvent(args.eventId);if(!event)error('Evento aguardando reconciliação.');return{order:parse(row),duplicate:false};}
      const event=await getEvent(args.eventId);if(event)return{duplicate:true,order:await getOrder(args.orderId)};
      return{conflict:true};
    }
  };
}
