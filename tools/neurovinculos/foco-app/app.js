'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const model=window.FocoAppModel;
  const config=window.FOCO_DATA.CONFIG;
  const fmt=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n);
  const categories={jogo:'Jogo',filme:'Filme',serie:'Série',site:'Site',pdf:'PDF',livro:'Livro',app:'Aplicativo',software:'Software',programa_tv:'Programa de TV',produto:'Produto'};
  const axes=Object.fromEntries(config.axes.map(a=>[a.id,a.label]));
  const bases={observacao_direta:'Observação direta documentada',documentacao_primaria:'Documentação primária',relato_usuario:'Relato do usuário',inferencia:'Inferência identificada'};
  const STORE='foco.app.v1.reports';const CONSENT='foco.app.v1.optin';
  let reports=[],selected=null,persist=false,installPrompt=null,brief='';
  const paragraph=(parent,text,className)=>{const p=document.createElement('p');p.textContent=text;if(className)p.className=className;parent.appendChild(p);return p;};
  const button=(text,handler,className='link-button')=>{const b=document.createElement('button');b.type='button';b.className=className;b.textContent=text;b.addEventListener('click',handler);return b;};
  const metric=(parent,label,value)=>{const p=document.createElement('p');p.textContent=label;const strong=document.createElement('strong');strong.textContent=value;p.appendChild(strong);parent.appendChild(p);};
  function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function save(){
    if(!persist){$('storage-status').textContent='Modo temporário: o acervo fica em memória e se encerra ao fechar ou recarregar a página.';return;}
    try{const data=model.serializeCollection(reports.map(item=>item.data));localStorage.setItem(STORE,data);localStorage.setItem(CONSENT,'yes');$('storage-status').textContent='Cópia autorizada guardada neste navegador. Ela não é sincronizada nem protegida por uma conta. Evite usar em dispositivo compartilhado.';}
    catch{$('storage-status').textContent='O navegador não conseguiu guardar a cópia. O acervo continua apenas na memória; exporte antes de fechar a página.';}
  }
  const entry=data=>({id:crypto.randomUUID(),data,fingerprint:JSON.stringify(data.assessment)});
  function render(){
    $('nav-count').textContent=reports.length;
    $('empty-library').hidden=reports.length>0;
    $('export-collection').disabled=!reports.length;
    $('compare').disabled=reports.length<2;
    $('report-grid').replaceChildren();
    const beforeA=$('compare-a').value,beforeB=$('compare-b').value;
    for(const id of ['compare-a','compare-b']){
      $(id).replaceChildren();const option=document.createElement('option');option.value='';option.textContent='Escolha uma avaliação';$(id).appendChild(option);
      for(const item of reports){const o=document.createElement('option');o.value=item.id;o.textContent=item.data.report.title+' · '+(categories[item.data.report.category]||item.data.report.category);$(id).appendChild(o);}
    }
    $('compare-a').value=beforeA;$('compare-b').value=beforeB;
    for(const item of reports){
      const d=item.data,r=d.report;const article=document.createElement('article');article.className='report-card';
      const badge=document.createElement('span');badge.className='badge'+(['OURO','PRATA','BRONZE'].includes(r.seal)?' '+r.seal.toLowerCase():'');badge.textContent=model.summarize(d);article.appendChild(badge);
      const h=document.createElement('h3');h.textContent=r.title;article.appendChild(h);
      paragraph(article,(categories[r.category]||r.category)+' · '+(r.assessment_date||'Data não informada'),'scope');
      paragraph(article,r.score===null?'Nota completa pendente':fmt(r.score)+' / 100','report-score');
      paragraph(article,fmt(r.coverage_percent)+'% dos pesos documentados'+(r.score===null&&r.observed_only_score!==null?' · triagem parcial '+fmt(r.observed_only_score)+'/100':''),'hint');
      paragraph(article,r.scope,'scope');
      const actions=document.createElement('div');actions.className='actions';actions.appendChild(button('Ver critérios e fontes',()=>showDetail(item)));
      actions.appendChild(button('Remover cópia',()=>{reports=reports.filter(report=>report.id!==item.id);if(selected===item.id){selected=null;$('detail').hidden=true;}$('compare-result').hidden=true;save();render();$('library-message').textContent='Cópia removida deste acervo. O arquivo original não foi alterado.';},'link-button remove'));
      article.appendChild(actions);$('report-grid').appendChild(article);
    }
  }
  function showDetail(item){
    selected=item.id;const d=item.data,r=d.report;
    $('detail-title').textContent=r.title;$('detail-scope').textContent='Escopo: '+r.scope;$('detail-warning').textContent=d.import_notice;
    $('detail-metrics').replaceChildren();metric($('detail-metrics'),'Nota completa',r.score===null?'Pendente':fmt(r.score)+'/100');metric($('detail-metrics'),'Cobertura',fmt(r.coverage_percent)+'%');metric($('detail-metrics'),'Resultado',model.summarize(d));if(r.score===null&&r.observed_only_score!==null)metric($('detail-metrics'),'Triagem parcial',fmt(r.observed_only_score)+'/100 · não autoriza selo');
    $('detail-criteria').replaceChildren();
    for(const detail of r.details){
      const box=document.createElement('section');box.className='criterion';const h=document.createElement('h4');h.textContent=axes[detail.criterion]||detail.criterion;const rating=document.createElement('span');rating.textContent=detail.rating===null?'Pendente':fmt(detail.rating)+'/5';h.appendChild(rating);box.appendChild(h);
      paragraph(box,detail.evidence||'Evidência insuficiente para pontuar.');
      if(detail.basis)paragraph(box,bases[detail.basis]||detail.basis,'hint');
      const ids=d.assessment.ratings[detail.criterion]?.source_ids||[];
      for(const id of ids){const source=d.sources.find(s=>s.id===id);if(!source)continue;const p=document.createElement('p');const a=document.createElement('a');a.href='#detail-source-'+d.sources.indexOf(source);a.textContent='Fonte '+id+' · '+source.title;p.appendChild(a);box.appendChild(p);}
      $('detail-criteria').appendChild(box);
    }
    $('detail-sources').replaceChildren();
    for(const [index,source]of d.sources.entries()){
      const li=document.createElement('li');li.id='detail-source-'+index;
      if(source.url){const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title;li.appendChild(a);}else{const strong=document.createElement('strong');strong.textContent=source.title+' · arquivo fornecido';li.appendChild(strong);}
      paragraph(li,source.locator);if(source.recorded_at)paragraph(li,'Registro: '+source.recorded_at);if(source.access_status)paragraph(li,'Atribuição declarada: '+source.access_status.replaceAll('_',' '));$('detail-sources').appendChild(li);
    }
    if(!d.sources.length){const li=document.createElement('li');li.textContent='Sem fontes com referência válida no arquivo importado.';$('detail-sources').appendChild(li);}
    $('detail-limits').replaceChildren();
    const pending=[r.missing_criteria.length?'Critérios ausentes: '+r.missing_criteria.map(k=>axes[k]||k).join('; '):'',r.inferred_criteria.length?'Critérios inferidos: '+r.inferred_criteria.map(k=>axes[k]||k).join('; '):'',r.unresolved_gates.length?'Condições essenciais pendentes: '+r.unresolved_gates.join('; '):'',r.failed_gates.length?'Falhas documentadas: '+r.failed_gates.join('; '):''].filter(Boolean);
    for(const p of pending)paragraph($('detail-limits'),p,'notice');for(const p of d.limitations)paragraph($('detail-limits'),p,'hint');paragraph($('detail-limits'),r.notice,'hint');
    $('detail').hidden=false;$('detail').focus({preventScroll:true});$('detail').scrollIntoView({behavior:'auto',block:'start'});
  }
  $('choice-form').addEventListener('submit',event=>{
    event.preventDefault();brief='';$('choice-result').hidden=true;const name=$('choice-name').value.trim(),category=$('choice-category').value,scope=$('choice-scope').value.trim(),goal=$('choice-goal').value.trim();
    if(!name&&category!=='pdf'){$('choice-error').textContent='Informe o nome ou um link público para preparar o pedido.';return;}
    if(/^(?:https?|file|data|javascript|ftp|blob):/i.test(name)&&!model.safeURL(name)){$('choice-error').textContent='Use uma URL pública HTTPS, sem credenciais ou tokens.';return;}
    $('choice-error').textContent='';
    brief=['PEDIDO DE RELATÓRIO AVULSO — FOCO CLARO','', 'Objeto: '+(name||'PDF a anexar no avaliador privado'),'Categoria: '+categories[category],'Edição/plataforma/amostra: '+(scope||'A confirmar antes da análise'),'Objetivo: '+(goal||'Identificar facilitadores e barreiras de uso no escopo definido.'),'','Entregar: nota e cobertura; selo editorial ou pendência explicada; confiança; facilitadores/barreiras; fontes utilizadas; limitações.','Se faltarem evidências, manter pendências. Não garantir selo, benefício clínico ou atenção futura.','Sem spoilers. Um objeto/edição/amostra por relatório.','', 'Preço: R$ 39,90 por relatório com revisão humana. Disponibilidade e prazo: confirmar antes da contratação. Este rascunho não constitui compra nem pagamento.','Capacidade global inicial do serviço: até 3 análises/dia; não é franquia individual por comprador.'].join('\n');
    $('choice-brief').value=brief;$('choice-result').hidden=false;$('choice-brief').focus();
  });
  $('download-brief').addEventListener('click',()=>{if(brief)download('pedido-relatorio-foco-claro.txt',brief,'text/plain;charset=utf-8');});
  $('import-report').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>2000000)throw Error('Use um JSON de até 2 MB.');
      const valid=model.readCollection(await file.text(),config,window.FocoMotor,{allowSingle:true});
      const merged=model.mergeCollection(reports.map(item=>item.data),valid);
      const previous=new Map(reports.map(item=>[item.fingerprint,item]));
      reports=merged.reports.map(data=>previous.get(JSON.stringify(data.assessment))||entry(data));
      const added=merged.added;
      $('library-error').textContent='';$('library-message').textContent=added?added+' avaliação(ões) importada(s). Nota recalculada; fontes declaradas não foram verificadas novamente.':'Estas avaliações já estão no seu acervo.';
      save();render();
    }catch(error){$('library-error').textContent='Não foi possível importar: '+error.message;}
    event.target.value='';
  });
  $('persist').addEventListener('change',()=>{
    persist=$('persist').checked;
    if(!persist){try{localStorage.removeItem(STORE);localStorage.removeItem(CONSENT);}catch{} }
    save();
  });
  $('export-collection').addEventListener('click',()=>{try{download('meu-acervo-foco-claro.json',model.serializeCollection(reports.map(item=>item.data)),'application/json');}catch(error){$('library-error').textContent=error.message;}});
  $('export-one').addEventListener('click',()=>{const item=reports.find(report=>report.id===selected);if(item)download('relatorio-foco-claro.json',JSON.stringify(item.data,null,2),'application/json');});
  $('close-detail').addEventListener('click',()=>{$('detail').hidden=true;selected=null;});
  $('compare').addEventListener('click',()=>{
    try{
      const left=reports.find(item=>item.id===$('compare-a').value),right=reports.find(item=>item.id===$('compare-b').value);
      if(!left||!right||left.id===right.id)throw Error('Escolha duas avaliações diferentes.');
      const comparison=model.compare(left.data,right.data);$('compare-title-a').textContent=left.data.report.title;$('compare-title-b').textContent=right.data.report.title;
      $('compare-warning').textContent=comparison.scope_warning+(comparison.comparable_scores?' As notas completas também precisam ser interpretadas no seu escopo.':' Há nota completa pendente: não use uma triagem parcial como ranking definitivo.');
      $('compare-rows').replaceChildren();for(const row of comparison.rows){const tr=document.createElement('tr');for(const value of [axes[row.criterion]||row.criterion,row.left===null?'Pendente':fmt(row.left)+'/5',row.right===null?'Pendente':fmt(row.right)+'/5']){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}$('compare-rows').appendChild(tr);}
      $('compare-error').textContent='';$('compare-result').hidden=false;
    }catch(error){$('compare-error').textContent=error.message;$('compare-result').hidden=true;}
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
  $('install').addEventListener('click',async()=>{
    if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();const result=await prompt.userChoice;$('install-status').textContent=result.outcome==='accepted'?'Instalação solicitada ao navegador. A análise continua no serviço privado.':'Instalação não confirmada. O app continua disponível nesta página.';}
    else{$('install-status').textContent='Use o menu do seu navegador e procure Instalar app ou Adicionar à tela inicial, se disponível. Você também pode guardar somente a interface usando o botão acima.';$('install-status').scrollIntoView({behavior:'auto',block:'center'});}
  });
  $('offline').addEventListener('click',async()=>{
    if(!('serviceWorker'in navigator)){$('offline-status').textContent='Este navegador não oferece suporte ao modo offline. O app continua disponível online.';return;}
    $('offline').disabled=true;
    let timer;
    try{const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('offline timeout')),20000);})]);$('offline-status').textContent='Interface offline autorizada e preparada. PDFs, pedidos, respostas da API e relatórios não são guardados nesse cache. Atualizações podem exigir conexão.';void registration;}
    catch{$('offline-status').textContent='O navegador não confirmou a preparação offline. O app continua disponível online.';}
    finally{clearTimeout(timer);$('offline').disabled=false;}
  });
  let storedBackup=null;
  try{
    if(localStorage.getItem(CONSENT)==='yes'){
      storedBackup=localStorage.getItem(STORE);
      const restored=storedBackup===null?[]:model.readCollection(storedBackup,config,window.FocoMotor);
      reports=restored.map(entry);persist=true;$('persist').checked=true;
      $('storage-status').textContent='Cópia autorizada recuperada deste navegador. O conteúdo guardado não foi modificado durante a recuperação.';
    }
  }catch{
    persist=false;$('persist').checked=false;
    $('storage-status').textContent='A cópia guardada foi preservada, mas não pôde ser recuperada com segurança. O acervo desta sessão ficará temporário. Um novo opt-in substituirá a cópia guardada pelo acervo atual: baixe a recuperação antes de reautorizar.';
    if(storedBackup!==null){const recover=button('Baixar cópia guardada para recuperação',()=>download('acervo-foco-claro-recuperacao.json',storedBackup,'application/json'),'button outline');$('storage-status').insertAdjacentElement('afterend',recover);}
  }
  render();
})();
