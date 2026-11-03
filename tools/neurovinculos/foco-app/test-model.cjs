'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const model=require('./model.js');const motor=require('../foco-claro/motor.js');const config=require('../foco-claro/rubricas.json');
function fixture(){
 const assessment={title:'DEMONSTRAÇÃO FICTÍCIA — item de teste',category:'jogo',scope:'Edição fictícia; início e retomada em uma tarefa de teste.',date:'2026-11-03',sample:true,ratings:{},gates:{},gate_evidence:{}};
 for(const axis of Object.keys(config.categories.jogo.weights))assessment.ratings[axis]={rating:4,evidence:'Observação sintética de teste, sem referência a produto real.',source:'Manual fictício de teste.',basis:'documentacao_primaria',source_ids:['manual']};
 for(const gate of config.gates){assessment.gates[gate]='verificado';assessment.gate_evidence[gate]={status:'verificado',evidence:'Condição sintética documentada neste teste.',source_ids:['manual']};}
 return{assessment,report:motor.evaluate(config,assessment),sources:[{id:'manual',title:'Manual FICTÍCIO do teste',url:'https://example.org/manual-ficticio',locator:'Página fictícia de teste',recorded_at:'2026-11-03T09:00:00Z',access_status:'citado_pelo_modelo'}],limitations:['Apenas dados sintéticos.']};
}
const copy=x=>JSON.parse(JSON.stringify(x));
test('recalculates imported score/seal rather than trusting forged report fields',()=>{
 const raw=fixture();raw.report.score=100;raw.report.seal='OURO';const data=model.normalizeImport(raw,config,motor);
 assert.equal(data.report.score,80);assert.equal(data.report.seal,'BRONZE');assert.match(data.import_notice,/autenticidade.*não foram verificadas/);
});
test('an unknown rubric, report-only file or absent assessment is rejected',()=>{
 const raw=fixture();raw.report.version='999';assert.throws(()=>model.normalizeImport(raw,config,motor),/outra versão/);
 assert.throws(()=>model.normalizeImport({report:fixture().report},config,motor),/JSON completo/);
});
test('missing attributed sources cannot support ratings or verified gates',()=>{
 const raw=fixture();raw.sources=[];const data=model.normalizeImport(raw,config,motor);assert.equal(data.report.score,null);assert.equal(data.report.coverage_percent,0);assert.equal(data.report.seal,null);assert.equal(data.report.unresolved_gates.length,3);
});
test('duplicate source IDs and executable source links remain pending',()=>{
 const raw=fixture();raw.sources.push(copy(raw.sources[0]));assert.equal(model.normalizeImport(raw,config,motor).report.seal,null);
 raw.sources=[{...raw.sources[0],url:'javascript:alert(1)'}];assert.equal(model.normalizeImport(raw,config,motor).sources.length,0);
});
test('missing gate evidence prevents a complete seal even with documented criteria',()=>{
 const raw=fixture();raw.assessment.gate_evidence={};const data=model.normalizeImport(raw,config,motor);assert.equal(data.report.score,80);assert.equal(data.report.seal,null);assert.equal(data.report.unresolved_gates.length,3);
});
test('unknown criterion and malformed rating are rejected by the canonical engine',()=>{
 const raw=fixture();raw.assessment.ratings.clareza.rating=5.55;assert.throws(()=>model.normalizeImport(raw,config,motor),/casa decimal/);
 const other=fixture();other.assessment.ratings.fake={rating:5};assert.throws(()=>model.normalizeImport(other,config,motor),/Critério desconhecido/);
});
test('inference is retained and cannot be upgraded by a high imported score',()=>{
 const raw=fixture();raw.assessment.ratings.clareza.basis='inferencia';const data=model.normalizeImport(raw,config,motor);assert.equal(data.report.seal,null);assert.deepEqual(data.report.inferred_criteria,['clareza']);
});
test('comparison rejects categories and warns about distinct scopes or partial scores',()=>{
 const a=model.normalizeImport(fixture(),config,motor);const b=copy(a);b.assessment.scope='Outra amostra';assert.match(model.compare(a,b).scope_warning,/escopos são diferentes/);
 b.assessment.category='filme';assert.throws(()=>model.compare(a,b),/mesma categoria/);
 b.assessment.category='jogo';b.report.score=null;assert.equal(model.compare(a,b).comparable_scores,false);
});
test('private/credentialed locators do not become clickable public sources',()=>{
 for(const s of ['http://example.org','https://user:password@example.org','https://127.0.0.1','https://device.local','https://example.org?token=secret','data:text/html,anything'])assert.equal(model.safeURL(s),null,s);
 assert.equal(model.safeURL('https://example.org/manual'),'https://example.org/manual');
});
test('offline worker handles only shell GET requests; API, PDF, reports and query URLs bypass it',async()=>{
 const handlers={};let respondCount=0;
 const scope={URL,Response,Set,Promise,self:{location:{href:'https://example.org/public/neurovinculos/foco-app/sw.js',origin:'https://example.org'},addEventListener(name,fn){handlers[name]=fn;},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async()=>{}}),keys:async()=>[],match:async()=>null},fetch:async()=>new Response('shell')};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sw.js'),'utf8'),scope);
 for(const [url,method]of [['https://example.org/api/foco/analisar','POST'],['https://example.org/api/foco/status','GET'],['https://example.org/public/neurovinculos/foco-app/file.pdf','GET'],['https://other.org/app.js','GET'],['https://example.org/public/neurovinculos/foco-app/report.json','GET'],['https://example.org/public/neurovinculos/foco-app/index.html?query=private','GET']])handlers.fetch({request:{url,method},respondWith(){respondCount++;}});
 assert.equal(respondCount,0);
 handlers.fetch({request:{url:'https://example.org/public/neurovinculos/foco-app/app.js',method:'GET'},respondWith(){respondCount++;}});assert.equal(respondCount,1);
});

test('stored legacy arrays and exported envelopes restore consistently without changing their input',()=>{
 const one=model.normalizeImport(fixture(),config,motor),two=copy(one);two.assessment.title+=' B';
 const source=JSON.stringify([one,two]);const restored=model.readCollection(source,config,motor);
 assert.equal(restored.length,2);assert.equal(source,JSON.stringify([one,two]));
 const exported=model.serializeCollection(restored,'2026-11-03T10:00:00.000Z');
 assert.equal(JSON.parse(exported).format,'foco-app-acervo-v1');assert.equal(model.readCollection(exported,config,motor).length,2);
});
test('corrupt collection validates every item before anything can be returned',()=>{
 const first=fixture();const bad=fixture();bad.assessment.ratings.clareza.rating=9;
 assert.throws(()=>model.readCollection(JSON.stringify([first,bad]),config,motor),/nota de 0 a 5/);
 assert.throws(()=>model.readCollection('{corrupt',config,motor),SyntaxError);
});
test('aggregate UTF-8 limit prevents oversized merge/export without mutating the existing acervo',()=>{
 const first=model.normalizeImport(fixture(),config,motor);
 const large=copy(first);large.assessment.title='Other fictional item';large.limitations=['é'.repeat(1000001)];
 const existing=[first];assert.throws(()=>model.mergeCollection(existing,[large]),/ultrapassa 2 MB/);
 assert.equal(existing.length,1);assert.equal(existing[0].assessment.title,first.assessment.title);
 assert.throws(()=>model.serializeCollection([large]),/ultrapassa 2 MB/);
 assert.throws(()=>model.readCollection('é'.repeat(1000001),config,motor),/ultrapassa o limite de 2 MB/);
});
function startApp(stored){
 const elements=new Map(),writes=[],removed=[];let id=0;
 const element=()=>({value:'',textContent:'',hidden:false,disabled:false,checked:false,children:[],
  addEventListener(){},appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];},insertAdjacentElement(_where,child){this.inserted=child;},setAttribute(){},focus(){},scrollIntoView(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const context={window:{FocoAppModel:model,FocoMotor:motor,FOCO_DATA:{CONFIG:config},addEventListener(){}},
  document:{getElementById:get,createElement:element},crypto:{randomUUID:()=>String(++id)},
  localStorage:{getItem:key=>key==='foco.app.v1.optin'?'yes':stored,setItem:(...args)=>writes.push(args),removeItem:key=>removed.push(key)},
  navigator:{},URL,Blob,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),context);
 return{get,writes,removed};
}
test('app startup preserves an oversized or partially corrupt stored collection without overwriting it',()=>{
 for(const text of [' '.repeat(2000001),JSON.stringify([fixture(),{assessment:{},report:{}}])]){
  const app=startApp(text);assert.equal(app.get('nav-count').textContent,0);assert.equal(app.get('persist').checked,false);
  assert.deepEqual(app.writes,[]);assert.deepEqual(app.removed,[]);assert.match(app.get('storage-status').textContent,/foi preservada/);
  assert.match(app.get('storage-status').inserted.textContent,/recuperação/);
 }
});
test('valid startup restores every report atomically and performs no storage writes',()=>{
 const a=fixture(),b=fixture();b.assessment.title+=' B';
 const app=startApp(JSON.stringify([a,b]));assert.equal(app.get('nav-count').textContent,2);assert.equal(app.get('persist').checked,true);
 assert.deepEqual(app.writes,[]);assert.deepEqual(app.removed,[]);assert.match(app.get('storage-status').textContent,/não foi modificado/);
});
