'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const config = window.FOCO_SERVICE || {};
  const categories = { jogo: 'Jogo', filme: 'Filme', serie: 'Série', site: 'Site', pdf: 'PDF' };
  const labels = { clareza: 'Clareza do objetivo', fluxo: 'Continuidade e pouco atrito', entrada: 'Simplicidade para começar', memoria: 'Baixa exigência de memória', engajamento: 'Engajamento significativo', retomada: 'Pausa, retomada e recuperação', apresentacao: 'Apresentação e pouco ruído', autonomia: 'Autonomia e controle' };
  const gateLabels = { seguranca_essencial: 'Segurança essencial', autonomia_sem_coercao: 'Autonomia sem coerção', objeto_e_escopo_identificados: 'Objeto e escopo identificados' };
  const basisLabels = { observacao_direta: 'Observação direta documentada', documentacao_primaria: 'Documentação primária', relato_usuario: 'Relato do usuário', inferencia: 'Inferência identificada' };
  const fmt = number => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(number);
  const text = value => typeof value === 'string' ? value : '';
  const list = value => Array.isArray(value) ? value : [];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  let service = null, active = null, reportData = null;
  let maxBytes = 2000000;
  let apiBase = '';
  let configured = config.enabled === true;

  function safeLink(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
  }
  try {
    const base = new URL(text(config.apiBase) || '/', location.href);
    if (base.origin !== location.origin || base.username || base.password || base.search || base.hash) configured = false;
    else apiBase = base.href.replace(/\/$/, '');
  } catch { configured = false; }
  const serviceUrl = safeLink(config.serviceUrl);
  if (!configured && serviceUrl) {
    $('open-service').href = serviceUrl;
    $('open-service').target = '_top';
    $('open-service').rel = 'noopener';
    $('open-service').hidden = false;
  }

  function paragraph(parent, value, className) {
    const p = document.createElement('p');
    p.textContent = value;
    if (className) p.className = className;
    parent.appendChild(p);
    return p;
  }
  function setBusy(busy) {
    $('analyze').disabled = busy || !service?.enabled || service.remaining_today === 0;
    $('cancel').hidden = !busy;
    $('query').disabled = busy;
    $('category').disabled = busy;
    $('scope').disabled = busy;
    $('pdf-file').disabled = busy;
    $('consent').disabled = busy;
    $('prepare-request').disabled = busy;
    $('analysis-form').setAttribute('aria-busy', String(busy));
  }
  function quotaMessage(state) {
    if (!state.enabled) return text(state.reason) || 'O serviço aguarda ativação segura.';
    if (finite(state.daily_limit) && finite(state.remaining_today)) return fmt(state.remaining_today) + ' de ' + fmt(state.daily_limit) + ' análises disponíveis hoje.';
    return 'Serviço conectado. Os limites são verificados antes de cada análise.';
  }
  async function checkStatus() {
    if (!configured || active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    $('check-service').disabled = true;
    $('connection-status').textContent = 'Conferindo conexão e limite de uso…';
    try {
      const response = await fetch(apiBase + '/api/foco/status', { signal: controller.signal, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw Error('Não foi possível consultar o serviço.');
      const state = await response.json();
      if (!state || typeof state.enabled !== 'boolean') throw Error('Resposta de conexão inválida.');
      service = state;
      maxBytes = finite(state.max_pdf_bytes) ? Math.min(state.max_pdf_bytes, 2000000) : 2000000;
      $('connection-status').textContent = quotaMessage(state);
      $('cost-status').textContent = quotaMessage(state);
      $('service-limits').textContent = [finite(state.daily_limit) ? 'Limite de ' + fmt(state.daily_limit) + ' pedidos por dia.' : '', finite(state.max_pdf_pages) ? 'PDFs de até ' + fmt(state.max_pdf_pages) + ' páginas e ' + fmt(maxBytes / 1000000) + ' MB.' : 'PDFs de até ' + fmt(maxBytes / 1000000) + ' MB.', text(state.model) ? 'Modelo: ' + state.model + '.' : ''].filter(Boolean).join(' ');
      $('manual-fallback').hidden = state.enabled === true;
      if (!state.enabled) $('manual-fallback').hidden = false;
    } catch (error) {
      service = null;
      $('connection-status').textContent = 'Serviço indisponível no momento. Use o painel manual ou tente verificar a conexão.';
      $('cost-status').textContent = 'Não foi possível conferir o limite de uso.';
      $('manual-fallback').hidden = false;
    } finally {
      clearTimeout(timer);
      $('check-service').disabled = false;
      setBusy(false);
    }
  }
  function inputs() {
    const query = $('query').value.trim();
    const category = $('category').value;
    const scope = $('scope').value.trim();
    const file = category === 'pdf' ? $('pdf-file').files[0] : null;
    if (!Object.hasOwn(categories, category)) throw Error('Selecione um tipo de conteúdo.');
    if (!query && !file) throw Error('Informe um nome, um link público ou selecione um PDF.');
    if (query.length > 1200 || scope.length > 1200) throw Error('Resuma o nome, link e escopo em até 1.200 caracteres por campo.');
    if (file && (file.size > maxBytes || !/\.pdf$/i.test(file.name))) throw Error('Selecione um PDF de até ' + fmt(maxBytes / 1000000) + ' MB.');
    return { query: query || 'PDF enviado', category, scope, file };
  }
  async function encodePDF(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw Error('O arquivo não foi reconhecido como PDF.');
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return { name: 'documento.pdf', data_base64: btoa(binary) };
  }
  function sealLabel(report) {
    if (list(report.failed_gates).length) return 'Sem selo · impedimento crítico';
    if (!report.seal) return 'Pendente · nenhum selo emitido';
    return report.seal === 'SEM_SELO' ? 'Avaliado · sem selo' : 'Selo TDAH Friendly · ' + report.seal + ' editorial';
  }
  function sourceLinks(parent, ids, sources) {
    const found = ids.map(id => sources.find(source => source.id === id)).filter(Boolean);
    if (!found.length) return;
    const p = paragraph(parent, 'Fontes: ', 'hint');
    found.forEach((source, index) => {
      if (index) p.appendChild(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = '#source-' + sources.indexOf(source);
      a.textContent = text(source.id) || text(source.title);
      p.appendChild(a);
    });
  }
  function render(data) {
    if (!data || !data.report || typeof data.report.title !== 'string' || !Array.isArray(data.report.details)) throw Error('O serviço devolveu uma avaliação incompleta. Nenhum resultado foi exibido.');
    reportData = data;
    const report = data.report;
    const sources = list(data.sources).slice(0, 100);
    $('result-title').textContent = report.title;
    $('result-scope').textContent = 'Escopo: ' + text(report.scope);
    $('result-seal').textContent = sealLabel(report);
    $('result-seal').className = 'badge' + (['OURO', 'PRATA', 'BRONZE'].includes(report.seal) ? ' ' + report.seal.toLowerCase() : '');
    $('result-score').textContent = finite(report.score) ? fmt(report.score) + ' / 100' : 'Pendente';
    $('result-coverage').textContent = finite(report.coverage_percent) ? fmt(report.coverage_percent) + '% dos pesos' : 'Não informada';
    $('result-confidence').textContent = text(report.confidence).replaceAll('_', ' ').toLowerCase() || 'Não informada';
    $('partial-score').hidden = report.score !== null || !finite(report.observed_only_score);
    $('partial-score').textContent = 'Triagem dos critérios documentados: ' + (finite(report.observed_only_score) ? fmt(report.observed_only_score) : '—') + ' / 100. Esta nota parcial não autoriza selo e pode mudar com as evidências ausentes.';
    $('result-pending').textContent = [list(report.missing_criteria).length ? 'Falta documentar: ' + report.missing_criteria.map(key => labels[key] || key).join('; ') + '.' : '', list(report.inferred_criteria).length ? 'Exige confirmação: ' + report.inferred_criteria.map(key => labels[key] || key).join('; ') + '.' : '', list(report.unresolved_gates).length ? 'Condições pendentes: ' + report.unresolved_gates.map(key => gateLabels[key] || key).join('; ') + '.' : '', list(report.failed_gates).length ? 'Impedimentos: ' + report.failed_gates.map(key => gateLabels[key] || key).join('; ') + '.' : ''].filter(Boolean).join('\n');
    $('result-notice').textContent = text(report.notice) || 'Resultado editorial experimental e personalizado; não é certificação clínica ou oficial.';
    $('result-criteria').replaceChildren();
    report.details.forEach(detail => {
      const section = document.createElement('div'); section.className = 'criterion';
      const h3 = document.createElement('h3');
      h3.appendChild(document.createTextNode(labels[detail.criterion] || text(detail.criterion)));
      const rating = document.createElement('span'); rating.textContent = finite(detail.rating) ? fmt(detail.rating) + ' / 5' : 'Pendente'; h3.appendChild(rating); section.appendChild(h3);
      paragraph(section, text(detail.evidence) || 'Sem evidência suficiente para pontuar.');
      paragraph(section, [finite(detail.weight) ? 'Peso: ' + fmt(detail.weight) + ' pontos.' : '', basisLabels[detail.basis] || 'Base não verificada.', text(detail.source)].filter(Boolean).join(' '), 'hint');
      sourceLinks(section, list(data.assessment?.ratings?.[detail.criterion]?.source_ids || detail.source_ids), sources);
      $('result-criteria').appendChild(section);
    });
    $('result-gates').replaceChildren();
    for (const [key, label] of Object.entries(gateLabels)) {
      const gate = data.assessment?.gates?.[key];
      const evidence = data.assessment?.gate_evidence?.[key] || {};
      const status = typeof gate === 'string' ? gate : text(gate?.status);
      const p = paragraph($('result-gates'), label + ': ' + ({ verificado: 'verificado no escopo', desconhecido: 'não verificado', falha: 'falha documentada' }[status] || 'não verificado') + '.');
      if (text(evidence.evidence)) p.appendChild(document.createTextNode(' ' + evidence.evidence));
      sourceLinks($('result-gates'), list(evidence.source_ids), sources);
    }
    $('result-sources').replaceChildren();
    if (!sources.length) {
      const li = document.createElement('li'); li.textContent = 'Nenhuma fonte verificável foi devolvida. A avaliação permanece limitada às pendências indicadas.'; $('result-sources').appendChild(li);
    }
    sources.forEach((source, index) => {
      const li = document.createElement('li'); li.id = 'source-' + index;
      const title = [text(source.id), text(source.title)].filter(Boolean).join(' · ') || 'Fonte ' + (index + 1);
      const url = safeLink(source.url);
      if (url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = title; li.appendChild(a); }
      else { const strong = document.createElement('strong'); strong.textContent = title; li.appendChild(strong); }
      if (text(source.locator)) paragraph(li, 'Localização: ' + source.locator);
      if (text(source.recorded_at)) paragraph(li, 'Registro da consulta: ' + source.recorded_at);
      if (text(source.access_status)) paragraph(li, 'Estado da fonte: ' + source.access_status);
      $('result-sources').appendChild(li);
    });
    $('result-limitations').replaceChildren();
    const limitations = list(data.limitations).filter(item => typeof item === 'string');
    for (const limit of limitations.length ? limitations : ['A análise se limita às fontes e à amostra descritas; não confirma a experiência de todas as pessoas com TDAH.']) { const li = document.createElement('li'); li.textContent = limit; $('result-limitations').appendChild(li); }
    const usage = data.usage;
    $('result-usage').textContent = usage && finite(usage.input_tokens) && finite(usage.output_tokens) ? 'Uso informado pelo provedor: ' + fmt(usage.input_tokens) + ' tokens de entrada e ' + fmt(usage.output_tokens) + ' de saída. Não equivale ao valor final da cobrança.' : '';
    $('result').hidden = false;
    $('result').focus({ preventScroll: true });
    $('result').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  function download(filename, value, type) {
    const url = URL.createObjectURL(new Blob([value], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function markdown(data) {
    const r = data.report;
    return ['# FOCO CLARO — ' + r.title, '', '**Resultado:** ' + sealLabel(r), '**Nota completa:** ' + (finite(r.score) ? fmt(r.score) + '/100' : 'pendente'), '**Cobertura:** ' + (finite(r.coverage_percent) ? fmt(r.coverage_percent) + '%' : 'não informada'), '**Confiança:** ' + text(r.confidence), '**Escopo:** ' + text(r.scope), '', text(r.notice), '', '## Evidências por critério', ...r.details.map(d => '\n### ' + (labels[d.criterion] || d.criterion) + '\nNota: ' + (finite(d.rating) ? fmt(d.rating) + '/5' : 'pendente') + ' | Peso: ' + d.weight + '\n' + text(d.evidence) + '\nFonte: ' + text(d.source)), '', '## Condições pendentes', ...list(r.unresolved_gates).map(k => '- ' + (gateLabels[k] || k)), ...list(r.failed_gates).map(k => '- Falha: ' + (gateLabels[k] || k)), '', '## Fontes', ...list(data.sources).map(s => '- ' + [text(s.id), text(s.title), safeLink(s.url) || '', text(s.locator), text(s.recorded_at), text(s.access_status)].filter(Boolean).join(' · ')), '', '## Limites', ...list(data.limitations).map(s => '- ' + s), ''].join('\n');
  }

  $('category').addEventListener('change', () => { $('pdf-area').hidden = $('category').value !== 'pdf'; });
  $('pdf-file').addEventListener('change', () => { const file = $('pdf-file').files[0]; $('file-status').textContent = file ? file.name + ' · ' + fmt(file.size / 1000000) + ' MB · ainda não enviado' : ''; });
  $('check-service').addEventListener('click', checkStatus);
  $('cancel').addEventListener('click', () => {
    if (active) { active.cancelled = true; active.controller.abort(); }
  });
  $('prepare-request').addEventListener('click', () => {
    try {
      const value = inputs();
      $('analysis-error').textContent = '';
      $('request-output').value = ['/FOCO ' + value.query, 'Categoria: ' + categories[value.category], value.scope ? 'Escopo solicitado: ' + value.scope : 'Identifique edição, plataforma e amostra antes de pontuar.', 'Use o protocolo FOCO CLARO 1.1. Pesquise fontes primárias atuais; para PDF anexado, examine também a apresentação visual e identifique as páginas. Mostre nota, cobertura, confiança, pendências e fontes por critério. Não invente evidências nem selo. Não preveja dopamina ou atenção futura. Sem spoilers.', value.file ? 'Anexarei separadamente o PDF selecionado.' : ''].filter(Boolean).join('\n\n');
      for (const id of ['request-label', 'request-output', 'request-help']) $(id).hidden = false;
      $('request-output').focus();
    } catch (error) { $('analysis-error').textContent = error.message; }
  });
  $('analysis-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (active) return;
    if (!configured || !service?.enabled) { $('analysis-error').textContent = 'A análise automática aguarda conexão segura. Prepare um pedido para o agente ou use o painel manual.'; return; }
    let value;
    try { value = inputs(); if (!$('consent').checked) throw Error('Marque a autorização de envio antes de iniciar a análise.'); } catch (error) { $('analysis-error').textContent = error.message; return; }
    const job = { controller: new AbortController(), cancelled: false };
    active = job;
    const timer = setTimeout(() => job.controller.abort(), 100000);
    $('analysis-error').textContent = '';
    $('analysis-progress').textContent = 'Reunindo evidências e calculando a avaliação. Você pode cancelar a espera.';
    $('result').hidden = true;
    reportData = null;
    setBusy(true);
    try {
      const payload = { request_id: crypto.randomUUID(), query: value.query, category: value.category, scope: value.scope, consent: true };
      if (value.file) payload.pdf = await encodePDF(value.file);
      if (job.controller.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
      const response = await fetch(apiBase + '/api/foco/analisar', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: job.controller.signal });
      const data = await response.json();
      if (!response.ok) throw Error(text(data.error) || text(data.message) || 'Não foi possível concluir a análise.');
      render(data);
      $('analysis-progress').textContent = 'Análise concluída. Confira o escopo, as fontes e as pendências abaixo.';
    } catch (error) {
      $('analysis-progress').textContent = '';
      $('analysis-error').textContent = error.name === 'AbortError' ? (job.cancelled ? 'Espera cancelada.' : 'O serviço não respondeu no tempo esperado.') + ' Se o processamento já começou, ele ainda pode consumir a cota e gerar cobrança. Nenhuma nova tentativa foi iniciada.' : error.message || 'Não foi possível concluir a análise.';
    } finally {
      clearTimeout(timer);
      active = null;
      setBusy(false);
      await checkStatus();
    }
  });
  $('download-json').addEventListener('click', () => { if (reportData) download('foco-claro-avaliacao.json', JSON.stringify(reportData, null, 2), 'application/json;charset=utf-8'); });
  $('download-md').addEventListener('click', () => { if (reportData) download('foco-claro-relatorio.md', markdown(reportData), 'text/markdown;charset=utf-8'); });
  if (configured) { $('check-service').hidden = false; checkStatus(); }
  setBusy(false);
})();
