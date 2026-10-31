(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const resources = {
    portal: {title:'DiversaMente + NeuroVínculos',url:'https://aldenirfilho.github.io/neurodiversidade-brasil/',text:'Conheça a DiversaMente + NeuroVínculos: informação sobre TDAH, vínculos, direitos e acolhimento. O projeto reúne uma revista, um guia de pesquisa e o avaliador editorial FOCO CLARO. Conteúdo educativo, com fontes e datas.'},
    guia: {title:'Guia de cuidado e pesquisa TDAH',url:'https://aldenirfilho.github.io/neurodiversidade-brasil/public/neurovinculos/pesquisa-tdah/index.html',text:'Conheça o guia de cuidado e pesquisa em TDAH da DiversaMente + NeuroVínculos. Reúne referências brasileiras e internacionais com fontes, datas e limites, e ajuda a formular perguntas para o assistente. Conteúdo educativo; não substitui avaliação profissional.'},
    foco: {title:'FOCO CLARO — avaliador editorial',url:'https://aldenirfilho.github.io/neurodiversidade-brasil/public/neurovinculos/foco-claro/PAINEL.html',text:'Conheça o FOCO CLARO: um avaliador editorial experimental de clareza, navegação e esforço de uso de materiais e interfaces. Os selos dependem de critérios documentados; não certificam tratamentos nem preveem a atenção de cada pessoa.'},
    aldenir: {title:'Neurodiversidade e TDAH no AldenirMed89',url:'https://aldenirfilho.github.io/aldenirmed89/ecossistema/neurodiversidade-tdah/',text:'O AldenirMed89 tem uma seção de Neurodiversidade e TDAH conectada à DiversaMente, ao guia de pesquisa e ao avaliador editorial FOCO CLARO. Explore os recursos e confira suas fontes, datas e limites.'}
  };
  const current = () => resources[el('recurso').value] || resources.portal;
  function update() {
    const resource = current();
    el('link').value = resource.url;
    el('convite').value = resource.text + String.fromCharCode(10,10) + resource.url;
    el('abrir-recurso').href = resource.url;
    el('status').textContent = '';
  }
  async function copy(id, message) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('manual');
      await navigator.clipboard.writeText(el(id).value);
      el('status').textContent = message;
    } catch {
      el(id).focus(); el(id).select();
      el('status').textContent = 'Texto selecionado. Use Copiar no seu aparelho (Ctrl+C ou ⌘C).';
    }
  }
  el('recurso').addEventListener('change',update);
  el('copiar-link').addEventListener('click',() => copy('link','Link copiado. Você escolhe onde compartilhar.'));
  el('copiar-convite').addEventListener('click',() => copy('convite','Convite copiado. Nenhuma publicação foi feita.'));
  if (typeof navigator.share === 'function') {
    el('compartilhar').hidden = false;
    el('compartilhar').addEventListener('click',async () => {
      const resource = current();
      try {
        await navigator.share({title:resource.title,text:resource.text,url:resource.url});
        el('status').textContent = 'A opção de compartilhamento foi concluída no seu aparelho.';
      } catch (error) {
        el('status').textContent = error.name === 'AbortError' ? 'Compartilhamento cancelado. Você pode copiar o link quando quiser.' : 'Não foi possível abrir o compartilhamento. Use Copiar link.';
      }
    });
  }
  update();
})();
