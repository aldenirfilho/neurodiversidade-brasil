import {CommerceError,validatedSessionCreator}from'./core.mjs';
import {createD1Repository}from'./d1-repository.mjs';
import {createCommerceHandler}from'./worker.mjs';

export function runtimeConfig(env={},adapterReady=false){
  const livemode=env.FOCO_STRIPE_LIVEMODE==='true'?true:env.FOCO_STRIPE_LIVEMODE==='false'?false:undefined;
  const keyReady=typeof env.STRIPE_SECRET_KEY==='string'&&(livemode===true?/^(?:rk|sk)_live_/:/^(?:rk|sk|rkcs)_test_/).test(env.STRIPE_SECRET_KEY);
  return {operatorOwnerId:env.FOCO_COMMERCE_OPERATOR_ID,priceId:env.FOCO_STRIPE_PRICE_ID,accountId:env.FOCO_STRIPE_ACCOUNT_ID,livemode,
    publicBaseUrl:env.FOCO_COMMERCE_PUBLIC_BASE_URL,
    checkoutEnabled:env.FOCO_COMMERCE_ENABLED==='true'&&adapterReady&&keyReady,
    paymentIntegrationValidated:env.FOCO_COMMERCE_VALIDATED==='true',persistenceValidated:env.FOCO_COMMERCE_PERSISTENCE_VALIDATED==='true',
    webhookEnabled:env.FOCO_COMMERCE_WEBHOOK_ENABLED==='true',webhookSecret:env.STRIPE_WEBHOOK_SECRET,
    directAccountWebhook:env.FOCO_STRIPE_DIRECT_ACCOUNT_WEBHOOK==='true'};
}
/** Supply a constructor for the official StripeClient SDK, never a raw client-side key or mock success. */
export function createRuntimeWorker({stripeClientFactory,resolveIdentity}={}){
  return{async fetch(request,env={}){
    try{
      let config=runtimeConfig(env,false),repository,createStripeSession;
      if(env.DB&&config.operatorOwnerId)repository=createD1Repository(env.DB,{operatorOwnerId:config.operatorOwnerId});
      if(typeof stripeClientFactory==='function'&&typeof env.STRIPE_SECRET_KEY==='string'){
        const client=stripeClientFactory(env.STRIPE_SECRET_KEY,{apiVersion:'2026-09-30.endive'}),api=client.v1||client;
        if(typeof api?.prices?.retrieve==='function'&&typeof api?.checkout?.sessions?.create==='function'){
          config=runtimeConfig(env,true);
          createStripeSession=validatedSessionCreator({retrievePrice:id=>api.prices.retrieve(id),createSession:(params,options)=>api.checkout.sessions.create(params,options)},config);
        }
      }
      const trustedIdentity=typeof resolveIdentity==='function'?req=>resolveIdentity(req,env):async req=>{
        if(env.FOCO_TRUST_SITES_IDENTITY!=='true')return null;
        const id=req.headers.get('oai-authenticated-user-id');return id?{id,authenticated:true}:null;
      };
      return createCommerceHandler({repository,resolveIdentity:trustedIdentity,createStripeSession,config})(request);
    }catch(e){
      const status=e instanceof CommerceError?e.status:503;
      return new Response(JSON.stringify({error:'Comércio indisponível; nenhuma cobrança ou entrega foi confirmada.',code:'COMMERCE_NOT_READY'}),
        {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
    }
  }};
}
// With no SDK constructor supplied, the generated default artifact can never open Checkout.
export default createRuntimeWorker();
