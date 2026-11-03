/** Local-only QA harness. Invoking it performs TEST Stripe API operations; importing it does not. */
import http from'node:http';
import {createRequire}from'node:module';
import{DatabaseSync}from'node:sqlite';
import{readFileSync,mkdirSync,lstatSync,writeFileSync}from'node:fs';
import{resolve,isAbsolute}from'node:path';
import{fileURLToPath,pathToFileURL}from'node:url';
import{createD1Repository}from'./d1-repository.mjs';
import{CommerceError,createQuote,reserveOrder,startCheckout,processWebhook,validatedSessionCreator}from'./core.mjs';
const require=createRequire(import.meta.url),root=import.meta.dirname;
function inputError(message){throw new CommerceError(message,400,'QA_SETUP_REQUIRED');}
function readOwnedFile(path){
  if(typeof path!=='string'||!isAbsolute(path))inputError('Indique um caminho absoluto autorizado para o arquivo seguro.');
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)!==0||(typeof process.getuid==='function'&&stat.uid!==process.getuid()))inputError('O arquivo seguro precisa ser regular, próprio e acessível somente ao usuário.');
  return readFileSync(path,'utf8');
}
function sqliteD1(sqlite){
  const query=(sql,args)=>{const s=sqlite.prepare(sql);return s.columns().length?{success:true,results:s.all(...args)}:{success:true,results:[],meta:{changes:Number(s.run(...args).changes)}};};
  return{prepare(sql){return{bind(...args){return{sql,args,async first(){return query(sql,args).results[0]||null;}};}};},
    async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const rows=statements.map(s=>query(s.sql,s.args));sqlite.exec('COMMIT');return rows;}catch(e){sqlite.exec('ROLLBACK');throw e;}}
  };
}
async function rawRequest(req){const chunks=[];let bytes=0;for await(const part of req){bytes+=part.length;if(bytes>262144)throw new CommerceError('Evento acima do limite.',413);chunks.push(part);}return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));}
function publicError(error){return error instanceof CommerceError?{error:error.message,code:error.code}:{error:'Falha no teste sandbox. Confira configuração e permissões sem expor chaves.',code:'SANDBOX_ERROR',type:typeof error?.type==='string'?error.type:undefined,param:typeof error?.param==='string'?error.param:undefined,statusCode:Number.isSafeInteger(error?.statusCode)?error.statusCode:undefined};}

export async function startSandboxHarness(env=process.env){
  if(env.FOCO_STRIPE_TEST_ONLY!=='true')inputError('Confirme FOCO_STRIPE_TEST_ONLY=true para executar somente em sandbox.');
  let sandbox;try{sandbox=JSON.parse(readOwnedFile(env.FOCO_STRIPE_SANDBOX_CONFIG));}catch(e){if(e instanceof CommerceError)throw e;inputError('Não foi possível ler o JSON seguro do sandbox.');}
  if(typeof sandbox.secret_key!=='string'||!/^(?:sk|rk|rkcs)_test_/.test(sandbox.secret_key)||!/^acct_[A-Za-z0-9]+$/.test(sandbox.account_id||''))
    inputError('Este harness aceita somente chave de TESTE e account_id do sandbox.');
  if(!env.FOCO_STRIPE_SDK_MODULE||!isAbsolute(env.FOCO_STRIPE_SDK_MODULE))inputError('Defina o caminho absoluto do SDK oficial instalado.');
  let loaded;try{loaded=await import(pathToFileURL(env.FOCO_STRIPE_SDK_MODULE).href);}catch{loaded=require(env.FOCO_STRIPE_SDK_MODULE);}
  const StripeClient=loaded.StripeClient||loaded.default||loaded.Stripe||loaded;
  if(typeof StripeClient!=='function')inputError('SDK Stripe oficial não disponível.');
  const client=new StripeClient(sandbox.secret_key,{apiVersion:'2026-09-30.endive',maxNetworkRetries:0}),api=client.v1||client;
  let webhookSecret;try{const content=readOwnedFile(env.FOCO_STRIPE_WEBHOOK_SECRET_FILE).trim();webhookSecret=content.startsWith('{')?JSON.parse(content).webhook_secret:content;}catch(e){if(e instanceof CommerceError)throw e;inputError('Não foi possível ler o segredo local do webhook.');}
  if(typeof webhookSecret!=='string'||!webhookSecret.startsWith('whsec_'))inputError('Configure o segredo de assinatura do listener Stripe de TESTE antes de executar.');
  const now=Date.now(),runtime=resolve(root,'.runtime');mkdirSync(runtime,{recursive:true,mode:0o700});
  const sqlite=new DatabaseSync(resolve(runtime,'sandbox.sqlite'));sqlite.exec('PRAGMA foreign_keys=ON');
  // Bootstrap only this local fixture database, never a hosted migration-owned database.
  const exists=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='foco_commerce_quotes'").get();
  if(!exists)sqlite.exec(readFileSync(new URL('./drizzle/0000_comercio_foco.sql',import.meta.url),'utf8'));
  const repository=createD1Repository(sqliteD1(sqlite),{operatorOwnerId:'qa-owner'});
  let productId=env.FOCO_STRIPE_PRODUCT_ID||null,priceId=env.FOCO_STRIPE_PRICE_ID||null;
  if(env.FOCO_STRIPE_CATALOG_FILE){
    if(!isAbsolute(env.FOCO_STRIPE_CATALOG_FILE))inputError('O catálogo de teste precisa de caminho absoluto.');
    let catalog;try{catalog=JSON.parse(readFileSync(env.FOCO_STRIPE_CATALOG_FILE,'utf8'));}catch{inputError('Catálogo de teste inválido.');}
    if(catalog.livemode===true||catalog.account_id&&catalog.account_id!==sandbox.account_id||catalog.currency&&catalog.currency!=='brl'||catalog.unit_amount!==undefined&&catalog.unit_amount!==3990||catalog.amount!==undefined&&catalog.amount!==3990)inputError('Catálogo incompatível com o piloto de teste.');
    priceId=priceId||catalog.price_id||catalog.priceId||catalog.price?.id||null;
    productId=productId||catalog.product_id||catalog.productId||catalog.product?.id||null;
  }
  try{
    if(!priceId){
      if(!productId){const product=await api.products.create({name:'FOCO CLARO — QA sandbox editorial report',metadata:{foco_qa:'true',integration:'comercio-foco-0.1'}},{idempotencyKey:'foco-qa-product-'+sandbox.account_id+'-v1'});if(product.livemode!==false)inputError('Objeto fora do ambiente de teste.');productId=product.id;}
      const price=await api.prices.create({product:productId,unit_amount:3990,currency:'brl',metadata:{foco_qa:'true'}},{idempotencyKey:'foco-qa-price-'+sandbox.account_id+'-3990-v1'});if(price.livemode!==false)inputError('Preço fora do ambiente de teste.');priceId=price.id;
    }
    const config={checkoutEnabled:true,paymentIntegrationValidated:true,persistenceValidated:true,webhookEnabled:true,
      operatorOwnerId:'qa-owner',priceId,accountId:sandbox.account_id,livemode:false,publicBaseUrl:env.FOCO_STRIPE_QA_RETURN_ORIGIN||'https://example.org',webhookSecret,directAccountWebhook:true};
    const actor={id:'qa-buyer',authenticated:true,role:'customer'},operator={id:'qa-owner',authenticated:true,role:'operator'};
    const quote=createQuote({briefingId:crypto.randomUUID(),customerId:actor.id,title:'QA — relatório editorial de exemplo',category:'site',scope:'Fixture técnica de uma página pública, sem dados pessoais.',capacityApproved:true,termsVersion:'qa-fixture-not-sales-terms',deliveryDueAt:new Date(now+7*86400000).toISOString()},operator,{now});
    await repository.putQuote(quote);
    const order=await reserveOrder(repository,{quoteId:quote.id,quoteVersion:quote.version,acceptedTermsVersion:quote.termsVersion,idempotencyKey:crypto.randomUUID()},actor,config,{now});
    const createSession=validatedSessionCreator({retrievePrice:id=>api.prices.retrieve(id),createSession:(params,options)=>api.checkout.sessions.create({...params,customer_email:'qa-buyer@example.com'},options)},config);
    const port=Number(env.FOCO_STRIPE_LOCAL_PORT||4197);
    if(!Number.isSafeInteger(port)||port<1024||port>65535)inputError('Porta local inválida.');
    const server=http.createServer(async(req,res)=>{
      res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
      try{
        if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host))throw new CommerceError('Host não autorizado.',403);
        const path=new URL(req.url,'http://127.0.0.1:'+port).pathname;
        if(req.method==='POST'&&path==='/webhook'){
          const result=await processWebhook(repository,await rawRequest(req),req.headers['stripe-signature'],config);res.writeHead(200);res.end(JSON.stringify(result));return;
        }
        if(req.method==='GET'&&['/status','/health'].includes(path)){
          const stored=await repository.getOrder(order.id);res.writeHead(200);res.end(JSON.stringify({mode:'test',qa:true,order_id:order.id,payment_status:stored.paymentStatus,fulfillment_status:stored.fulfillmentStatus,events_processed:sqlite.prepare('SELECT COUNT(*) AS n FROM foco_commerce_events WHERE processed=1').get().n}));return;
        }
        throw new CommerceError('Recurso não encontrado.',404);
      }catch(e){res.writeHead(e instanceof CommerceError?e.status:503);res.end(JSON.stringify(publicError(e)));}
    });
    await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});
    let session;try{session=await startCheckout(repository,order.id,actor,config,createSession);}catch(e){await new Promise(ok=>server.close(ok));throw e;}
    const summary={mode:'test',qa:true,account_id:sandbox.account_id,product_id:productId,price_id:priceId,order_id:order.id,session_id:session.sessionId,checkout_url:session.url,local_url:'http://127.0.0.1:'+port,webhook_path:'/webhook',notice:'Checkout de teste; sem cobrança real. Pago coloca em fila assistida, não entrega nem concede selo.'};
    writeFileSync(resolve(runtime,'sandbox-summary.json'),JSON.stringify(summary,null,2)+'\n',{mode:0o600});
    return{summary,server,close:async()=>{await new Promise(ok=>server.close(ok));sqlite.close();}};
  }catch(e){sqlite.close();throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const harness=await startSandboxHarness();console.log(JSON.stringify(harness.summary));
    for(const signal of['SIGINT','SIGTERM'])process.on(signal,()=>{harness.close().then(()=>process.exit(0));});
  }catch(e){console.error(JSON.stringify(publicError(e)));process.exitCode=1;}
}
