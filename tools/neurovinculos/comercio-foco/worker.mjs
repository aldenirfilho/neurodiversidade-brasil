import {CommerceError,catalogue,createQuote,reserveOrder,startCheckout,processWebhook}from'./core.mjs';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
async function bodyText(request,limit){
  const reader=request.body?.getReader();if(!reader)throw new CommerceError('Pedido vazio.');
  const chunks=[];let total=0;
  try{while(true){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>limit){await reader.cancel();throw new CommerceError('Pedido acima do limite.',413);}chunks.push(part.value);}}
  finally{reader.releaseLock();}
  const data=new Uint8Array(total);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  try{return new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{throw new CommerceError('Codificação inválida.');}
}
async function jsonBody(request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new CommerceError('Use JSON.',415);
  let value;try{value=JSON.parse(await bodyText(request,16000));}catch(e){if(e instanceof CommerceError)throw e;throw new CommerceError('JSON inválido.');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new CommerceError('Pedido inválido.');return value;
}
/** Deploy only after supplying a durable atomic repository and a trusted server identity resolver. */
export function createCommerceHandler({repository,resolveIdentity,createStripeSession,config={},now=Date.now}={}){
  return async request=>{
    try{
      const u=new URL(request.url);
      if(u.pathname==='/api/comercio/catalogo'&&request.method==='GET')return response(catalogue({...config,
        checkoutEnabled:config.checkoutEnabled===true&&repository?.durable===true&&typeof resolveIdentity==='function'&&typeof createStripeSession==='function'}));
      if(u.pathname==='/api/comercio/webhook'&&request.method==='POST'){
        const raw=await bodyText(request,262144);
        return response(await processWebhook(repository,raw,request.headers.get('stripe-signature'),config,{now:now()}));
      }
      const origin=request.headers.get('origin');if(origin&&origin!==u.origin)throw new CommerceError('Origem não autorizada.',403);
      const resolved=typeof resolveIdentity==='function'?await resolveIdentity(request):null;
      if(resolved?.authenticated!==true)throw new CommerceError('Autenticação necessária.',401,'AUTH_REQUIRED');
      const actor={id:resolved.id,authenticated:true,role:resolved.id===config.operatorOwnerId?'operator':'customer'};
      if(u.pathname==='/api/comercio/cotacoes'&&request.method==='POST'){
        if(!config.operatorOwnerId)throw new CommerceError('Operador autorizado não configurado.',503,'OWNER_NOT_CONFIGURED');
        if(actor.id!==config.operatorOwnerId)throw new CommerceError('Apenas o operador autorizado pode cotar.',403,'OPERATOR_REQUIRED');
        if(repository?.durable!==true||config.persistenceValidated!==true||typeof repository.putQuote!=='function')throw new CommerceError('Persistência comercial indisponível.',503);
        const quote=createQuote(await jsonBody(request),actor,{now:now()});await repository.putQuote(quote);return response({quote},201);
      }
      if(u.pathname==='/api/comercio/pedidos'&&request.method==='POST')return response({order:await reserveOrder(repository,await jsonBody(request),actor,config,{now:now()})},201);
      if(u.pathname==='/api/comercio/checkout'&&request.method==='POST'){
        const data=await jsonBody(request);
        if(Object.keys(data).some(key=>key!=='orderId'))throw new CommerceError('Envie somente o pedido aprovado.');
        return response(await startCheckout(repository,data.orderId,actor,config,createStripeSession,{now:now()}));
      }
      const match=/^\/api\/comercio\/pedidos\/([a-f\d-]{36})$/i.exec(u.pathname);
      if(match&&request.method==='GET'){
        if(repository?.durable!==true||typeof repository.getOrder!=='function')throw new CommerceError('Persistência comercial indisponível.',503);
        const order=await repository.getOrder(match[1]);
        if(!order||order.customerId!==actor.id)throw new CommerceError('Pedido não encontrado ou não autorizado.',404);
        return response({order:{id:order.id,title:order.title,scope:order.scope,amount:order.amount,currency:order.currency,
          paymentStatus:order.paymentStatus,fulfillmentStatus:order.fulfillmentStatus,deliveryDueAt:order.deliveryDueAt}});
      }
      return response({error:'Recurso não encontrado.'},404);
    }catch(e){
      if(e instanceof CommerceError)return response({error:e.message,code:e.code},e.status);
      // Provider bodies, secrets, stack traces and customer input never enter error output.
      return response({error:'Operação não concluída. Nenhum pagamento ou entrega foi confirmado.',code:'COMMERCE_ERROR'},503);
    }
  };
}
// Safe default: no persistence, identity, provider adapter or enabled checkout.
const disabled=createCommerceHandler();
export default{fetch:request=>disabled(request)};
