'use strict';
(function(root){
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const clean=(v,n=2000)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,n):'';
  const MAX_COLLECTION_BYTES=2000000,MAX_REPORTS=20;
  const bytes=value=>new TextEncoder().encode(value).byteLength;
  function safeURL(value){
    try{const u=new URL(value);const h=u.hostname.toLowerCase();
      return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&h.includes('.')&&!h.endsWith('.local')&&!h.endsWith('.internal')&&!/^[\d.]+$/.test(h)&&!h.includes(':')&&!/(?:token|api[_-]?key|password|secret|signature|credential|auth)=/i.test(u.search)?u.href:null;
    }catch{return null;}
  }
  function normalizeImport(raw,config,motor){
    if(!object(raw)||!object(raw.assessment)||!object(raw.report))throw Error('Use o JSON completo exportado pela análise FOCO CLARO, com avaliação e relatório.');
    if(raw.report.version!==config.version)throw Error('Este relatório usa outra versão da rubrica. Abra uma avaliação da versão '+config.version+'.');
    const a=raw.assessment;
    motor.validateInput(config,a);
    const sources=[];const counts=new Map();
    for(const s of Array.isArray(raw.sources)?raw.sources.slice(0,50):[])if(object(s))counts.set(s.id,(counts.get(s.id)||0)+1);
    for(const s of Array.isArray(raw.sources)?raw.sources.slice(0,50):[]){
      if(!object(s)||!/^[a-zA-Z0-9_-]{1,40}$/.test(s.id||'')||counts.get(s.id)!==1||!clean(s.title,240)||!clean(s.locator,600))continue;
      const url=s.url===null?null:safeURL(s.url);
      if(s.url!==null&&!url)continue;
      sources.push({id:s.id,title:clean(s.title,240),url,locator:clean(s.locator,600),recorded_at:clean(s.recorded_at,60),access_status:clean(s.access_status,80)});
    }
    const byID=new Set(sources.map(s=>s.id));
    const refs=e=>Array.isArray(e?.source_ids)&&e.source_ids.length>0&&e.source_ids.length<=6&&e.source_ids.every(id=>typeof id==='string'&&byID.has(id))?e.source_ids.slice():null;
    const assessment={title:clean(a.title,240),scope:clean(a.scope,2000),category:a.category,date:clean(a.date,40),sample:a.sample===true,personal_affinity:clean(a.personal_affinity,300)||'não avaliada',ratings:{},gates:{},gate_evidence:{}};
    for(const key of Object.keys(config.categories[a.category].weights)){
      const e=a.ratings[key];const sourceIDs=refs(e);
      assessment.ratings[key]=object(e)&&e.rating!==null&&e.rating!==undefined&&sourceIDs?{rating:e.rating,basis:e.basis,evidence:clean(e.evidence,5000),source:clean(e.source,4000),source_ids:sourceIDs}:null;
    }
    for(const key of config.gates){
      const e=a.gate_evidence?.[key];const sourceIDs=refs(e);
      const state=sourceIDs&&clean(e?.evidence)?a.gates?.[key]:'desconhecido';
      assessment.gates[key]=['verificado','falha'].includes(state)?state:'desconhecido';
      assessment.gate_evidence[key]={status:assessment.gates[key],evidence:clean(e?.evidence),source_ids:sourceIDs||[]};
    }
    const report=motor.evaluate(config,assessment);
    return {assessment,report,sources,limitations:(Array.isArray(raw.limitations)?raw.limitations:[]).filter(x=>typeof x==='string').slice(0,15).map(x=>clean(x,1000)),import_notice:'Arquivo fornecido pelo usuário. Nota recalculada; autenticidade e veracidade das fontes não foram verificadas pelo app.'};
  }
  function compare(left,right){
    if(left.assessment.category!==right.assessment.category)throw Error('Compare duas avaliações da mesma categoria.');
    return {scope_warning:left.assessment.scope===right.assessment.scope?'Confira se objetivo, versão, plataforma e amostra também são comparáveis.':'Os escopos são diferentes. Compare os critérios e as fontes antes de usar a nota como desempate.',
      comparable_scores:left.report.score!==null&&right.report.score!==null,
      rows:left.report.details.map(a=>({criterion:a.criterion,left:a.rating,right:right.report.details.find(b=>b.criterion===a.criterion)?.rating??null}))};
  }
  function summarize(data){const r=data.report;const label=r.failed_gates.length?'Sem selo · impedimento crítico':r.seal===null?'Pendente · faltam evidências':r.seal==='SEM_SELO'?'Avaliado · sem selo':r.seal+' · selo editorial';return (r.sample?'Demonstração fictícia · ':'')+label;}
  function serializeCollection(items,nowISO=new Date().toISOString()){
    if(!Array.isArray(items)||items.length>MAX_REPORTS)throw Error('O acervo comporta até 20 avaliações.');
    const result=JSON.stringify({format:'foco-app-acervo-v1',exported_at:nowISO,reports:items});
    if(bytes(result)>MAX_COLLECTION_BYTES)throw Error('O acervo completo ultrapassa 2 MB. Exporte e remova cópias antes de importar mais.');
    return result;
  }
  function readCollection(serialized,config,motor,{allowSingle=false}={}){
    if(typeof serialized!=='string'||bytes(serialized)>MAX_COLLECTION_BYTES)throw Error('A cópia completa ultrapassa o limite de 2 MB. O conteúdo original será preservado.');
    const raw=JSON.parse(serialized);
    const items=Array.isArray(raw)?raw:raw?.format==='foco-app-acervo-v1'&&Array.isArray(raw.reports)?raw.reports:allowSingle?[raw]:null;
    if(!items||items.length>MAX_REPORTS)throw Error('Use uma coleção válida de até 20 avaliações.');
    // Validate every item before returning any data to the caller.
    const checked=items.map(item=>normalizeImport(item,config,motor));
    const unique=[];const fingerprints=new Set();
    for(const data of checked){const key=JSON.stringify(data.assessment);if(!fingerprints.has(key)){fingerprints.add(key);unique.push(data);}}
    serializeCollection(unique);
    return unique;
  }
  function mergeCollection(existing,incoming){
    const combined=existing.slice(),keys=new Set(existing.map(item=>JSON.stringify(item.assessment)));
    let added=0;
    for(const data of incoming){const key=JSON.stringify(data.assessment);if(!keys.has(key)){keys.add(key);combined.push(data);added++;}}
    // Size and count are checked before the live collection is changed.
    serializeCollection(combined);
    return {reports:combined,added};
  }
  const api={safeURL,normalizeImport,compare,summarize,readCollection,serializeCollection,mergeCollection,MAX_COLLECTION_BYTES,MAX_REPORTS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FocoAppModel=api;
})(typeof window==='undefined'?globalThis:window);
