'use strict';
(() => {
  const data = window.NV_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const normalize = (text) => text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const source = (id) => data.sources.find((item) => item.id === id);
  const sourceLinks = (ids) => ids.map((id) => `<a href="#fonte-${id}">[${source(id).n}] ${source(id).title}</a>`).join('<br>');
  // Content is maintained locally; no user text is interpolated into HTML.
  const profileTabs = $('#profile-tabs');
  data.profiles.forEach((profile, index) => {
    const button = document.createElement('button');
    button.id = `tab-${profile.id}`;
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'profile-panel');
    button.setAttribute('aria-selected', String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    button.textContent = profile.label;
    button.addEventListener('click', () => showProfile(profile.id));
    button.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const tabs = [...profileTabs.querySelectorAll('button')];
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      showProfile(data.profiles[next].id);
      tabs[next].focus();
    });
    profileTabs.append(button);
  });
  function showProfile(id) {
    const p = data.profiles.find((item) => item.id === id);
    profileTabs.querySelectorAll('button').forEach((button) => {
      const selected = button.id === `tab-${id}`;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $('#profile-panel').setAttribute('aria-labelledby', `tab-${id}`);
    $('#profile-panel').innerHTML = `<div class="profile-layout"><div><h3>${p.title}</h3><p>${p.description}</p><ul>${p.needs.map((need) => `<li>${need}</li>`).join('')}</ul></div><div><span class="label">APOIOS PARA CONVERSAR E ADAPTAR</span><ul>${p.support.map((item) => `<li>${item}</li>`).join('')}</ul><p class="profile-links">${sourceLinks(p.sources)}</p></div></div>`;
  }
  showProfile('tdah');
  function renderScience(filter = 'todos') {
    $('#science-list').innerHTML = data.science.filter((item) => filter === 'todos' || item.group === filter).map((item) => `<details id="pergunta-${item.id}"><summary><h3>${item.title}</h3><span class="badge ${item.badgeClass}">${item.badge}</span></summary><div class="detail-body"><p>${item.text}</p><p class="limit"><strong>Limite da conclusão:</strong> ${item.limit}</p><p><strong>Na prática:</strong> ${item.action}</p><div class="source-link">${sourceLinks(item.sources)}</div></div></details>`).join('');
  }
  function renderLaws(filter = 'todos') {
    $('#law-list').innerHTML = data.laws.filter((item) => filter === 'todos' || item.categories.includes(filter)).map((law) => `<article class="law-card"><div class="meta"><span>${law.number}</span><span class="${law.proposal ? 'proposal' : ''}">${law.status}</span></div><h3>${law.title}</h3><p>${law.text}</p><p class="limits"><strong>Alcance:</strong> ${law.limit}</p><a href="${source(law.source).url}" target="_blank" rel="noopener noreferrer">Ler documento oficial ↗</a> <a href="#fonte-${law.source}">[${source(law.source).n}]</a></article>`).join('');
  }
  function setupFilters(selector, render) {
    $(selector).querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      $(selector).querySelectorAll('button').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      render(button.dataset.filter);
    }));
  }
  renderScience(); renderLaws();
  setupFilters('#science-filters', renderScience);
  setupFilters('#law-filters', renderLaws);
  function renderSources(query = '') {
    const items = data.sources.filter((item) => normalize(`${item.title} ${item.note} ${item.tags} ${item.year}`).includes(normalize(query)));
    $('#source-count').textContent = `${items.length} de ${data.sources.length} fontes · consulta em ${data.reviewed}`;
    $('#source-list').innerHTML = items.length ? items.map((item) => `<article class="source-item" id="fonte-${item.id}" tabindex="-1"><span class="index">${String(item.n).padStart(2, '0')}</span><div><h3>${item.title}</h3><p>${item.note}</p><a href="${item.url}" target="_blank" rel="noopener noreferrer">Consultar fonte original ↗</a></div><div class="source-meta">${item.type}<br>${item.year}</div></article>`).join('') : '<p class="empty-state">Nenhuma fonte encontrada. Tente “TDAH”, “sono”, “trabalho” ou “fé”.</p>';
  }
  renderSources();
  $('#source-search').addEventListener('input', (event) => renderSources(event.target.value));
  // A source anchor always clears the search so its destination remains visible.
  function revealSource() {
    if (!location.hash.startsWith('#fonte-')) return;
    if ($('#source-search').value) {
      $('#source-search').value = '';
      renderSources();
    }
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.focus({preventScroll: true});
      target.scrollIntoView({behavior: 'auto', block: 'start'});
    }
  }
  window.addEventListener('hashchange', revealSource);
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#fonte-"]');
    if (!anchor) return;
    if ($('#source-search').value) {
      $('#source-search').value = '';
      renderSources();
    }
    const id = anchor.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
      target.focus({preventScroll: true});
      target.scrollIntoView({behavior: 'auto', block: 'start'});
    }
  });
  revealSource();
  const planProgress = new Map();
  function renderPlan() {
    const context = $('#plan-context').value;
    const plan = data.plans[context];
    const saved = planProgress.get(context) || [];
    $('#plan-checks').innerHTML = plan.checks.map((check, index) => `<label><input type="checkbox" id="plan-check-${index}" ${saved[index] ? 'checked' : ''}><span>${check}</span></label>`).join('');
    $('#plan-message').textContent = plan.message;
    $('#copy-status').textContent = '';
    $('#plan-checks').querySelectorAll('input').forEach((checkbox) => checkbox.addEventListener('change', () => {
      planProgress.set(context, [...$('#plan-checks').querySelectorAll('input')].map((item) => item.checked));
      updateProgress();
    }));
    updateProgress();
  }
  function updateProgress() {
    const count = $('#plan-checks').querySelectorAll('input:checked').length;
    const total = $('#plan-checks').querySelectorAll('input').length;
    $('#plan-progress').textContent = `${count} de ${total} passos marcados neste contexto.`;
  }
  function planText() {
    const context = $('#plan-context');
    const plan = data.plans[context.value];
    const checks = [...$('#plan-checks').querySelectorAll('input')];
    return `NEUROVÍNCULOS BRASIL — ROTEIRO DE APOIO\n${context.options[context.selectedIndex].text}\nEdição ${data.edition} · ${data.reviewed}\n\n${plan.checks.map((check, index) => `${checks[index].checked ? '[x]' : '[ ]'} ${check}`).join('\n')}\n\nMODELO PARA ADAPTAR\n${plan.message}\n\nAdapte a mensagem à sua situação. Não há envio automático. Apoios propostos não são garantia jurídica universal.\n`;
  }
  renderPlan();
  $('#plan-context').addEventListener('change', renderPlan);
  $('#copy-plan').addEventListener('click', async () => {
    $('#copy-status').textContent = 'Solicitando cópia ao navegador…';
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await Promise.race([
        navigator.clipboard.writeText(planText()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard timeout')), 2000))
      ]);
      $('#copy-status').textContent = 'Roteiro copiado. Revise antes de usar.';
    } catch {
      $('#copy-status').textContent = 'A cópia não está disponível neste navegador. Use “Baixar roteiro” ou selecione o texto do modelo.';
    }
  });
  $('#download-plan').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([planText()], {type:'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `neurovinculos-roteiro-${$('#plan-context').value}.txt`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#copy-status').textContent = 'Download do roteiro solicitado ao navegador.';
  });
  $('.menu-toggle').addEventListener('click', () => {
    const open = $('#nav').classList.toggle('open');
    $('.menu-toggle').setAttribute('aria-expanded', String(open));
  });
  $('#nav').querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', () => {
    $('#nav').classList.remove('open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
  }));
  function togglePreference(buttonSelector, className) {
    $(buttonSelector).addEventListener('click', () => {
      const active = document.body.classList.toggle(className);
      $(buttonSelector).setAttribute('aria-pressed', String(active));
    });
  }
  togglePreference('#text-size', 'text-large');
  togglePreference('#focus-mode', 'quiet-mode');
  $('#print-page').addEventListener('click', () => window.print());
  const openBeforePrint = new Map();
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details').forEach((detail) => {openBeforePrint.set(detail, detail.open); detail.open = true;});
  });
  window.addEventListener('afterprint', () => {
    openBeforePrint.forEach((open, detail) => {detail.open = open;});
    openBeforePrint.clear();
  });
})();
