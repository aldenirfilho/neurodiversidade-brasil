import config from '../foco-claro/rubricas.json' with {type:'json'};
import motor from '../foco-claro/motor.js';
import {buildResponseBody,normalizeResponse,SERVICE_VERSION} from './core.mjs';
import {LIMITS,ServiceError,validateRequest,reserve,quotaStatus} from './limits.mjs';
import {ASSETS} from './generated-assets.mjs';

const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
function available(env){return env.FOCO_ENABLED==='true'&&!!env.OPENAI_API_KEY&&!!env.DB;}
async function readJSON(request,maxBytes=LIMITS.maxBodyBytes,checkType=true) {
  if(checkType&&!request.headers.get('content-type')?.startsWith('application/json'))throw new ServiceError('Use JSON para enviar a análise.',415);
  const reader=request.body?.getReader();if(!reader)throw new ServiceError('Pedido vazio.');
  const chunks=[];let count=0;
  try {while(true){const {value,done}=await reader.read();if(done)break;count+=value.length;if(count>maxBytes){await reader.cancel();throw new ServiceError('Arquivo ou pedido acima do limite.',413);}chunks.push(value);}}
  finally{reader.releaseLock();}
  const all=new Uint8Array(count);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));}catch{throw new ServiceError('JSON inválido.');}
}
export async function handle(request,env,{providerFetch=fetch,now=Date.now}={}) {
  const u=new URL(request.url);
  try {
    if(u.pathname.startsWith('/api/')) {
      if(!request.headers.get('oai-authenticated-user-id'))throw new ServiceError('Entre no serviço privado para continuar.',401,'SIGN_IN_REQUIRED');
      const origin=request.headers.get('origin');
      if(origin&&origin!==u.origin)throw new ServiceError('Origem não autorizada.',403,'ORIGIN_DENIED');
      if(u.pathname==='/api/foco/status'&&request.method==='GET') {
        let q={daily_limit:LIMITS.daily,used_today:0,remaining_today:0};
        if(env.DB)q=await quotaStatus(env.DB,now());
        return respond({enabled:available(env),...q,max_pdf_bytes:LIMITS.maxPdfBytes,max_pdf_pages:LIMITS.maxPdfPages,
          model:LIMITS.model,version:SERVICE_VERSION,reason:available(env)?'':'Ativação segura da chave e do serviço pendente.',
          cost_notice:'Cota de uso: não é um teto financeiro. Entrada, saída e pesquisa são cobradas pela API.'});
      }
      if(u.pathname!=='/api/foco/analisar'||request.method!=='POST')throw new ServiceError('Rota não encontrada.',404);
      if(!available(env))throw new ServiceError('A análise automática aguarda ativação segura. Nenhuma chamada paga foi feita.',503,'NOT_ENABLED');
      const raw=await readJSON(request);
      const input=await validateRequest(raw,config);
      await reserve(env.DB,raw.request_id,now());
      // A reserved request is never refunded: a timeout can still have incurred provider costs.
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),LIMITS.timeoutMs);
      let response,result;
      try {response=await providerFetch('https://api.openai.com/v1/responses',{
        method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.OPENAI_API_KEY},
        body:JSON.stringify(buildResponseBody(input,config,{model:LIMITS.model,maxOutputTokens:LIMITS.maxOutputTokens})),signal:controller.signal});
        if(!response.ok)throw new ServiceError('A API não concluiu a análise. Confira acesso ou saldo. A cota foi reservada; não há repetição automática.',502,'PROVIDER_FAILED');
        const providerData=await readJSON(response,524288,false);
        if(providerData.status!=='completed')throw Error('incomplete');
        result=normalizeResponse(providerData,input,config,motor.evaluate,new Date(now()).toISOString());
      }catch(e){
        if(e instanceof ServiceError&&e.code==='PROVIDER_FAILED')throw e;
        throw new ServiceError('A API não concluiu ou não trouxe evidências válidas. Nenhum selo foi emitido. A cota foi reservada; não há repetição automática.',502,'INVALID_EVIDENCE');
      }finally{clearTimeout(timer);}
      return respond({...result,quota:await quotaStatus(env.DB,now())});
    }
    if(!['GET','HEAD'].includes(request.method))return respond({error:'Método não permitido.'},405);
    if(u.pathname==='/')return new Response(null,{status:302,headers:{location:'/foco-claro/automatico.html','cache-control':'no-store'}});
    let path=u.pathname;
    let asset=ASSETS[path];
    if(path==='/foco-claro/servico-config.js')asset={type:'text/javascript; charset=utf-8',body:'window.FOCO_SERVICE=Object.freeze({enabled:true,apiBase:"",serviceUrl:""});'};
    if(!asset)return new Response('Recurso não encontrado.',{status:404});
    const headers={'content-type':asset.type,'cache-control':'no-store','x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow',
      'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"};
    return new Response(request.method==='HEAD'?null:asset.body,{headers});
  }catch(e) {
    if(e instanceof ServiceError)return respond({error:e.message,code:e.code},e.status);
    // No raw upstream errors, user material, key, stack traces, or provider body in output/logs.
    return respond({error:'O serviço não pôde concluir. Nenhum selo foi emitido.',code:'SERVICE_ERROR'},503);
  }
}
export default {fetch:(request,env)=>handle(request,env)};
