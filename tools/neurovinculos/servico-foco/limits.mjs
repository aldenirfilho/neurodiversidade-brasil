import { PDFDocument, PDFName } from 'pdf-lib';

export const LIMITS = Object.freeze({daily:3, intervalMs:60000, maxPdfBytes:2000000, maxPdfPages:12,
  maxBodyBytes:2800000, maxOutputTokens:5000, timeoutMs:90000, model:'gpt-5.4-mini-2026-03-17'});
export class ServiceError extends Error {
  constructor(message, status=400, code='INVALID_INPUT') {super(message);this.status=status;this.code=code;}
}
export function publicURL(text) {
  let u;try {u=new URL(text);}catch {throw new ServiceError('Informe um link público HTTPS válido.');}
  const h=u.hostname.toLowerCase();
  // The service never fetches user URLs. This validation also keeps private locators out of web queries.
  if(u.protocol!=='https:'||u.username||u.password||u.port||!h.includes('.')||
    h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||
    /^[\d.]+$/.test(h)||h.includes(':')||h.startsWith('[')||u.search.length>500||
    /(?:token|api[_-]?key|password|secret|signature|credential|auth)=/i.test(u.search))
    throw new ServiceError('Use uma página pública HTTPS, sem endereço interno ou credenciais.');
  return u.href;
}
export async function validateRequest(data, config) {
  if(!data||typeof data!=='object'||Array.isArray(data)||data.consent!==true)
    throw new ServiceError('Confirme o envio deste material à API para continuar.');
  if(!Object.hasOwn(config.categories,data.category))throw new ServiceError('Escolha uma categoria válida.');
  const query=typeof data.query==='string'?data.query.trim():'';
  const scope=typeof data.scope==='string'?data.scope.trim():'';
  if(query.length>1200||scope.length>1200)throw new ServiceError('Use até 1.200 caracteres em cada campo.');
  if(!query&&!data.pdf)throw new ServiceError('Informe um nome, link ou PDF.');
  if(/^(?:https?|file|data|javascript|ftp|blob):/i.test(query))publicURL(query);
  const result={query,scope,category:data.category,consent:true};
  if(data.pdf) {
    if(data.category!=='pdf')throw new ServiceError('Selecione PDF para enviar um arquivo.');
    const f=data.pdf;
    if(typeof f.data_base64!=='string'||f.data_base64.length>Math.ceil(LIMITS.maxPdfBytes/3)*4||
      !/^[A-Za-z\d+/]*={0,2}$/.test(f.data_base64)||f.data_base64.length%4)
      throw new ServiceError('PDF inválido ou acima de 2 MB.');
    let bytes;try{bytes=Uint8Array.from(atob(f.data_base64),c=>c.charCodeAt(0));}catch{throw new ServiceError('PDF inválido.');}
    if(bytes.length>LIMITS.maxPdfBytes||!new TextDecoder().decode(bytes.subarray(0,5)).startsWith('%PDF-'))
      throw new ServiceError('Envie um PDF de até 2 MB.');
    let pdf,count,objects;try{pdf=await PDFDocument.load(bytes,{updateMetadata:false,throwOnInvalidObject:true});count=pdf.getPageCount();objects=pdf.context.enumerateIndirectObjects();}
    catch{throw new ServiceError('Não foi possível ler este PDF. Use uma cópia válida, sem senha.');}
    if(count<1||count>LIMITS.maxPdfPages)throw new ServiceError('Use um PDF de até 12 páginas; para uma obra maior, envie uma amostra identificada.');
    for(const [,object]of objects) {
      if(typeof object?.keys!=='function')continue;
      for(const key of object.keys())if(['JavaScript','JS','EmbeddedFiles','Launch','RichMedia'].includes(key.decodeText?.()))
        throw new ServiceError('Use um PDF simples, sem código ou arquivos incorporados.');
      if(object.get?.(PDFName.of('S'))?.toString()==='/JavaScript')throw new ServiceError('PDF com ação incorporada não aceito.');
    }
    result.pdf={name:'documento.pdf',data_base64:f.data_base64,pages_count:count};
    if(!result.query)result.query='PDF enviado';
    // Original filename is not transmitted: it may contain personal identifiers.
  }
  return result;
}
export function dayAt(ms) {return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));}
export const RESERVE_SQL=`INSERT INTO foco_requests(id,day,created_ms)
 SELECT ?1,?2,?3 WHERE
 (SELECT COUNT(*) FROM foco_requests WHERE day=?2) < ?4
 AND NOT EXISTS(SELECT 1 FROM foco_requests WHERE created_ms > ?5)
 ON CONFLICT(id) DO NOTHING RETURNING id`;
export async function quotaStatus(db, now=Date.now()) {
  if(!db)throw new ServiceError('Controle de uso indisponível; nenhuma análise foi iniciada.',503,'QUOTA_UNAVAILABLE');
  try {const row=await db.prepare('SELECT COUNT(*) AS used FROM foco_requests WHERE day=?').bind(dayAt(now)).first();
    const used=Number(row?.used||0);return {used_today:used,remaining_today:Math.max(0,LIMITS.daily-used),daily_limit:LIMITS.daily};
  }catch{throw new ServiceError('Controle de uso indisponível; nenhuma análise foi iniciada.',503,'QUOTA_UNAVAILABLE');}
}
export async function reserve(db,id,now=Date.now()) {
  if(typeof id!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id))
    throw new ServiceError('Identificador de análise inválido.');
  if(!db)throw new ServiceError('Controle de uso indisponível.',503,'QUOTA_UNAVAILABLE');
  let row;try{row=await db.prepare(RESERVE_SQL).bind(id,dayAt(now),now,LIMITS.daily,now-LIMITS.intervalMs).first();}
  catch{throw new ServiceError('Controle de uso indisponível; nenhuma análise foi iniciada.',503,'QUOTA_UNAVAILABLE');}
  if(!row)throw new ServiceError('Pedido já utilizado, intervalo de 1 minuto ou limite diário atingido. Nenhuma nova chamada foi feita.',429,'USAGE_LIMIT');
}
