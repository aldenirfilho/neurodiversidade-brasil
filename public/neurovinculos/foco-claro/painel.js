'use strict';
const {CONFIG, COURSES} = window.FOCO_DATA;
const $=id=>document.getElementById(id);
const categoryLabels={jogo:'Jogo',livro:'Livro',pdf:'PDF',filme:'Filme',serie:'Série',programa_tv:'Programa de TV',site:'Site',app:'Aplicativo',software:'Software',produto:'Produto'};
const gateLabels={seguranca_essencial:'Segurança essencial no escopo',autonomia_sem_coercao:'Autonomia sem coerção grave',objeto_e_escopo_identificados:'Objeto e escopo identificados'};
const courseLabels={interesse:'Interesse sustentável',pratica_verificada:'Prática verificada',estrutura_e_apoio:'Estrutura e apoio',rotina_sustentavel:'Rotina sustentável',viabilidade_custo:'Viabilidade de custo',trajetoria_e_mercado_verificados:'Trajetória e mercado verificados'};
const basisLabels={observacao_direta:'Observação direta documentada',documentacao_primaria:'Documentação primária',relato_usuario:'Relato do usuário',inferencia:'Inferência identificada'};
let lastReport=null;
function fmt(n){return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n)}
const evaluateData = data => FocoMotor.evaluate(CONFIG, data);
const validateRating = (value, key) => FocoMotor.rating(value, key);
const courseIndex = ratings => {
 const report=FocoMotor.courseIndex(CONFIG,ratings);
 if(report.missing.length)throw Error('Falta verificar: '+report.missing.map(k=>courseLabels[k]).join(', '));
 return report.compatibility_index;
};
function makeSelect(options){const e=document.createElement('select');for(const[value,text]of Object.entries(options)){const o=document.createElement('option');o.value=value;o.textContent=text;e.appendChild(o)}return e}
function buildCriteria(){
 $('criteria').textContent='';const spec=CONFIG.categories[$('category').value];$('focus').textContent=spec.focus.join(' • ');
 for(const axis of CONFIG.axes){const box=document.createElement('div');box.className='criterion';box.innerHTML='<div class="criterion-head"><h3></h3><span class="weight"></span></div><p class="small desc"></p><div class="criteria-grid"><label>Nota / 5<input class="rating" type="number" min="0" max="5" step="0.1" placeholder="—"></label><label>Base da avaliação<span class="base-holder"></span></label><label class="full">Evidência observada<textarea class="evidence" placeholder="Descreva a característica realmente observada."></textarea></label><label class="full">Fonte / página / trecho / contexto<input class="source" placeholder="URL, página do PDF, manual ou relato contextualizado."></label></div><details><summary>Ver âncoras de pontuação</summary><p class="small anchor"></p></details>';
 box.querySelector('h3').textContent=axis.label;box.querySelector('.weight').textContent=spec.weights[axis.id]+' pontos';box.querySelector('.desc').textContent=axis.description;box.querySelector('.anchor').textContent=Object.entries(axis.anchors).map(([k,v])=>k+': '+v).join(' | ');
 const b=makeSelect(basisLabels);b.className='basis';box.querySelector('.base-holder').appendChild(b);box.dataset.criterion=axis.id;$('criteria').appendChild(box)}
 $('result').hidden=true;lastReport=null;
}
function collect(){let ratings={};document.querySelectorAll('[data-criterion]').forEach(box=>{let r=box.querySelector('.rating').value;ratings[box.dataset.criterion]={rating:r===''?null:Number(r),evidence:box.querySelector('.evidence').value,source:box.querySelector('.source').value,basis:box.querySelector('.basis').value}});let gates={};CONFIG.gates.forEach(g=>gates[g]=$('g-'+g).value);return {title:$('title').value.trim(),category:$('category').value,scope:$('scope').value.trim(),date:$('date').value,sample:$('sample').checked,personal_affinity:$('affinity').value,gates,ratings}}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function showReport(r){lastReport=r;$('result').hidden=false;$('result-title').textContent=r.title;$('result-sample').textContent=r.sample?'DEMONSTRAÇÃO FICTÍCIA — não corresponde a um produto real.':'';$('seal').className='badge '+(r.seal||'').toLowerCase();$('seal').textContent=r.failed_gates.length?'SEM SELO — impedimento crítico':r.seal?(r.seal==='SEM_SELO'?'AVALIADO — SEM SELO':'SELO EDITORIAL '+r.seal):'PENDENTE — nenhum selo emitido';$('score').textContent=r.score===null?'Nota completa pendente':fmt(r.score)+' / 100';$('coverage').textContent=fmt(r.coverage_percent)+'% dos pesos';$('confidence').textContent=r.confidence.replaceAll('_',' ');$('reported-affinity').textContent=r.personal_affinity;$('limits').textContent=r.coverage_percent<100?'Com os dados ausentes, a nota completa pode ir de '+fmt(r.missing_data_bounds[0])+' a '+fmt(r.missing_data_bounds[1])+'. São extremos aritméticos, não um intervalo estatístico.':'';$('pending').textContent=[r.missing_criteria.length?'Critérios ausentes: '+r.missing_criteria.join(', '):'',r.unresolved_gates.length?'Condições não verificadas: '+r.unresolved_gates.map(x=>gateLabels[x]).join('; '):'',r.inferred_criteria.length?'Critérios que exigem confirmação: '+r.inferred_criteria.join(', '):'',r.failed_gates.length?'Falhas: '+r.failed_gates.map(x=>gateLabels[x]).join('; '):''].filter(Boolean).join('\n');$('result').scrollIntoView({behavior:'instant',block:'start'})}
function markdown(r){return ['# FOCO CLARO — '+r.title,'','**Resultado:** '+(r.seal||'Nenhum selo emitido'),'**Nota:** '+(r.score===null?'pendente':fmt(r.score)+'/100'),'**Cobertura:** '+fmt(r.coverage_percent)+'%','**Confiança:** '+r.confidence,'**Escopo:** '+r.scope,'**Afinidade declarada:** '+r.personal_affinity,'',r.sample?'DEMONSTRAÇÃO FICTÍCIA.':'','Selo editorial experimental, não certificação clínica/oficial. Não mede dopamina ou probabilidade de atenção/sucesso.','',...r.details.map(d=>'## '+d.criterion+'\nNota: '+d.rating+'/5 | Peso: '+d.weight+'\n'+d.evidence+'\nFonte: '+d.source),'','Critérios ausentes: '+(r.missing_criteria.join(', ')||'nenhum'),'Critérios inferidos: '+(r.inferred_criteria.join(', ')||'nenhum'),'Condições pendentes: '+(r.unresolved_gates.join(', ')||'nenhuma'),'Falhas: '+(r.failed_gates.join(', ')||'nenhuma')].join('\n')}
for(const [v,t] of Object.entries(categoryLabels)){let o=document.createElement('option');o.value=v;o.textContent=t;$('category').appendChild(o)}
for(const g of CONFIG.gates){const l=document.createElement('label');l.textContent=gateLabels[g];const s=makeSelect({desconhecido:'Não verificado',verificado:'Verificado no escopo',falha:'Falha crítica observada'});s.id='g-'+g;l.appendChild(s);$('gates').appendChild(l)}
for(const name of ['eval','course','method']){$('tab-'+name).addEventListener('click',()=>{for(const n of ['eval','course','method']){$('panel-'+n).hidden=n!==name;$('tab-'+n).setAttribute('aria-selected',String(n===name));$('tab-'+n).tabIndex=n===name?0:-1}})}
$('category').addEventListener('change',buildCriteria);
$('calculate').addEventListener('click',()=>{try{$('error').textContent='';showReport(evaluateData(collect()))}catch(e){$('error').textContent=e.message;$('result').hidden=true}});
$('export-input').addEventListener('click',()=>download('avaliacao_foco_claro.json',JSON.stringify(collect(),null,2),'application/json'));
$('export-report').addEventListener('click',()=>{if(lastReport)download('relatorio_foco_claro.md',markdown(lastReport),'text/markdown;charset=utf-8')});
$('import-btn').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{const f=event.target.files[0];if(!f)return;try{if(f.size>2000000)throw Error('Arquivo muito grande: use uma avaliação JSON de até 2 MB.');const d=JSON.parse(await f.text());FocoMotor.validateInput(CONFIG,d,true);$('category').value=d.category;buildCriteria();$('title').value=d.title||'';$('scope').value=d.scope||'';$('date').value=d.date||'';$('sample').checked=d.sample===true;$('affinity').value=Array.from($('affinity').options).some(o=>o.value===d.personal_affinity)?d.personal_affinity:'não avaliada';document.querySelectorAll('[data-criterion]').forEach(box=>{const e=d.ratings[box.dataset.criterion]||{};box.querySelector('.rating').value=e.rating??'';box.querySelector('.evidence').value=e.evidence||'';box.querySelector('.source').value=e.source||'';box.querySelector('.basis').value=CONFIG.bases.includes(e.basis)?e.basis:'inferencia'});CONFIG.gates.forEach(g=>$('g-'+g).value=['verificado','falha','desconhecido'].includes(d.gates?.[g])?d.gates[g]:'desconhecido');$('error').textContent='Importado. Revise o escopo e as evidências antes de calcular.'}catch(e){$('error').textContent='Não foi possível importar: '+e.message}event.target.value=''});
COURSES.courses.forEach((c,i)=>{const tr=document.createElement('tr');for(const txt of [c.curso+' — '+c.status,c.atividade+' '+(c.afinidade_condicional||'')+' '+c.apoio,c.barreira]){let td=document.createElement('td');td.textContent=txt;tr.appendChild(td)}$('course-table').appendChild(tr);let o=document.createElement('option');o.value=i;o.textContent=c.curso;$('course-choice').appendChild(o)});
for(const[k,w]of Object.entries(CONFIG.course_weights)){const l=document.createElement('label');l.textContent=courseLabels[k]+' · '+w+' pontos';const s=makeSelect({'':'Ainda não verificado','0':'0 — incompatibilidade/barreira documentada','1':'1 — compatibilidade muito baixa','2':'2 — compatibilidade baixa','3':'3 — compatibilidade moderada','4':'4 — boa compatibilidade','5':'5 — compatibilidade muito alta'});s.id='c-'+k;l.appendChild(s);$('course-ratings').appendChild(l)}
function changeCourse(){$('course-info').textContent=COURSES.courses[$('course-choice').value].status+' · '+COURSES.courses[$('course-choice').value].atuacao;Object.keys(CONFIG.course_weights).forEach(k=>$('c-'+k).value='');$('course-result').textContent='';$('course-error').textContent=''}
$('course-choice').addEventListener('change',changeCourse);
$('course-calculate').addEventListener('click',()=>{try{const r={};Object.keys(CONFIG.course_weights).forEach(k=>r[k]=$('c-'+k).value);const s=courseIndex(r);$('course-error').textContent='';$('course-result').textContent='Índice de compatibilidade: '+fmt(s)+'/100 ('+fmt(s)+'% da rubrica). Probabilidade de sucesso profissional: não estimada. Este valor descreve apenas as respostas fornecidas.'}catch(e){$('course-error').textContent=e.message;$('course-result').textContent=''}});
const today=new Date();$('date').value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
buildCriteria();changeCourse();
for(const [index,name] of ['eval','course','method'].entries()) {
 const tab=$('tab-'+name);tab.tabIndex=index===0?0:-1;
 tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const names=['eval','course','method'];
  const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
  $('tab-'+names[next]).click();$('tab-'+names[next]).focus();
 });
}
document.querySelector('#panel-eval').addEventListener('input',()=>{lastReport=null;$('result').hidden=true;});
$('request-generate').addEventListener('click',()=>{
 const name=$('request-name').value.trim();
 if(!name){$('request-error').textContent='Informe o nome ou link para preparar o pedido.';return;}
 $('request-error').textContent='';
 const category=$('request-type').value;
 const instructions=[
  '/FOCO '+name,
  'Categoria: '+categoryLabels[category]+'. Perfil: ação direta, poucos menus e interrupções, controles claros, pouco ruído e retomada simples.',
  'Use a habilidade $foco-claro-tdah-friendly e o agente FOCO CLARO quando disponíveis. Identifique edição, ano, plataforma e amostra antes de pontuar; pesquise fontes primárias atuais ou leia o arquivo anexado. Para PDF, examine também a apresentação visual. Sem spoilers.',
  'Cada critério: nota 0–5 com até uma casa decimal, observação, fonte/contexto e base (observacao_direta, documentacao_primaria, relato_usuario ou inferencia). Ausente = null. Não invente que assistiu, leu ou jogou.',
  'Critérios: '+CONFIG.axes.map(a=>a.id+' = '+a.description).join(' | '),
  'Pesos para esta categoria: '+JSON.stringify(CONFIG.categories[category].weights)+'. Soma=100. S=soma(peso*nota/5). Até70 sem selo; >70 até80 bronze; >80 até90 prata; >90 ouro. Classifique antes de arredondar.',
  'Só emitir selo editorial experimental com todos os critérios documentados, sem depender apenas de inferência, e condições essenciais verificadas: '+CONFIG.gates.join(', ')+'. Lacunas=inconclusivo, não reprovação.',
  'Afinidade relatada não altera a nota. O método não mede dopamina nem prevê atenção ou sucesso. Não force resultados para títulos favoritos.',
  'Entregue resultado/pendência, cobertura, confiança, escopo, 3 facilitadores, 2 barreiras e fontes. Depois forneça JSON compatível com o painel: title,category,scope,date,sample:false,personal_affinity,gates,ratings; cada rating tem rating,evidence,source,basis.',
  'Se faltar evidência, mantenha null e liste a próxima verificação. Use rubricas.json/AGENTE.md anexos quando disponíveis.'
 ];
 $('request-output').value=instructions.join('\n\n');$('request-output-label').hidden=false;$('request-download-wrap').hidden=false;
});
$('request-download').addEventListener('click',()=>download('pedido_foco_claro.txt',$('request-output').value,'text/plain;charset=utf-8'));


if(location.hash==='#panel-course')$('tab-course').click();
if(location.hash==='#panel-method')$('tab-method').click();
