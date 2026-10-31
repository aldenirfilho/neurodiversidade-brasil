(function () {
  'use strict';
  const catalog = window.TDAH_RESEARCH;
  const byId = id => document.getElementById(id);
  const clean = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const element = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text) e.textContent = text; return e; };
  const list = byId('source-list');
  if (!catalog || !Array.isArray(catalog.sources)) {
    byId('source-count').textContent = 'Catálogo indisponível. Consulte o guia em Markdown ou fontes.json.';
    return;
  }
  function renderSources() {
    const query = clean(byId('source-search').value).trim();
    let count = 0;
    list.replaceChildren();
    for (const source of catalog.sources) {
      if (query && !clean(JSON.stringify(source)).includes(query)) continue;
      const article = element('article', 'source');
      article.id = 'fonte-' + source.id;
      article.append(element('div', 'source-kind', source.type || 'Fonte oficial'));
      const title = element('h3');
      const link = element('a', '', source.title);
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:') throw new Error('URL não HTTPS');
        link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      } catch (_) { link.removeAttribute('href'); }
      title.append(link); article.append(title);
      const context = [source.organization, source.country].filter(Boolean).join(' · ');
      if (context) article.append(element('p', '', context));
      if (source.scope) article.append(element('p', '', source.scope));
      if (source.limits) article.append(element('p', '', 'Limites: ' + source.limits));
      if (source.date_note) article.append(element('p', 'date', source.date_note));
      article.append(element('p', 'date', 'Publicação: ' + (source.published || 'não informada') + ' · Atualização: ' + (source.updated || 'não informada') + ' · Consulta: ' + (source.checked || catalog.reviewed)));
      list.append(article); count++;
    }
    byId('source-count').textContent = count + ' de ' + catalog.sources.length + ' fontes · consulta em ' + catalog.reviewed;
    byId('source-empty').hidden = count !== 0;
  }
  byId('source-search').addEventListener('input', renderSources);
  // Clear a filter before following a citation so its source remains reachable.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#fonte-"]');
    if (link && byId('source-search').value) { byId('source-search').value = ''; renderSources(); }
  });
  byId('research-form').addEventListener('submit', event => {
    event.preventDefault();
    const question = byId('request-question').value.trim();
    const country = byId('request-country').value.trim();
    if (!question || !country) {
      byId('request-status').textContent = 'Preencha a pergunta e o país de interesse.';
      (!question ? byId('request-question') : byId('request-country')).focus();
      return;
    }
    byId('request-text').value = [
      byId('request-mode').value + ' ' + question,
      'País: ' + country + '. População: ' + byId('request-age').value + '.',
      'Use a habilidade tdah-pesquisa-inovacao e fontes primárias atuais. Registre a data da pesquisa.',
      'Quando aplicável, estruture população, intervenção, comparador e desfechos (PICO).',
      'Diferencie diretriz, estudo publicado, preprint, registro sem resultados e hipótese. Informe benefícios, riscos, limitações e lacunas.',
      'Confira separadamente recomendação clínica, autorização regulatória, disponibilidade e acesso local. Não atribua eficácia a um registro de ensaio.',
      'Não prescreva nem ajuste tratamento pessoal. Não use Selo TDAH Friendly como certificação de eficácia.',
      'Apresente uma resposta curta, referências com links e até três próximos passos. Não invente dados ausentes.'
    ].join('\n\n');
    byId('request-output').hidden = false;
    byId('request-status').textContent = 'Pedido preparado. Nenhum dado foi enviado. Copie e use no seu assistente.';
    byId('request-text').focus();
  });
  byId('copy-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(byId('request-text').value);
      byId('request-status').textContent = 'Pedido copiado. Cole no seu assistente com a habilidade do pacote.';
    } catch (_) {
      byId('request-text').focus(); byId('request-text').select();
      byId('request-status').textContent = 'Selecione o texto preparado e use Copiar no seu aparelho.';
    }
  });
  renderSources();
})();
