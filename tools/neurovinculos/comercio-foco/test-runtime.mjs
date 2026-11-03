import test from'node:test';
import assert from'node:assert/strict';
import {createRuntimeWorker,runtimeConfig}from'./runtime.mjs';
const env={FOCO_COMMERCE_ENABLED:'true',FOCO_COMMERCE_VALIDATED:'true',FOCO_COMMERCE_PERSISTENCE_VALIDATED:'true',
  FOCO_COMMERCE_OPERATOR_ID:'owner',FOCO_STRIPE_PRICE_ID:'price_fixture3990',FOCO_STRIPE_ACCOUNT_ID:'acct_fixture',
  FOCO_STRIPE_LIVEMODE:'false',FOCO_COMMERCE_PUBLIC_BASE_URL:'https://example.com',STRIPE_SECRET_KEY:'rk_test_fixture_not_a_real_key'};
test('runtime requires explicit boolean strings, matching secret mode and an SDK adapter',()=>{
  assert.equal(runtimeConfig(env,false).checkoutEnabled,false);assert.equal(runtimeConfig(env,true).checkoutEnabled,true);
  assert.equal(runtimeConfig({...env,STRIPE_SECRET_KEY:'rk_live_fixture_not_a_real_key'},true).checkoutEnabled,false);
  assert.equal(runtimeConfig({...env,FOCO_COMMERCE_ENABLED:'false'},true).checkoutEnabled,false);
  assert.equal(runtimeConfig({...env,STRIPE_SECRET_KEY:'rkcs_test_fixture_not_a_real_key'},true).checkoutEnabled,true);
  assert.equal(runtimeConfig({...env,FOCO_STRIPE_LIVEMODE:'true',STRIPE_SECRET_KEY:'rkcs_test_fixture_not_a_real_key'},true).checkoutEnabled,false);
  assert.equal(runtimeConfig({...env,FOCO_STRIPE_LIVEMODE:'true',STRIPE_SECRET_KEY:'rkcs_live_fixture_not_a_real_key'},true).checkoutEnabled,false);
});
test('runtime without SDK/D1 never advertises checkout and does not trust identity headers by default',async()=>{
  const worker=createRuntimeWorker();
  const cat=await worker.fetch(new Request('https://example.com/api/comercio/catalogo'),env);assert.equal(cat.status,200);assert.equal((await cat.json()).checkout_enabled,false);
  const post=await worker.fetch(new Request('https://example.com/api/comercio/checkout',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'owner'},body:JSON.stringify({orderId:'00000000-0000-4000-8000-000000000000'})}),env);
  assert.equal(post.status,401);
});
test('SDK fixture is only constructed server-side and never called when checkout or persistence is absent',async()=>{
  let calls=0;const worker=createRuntimeWorker({stripeClientFactory:()=>({prices:{retrieve:async()=>{calls++;throw Error();}},checkout:{sessions:{create:async()=>{calls++;throw Error();}}}})});
  const cat=await worker.fetch(new Request('https://example.com/api/comercio/catalogo'),env);assert.equal((await cat.json()).checkout_enabled,false);assert.equal(calls,0);
});
