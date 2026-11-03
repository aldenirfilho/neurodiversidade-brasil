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
const PROVIDER_ERROR_CODES=new Set(['API_QUOTA_EXHAUSTED','API_AUTH_FAILED','API_MODEL_ACCESS','API_REQUEST_REJECTED','API_RATE_LIMITED','PROVIDER_FAILED']);
const SAFE_PROVIDER_PARAMS=new Set(['text.format.schema','text.format','max_tool_calls','tools','tool_choice','model','max_output_tokens']);
const SAFE_PROVIDER_CODES=new Set(['insufficient_quota','billing_hard_limit_reached','billing_not_active','usage_limit_reached',
  'invalid_api_key','missing_api_key','model_not_found','model_access_denied','permission_denied','project_not_found',
  'organization_not_found','rate_limit_exceeded','invalid_json_schema','invalid_request_error','unsupported_parameter',
  'unsupported_value','invalid_value','context_length_exceeded']);
async function providerError(response) {
  // Read only a bounded error envelope. Never echo messages, request data or arbitrary fields.
  let error;
  try {error=(await readJSON(response,16384,false))?.error;}catch{}
  const code=typeof error?.code==='string'?error.code:'';
  const reserved=' A cota foi reservada; não há repetição automática.';
  const failure=(message,category)=>{
    const error=new ServiceError(message+' (HTTP '+response.status+').'+reserved,502,category);
    error.provider_http_status=response.status;
    return error;
  };
  if(response.status>=400&&response.status<500) {
    if(['insufficient_quota','billing_hard_limit_reached','billing_not_active','usage_limit_reached'].includes(code))
      return failure('A API informou saldo ou limite financeiro insuficiente. Confira os créditos e limites da conta OpenAI','API_QUOTA_EXHAUSTED');
    if(response.status===401||['invalid_api_key','missing_api_key'].includes(code))
      return failure('A API não autenticou a chave configurada. Confira a configuração segura do servidor','API_AUTH_FAILED');
    if([403,404].includes(response.status)||['model_not_found','model_access_denied','permission_denied','project_not_found','organization_not_found'].includes(code))
      return failure('A API negou acesso ao modelo ou ao projeto configurado','API_MODEL_ACCESS');
    if(code==='rate_limit_exceeded')
      return failure('A API aplicou um limite de requisições. Evite iniciar outra análise imediatamente','API_RATE_LIMITED');
    if([400,422].includes(response.status)) {
      const parameter=SAFE_PROVIDER_PARAMS.has(error?.param)?' Parâmetro: '+error.param+'.':'';
      const schema=code==='invalid_json_schema'?' O esquema JSON foi rejeitado.':'';
      return failure('A API rejeitou a configuração do pedido.'+schema+parameter,'API_REQUEST_REJECTED');
    }
  }
  return failure('A API está indisponível ou não informou um motivo identificável para a recusa','PROVIDER_FAILED');
}
async function connectionDiagnostic(env,providerFetch) {
  const result={model:LIMITS.model,provider_http_status:null,connection_ok:false,error_code:'UNCLASSIFIED',response_type:'other'};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try {
    // Fixed, free infrastructure GET. No prompt, Responses call, user URL, or quota reservation.
    const response=await providerFetch('https://api.openai.com/v1/models/'+LIMITS.model,{
      method:'GET',headers:{accept:'application/json',authorization:'Bearer '+env.OPENAI_API_KEY},signal:controller.signal});
    result.provider_http_status=response.status;
    const type=(response.headers.get('content-type')||'').toLowerCase();
    result.response_type=type.includes('json')?'json':type.includes('html')?'html':'other';
    let body;
    try{body=await readJSON(response,16384,false);result.response_type='json';}catch{}
    result.connection_ok=response.ok&&body?.id===LIMITS.model;
    result.error_code=result.connection_ok?null:SAFE_PROVIDER_CODES.has(body?.error?.code)?body.error.code:'UNCLASSIFIED';
    return respond(result,result.connection_ok?200:502);
  }catch{return respond(result,502);}
  finally{clearTimeout(timer);}
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
      if(u.pathname==='/api/foco/diagnostico'&&request.method==='GET') {
        if(!available(env))throw new ServiceError('O diagnóstico exige a configuração segura do serviço.',503,'NOT_ENABLED');
        return connectionDiagnostic(env,providerFetch);
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
        if(!response.ok)throw await providerError(response);
        const providerData=await readJSON(response,524288,false);
        if(providerData.status!=='completed')throw Error('incomplete');
        result=normalizeResponse(providerData,input,config,motor.evaluate,new Date(now()).toISOString());
      }catch(e){
        if(e instanceof ServiceError&&PROVIDER_ERROR_CODES.has(e.code))throw e;
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
    if(e instanceof ServiceError)return respond({error:e.message,code:e.code,
      ...(PROVIDER_ERROR_CODES.has(e.code)&&Number.isInteger(e.provider_http_status)&&e.provider_http_status>=100&&e.provider_http_status<=599?{provider_http_status:e.provider_http_status}:{})},e.status);
    // No raw upstream errors, user material, key, stack traces, or provider body in output/logs.
    return respond({error:'O serviço não pôde concluir. Nenhum selo foi emitido.',code:'SERVICE_ERROR'},503);
  }
}
export default {fetch:(request,env)=>handle(request,env)};
