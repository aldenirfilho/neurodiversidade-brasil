# DiversaMente

[🧭 Portfólio Projeto 360X](https://github.com/aldenirfilho/aldenirmed89/blob/main/docs_usuario/PORTFOLIO_GITHUB/README.md) · [👤 Aldenir Rocha](https://github.com/aldenirfilho)

**Área:** Sociedade, inclusão e acessibilidade

Revista digital brasileira para **adultos com TDAH**: força no máximo, risco sob controle. Ciência, travas práticas, direitos e fé sem preconceito.

🔗 **Site:** https://aldenirfilho.github.io/neurodiversidade-brasil/

📣 **Compartilhar o projeto:** [links, convite pronto e imagem](https://aldenirfilho.github.io/neurodiversidade-brasil/divulgue/) · [Novidades no GitHub](https://github.com/aldenirfilho/neurodiversidade-brasil/releases)

🧠 **No AldenirMed89:** [Neurodiversidade e TDAH](https://aldenirfilho.github.io/aldenirmed89/ecossistema/neurodiversidade-tdah/)

## O que tem no site (v4 · Fase 1)

- **37 artigos em 8 editorias:** Entenda · Forças · Travas · Rotina e trabalho · Vínculos · Saúde · Direitos · Fé e estigma. Mais as páginas **Apoio**, **Manifesto** e **Privacidade**.
- **Ferramentas**, sem cadastro e sem enviar dados:
  - **Mapa Força–Trava:** a pessoa marca os traços que reconhece e recebe forças, riscos, travas (verbo + duração, com grau de evidência) e ambientes em que tende a render.
  - **Kit de Travas Financeiras:** Pix, cartão, débito automático, regra das 24 horas, segunda pessoa, Registrato, autoexclusão de apostas, o que fazer em golpe e em superendividamento. Progresso salvo no aparelho.
  - **Modo Dia Difícil:** botão no alto e no fim de cada página. Mostra uma prioridade, uma ação curta e os telefones de apoio.
  - **Lista de sinais em adultos** (18 itens, DSM-5-TR em palavras próprias; não é teste diagnóstico).
  - **Guia das leis** (36 leis, decisões e projetos, com filtro).
- Cada artigo novo traz **Em resumo**, **grau de evidência**, **Faça agora** (1 a 3 ações no formato verbo + duração), fontes e **Leia também**.
- Busca, **Central de recursos** (um adulto · uma criança · alguém com quem convivo), tema claro ou escuro, tamanho da letra e botão **Compartilhar**.

### Artigos novos da Fase 1

Mapa de forças · Hiperfoco · Rendimento sob pressão · Ambientes e carreiras · Apostas online · TDAH ao volante · Decisões grandes com segunda pessoa · Sono · Relevar sem se abandonar · Manual de Mim · Guia para quem convive · Rotina mínima para dias difíceis.

## Regras editoriais

1. Lei em vigor e projeto de lei nunca aparecem misturados. Projeto leva o aviso "Ainda não é lei".
2. Toda afirmação traz fonte e grau de evidência: **Forte** · **Moderada** · **Limitada** · **Prática** (bom senso clínico, sem estudo específico).
3. Forças são descritas como "frequentes em relatos", nunca como "superpoder".
4. Convicção de fé aparece separada e identificada, nunca como resultado de pesquisa.
5. O alvo é o capacitismo em ambiente religioso, não a religião de ninguém.
6. Medicação: só informação geral, sem doses.
7. Crise: CVV 188 sempre visível e nenhuma descrição de métodos.
8. Escalas protegidas, como a ASRS, não são reproduzidas.
9. Nenhum dado pessoal ou de saúde do idealizador ou de terceiros.

## Privacidade

- Sem login, sem anúncios, sem cookies de rastreamento e sem contador de visitas.
- As ferramentas guardam dados só no `localStorage` do navegador: `dm-tema`, `dm-escala`, `dm-mapa`, `dm-kit`, `dm-dd`.
- A página **Privacidade** tem os botões **Exportar meus dados** e **Apagar meus dados**.
- Terceiros: GitHub Pages (hospedagem) e Google Fonts (fontes do texto).

## Como é feito

- Um único `index.html` com HTML, CSS e JavaScript puro. Sem etapa de build e sem dependências além das fontes Source Serif 4 e Source Sans 3.
- Cerca de 212 KB no arquivo e 61 KB comprimido na transferência.
- A navegação usa âncoras (`#nome-do-artigo`) e funciona no GitHub Pages sem configuração extra.
- `og-image.png` é a prévia do link no WhatsApp e nas redes. `.nojekyll` desliga o Jekyll.
- Conferido com Playwright em 390 px e 1280 px, temas claro e escuro: sem erros de console, sem rolagem lateral, sem links internos quebrados e sem violações nas regras WCAG 2.2 A/AA verificadas pelo axe-core.

## Publicar e atualizar

1. **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, pasta `/ (root)`.
2. Para atualizar, edite `index.html` e faça commit na `main`. O Pages publica em 1 a 2 minutos.

## O que reconferir de tempos em tempos

PL 4.225/2023 (Senado) · PL 2.630/2021, PL 479/2025 e PL 6.002/2025 (Câmara) · projetos sobre TDAH no Ceará · estimulantes no SUS · CID-11 no Brasil · regras do Pix e do MED (etapa do MED 2.0 prevista para 26/10/2026) · Plataforma de Autoexclusão de apostas · teleatendimento do SUS para apostas · NR-1.

## Responsável técnico

Dr. Aldenir Rocha de Oliveira Filho, médico · CRM-CE 16587 · Clínica Médica, RQE 11846. Uma iniciativa do Projeto 360X.

## Aviso

Projeto sem fins lucrativos, sem anúncio e sem vínculo com laboratório. O formato de revista se inspira na norte-americana ADDitude, com a qual não tem vínculo. O conteúdo é próprio, escrito para as leis e a realidade do Brasil. Conteúdo educativo: não substitui consulta médica, psicológica ou jurídica.

Leis e projetos conferidos em 09/10/2026; regras de Pix, MED e apostas, em 18/10/2026.


## Integração DiversaMente + NeuroVínculos — 28/10/2026

Os 37 artigos editoriais e as duas ferramentas anteriores foram preservados integralmente. A revista ganhou um hub pesquisável e links no menu para o guia de cuidado/pesquisa e o avaliador FOCO CLARO. A marca DiversaMente, o roteador e os dados locais existentes foram mantidos.

- Guia: `public/neurovinculos/pesquisa-tdah/index.html` —12 referências oficiais selecionadas, infância e adultos, Brasil e referências internacionais, situação regulatória e limites das inovações.
- Avaliador: `public/neurovinculos/foco-claro/PAINEL.html` —10 tipos de conteúdo, critérios documentados, cobertura e condições essenciais; pesos anteriores preservados.
- Portal: `public/neurovinculos/index.html` — fonte em `tools/neurovinculos`.
- Nova habilidade: `tools/neurovinculos/skills/tdah-pesquisa-inovacao/SKILL.md`; agente e protocolo em `tools/neurovinculos/pesquisa-tdah`.
- Fonte e reprodução: `cd tools/neurovinculos`, `npm run check` e `npm run build`. Depois, compare `dist` com `../../public/neurovinculos`.
- Verificação da fusão: `python3 tools/neurovinculos/scripts/check_integration.py --repository .`.

Os comandos da nova habilidade são `/TDAH`, `/PESQUISAR-TDAH`, `/ESTUDOS-TDAH`, `/GUIA-TDAH` e `/INOVAR-TDAH`. A pesquisa por IA é feita no assistente; o site prepara pedidos e apresenta os guias. A presença dos arquivos não instala habilidades globalmente.

Datas: o guia novo foi consultado em 28/10/2026. Isso não revalida automaticamente as leis, finanças ou os demais artigos com datas anteriores. Registro de ensaio não demonstra eficácia; recomendação estrangeira, autorização sanitária e acesso local são verificados separadamente. O selo editorial não certifica tratamentos.

Publicação deve ser verificada separadamente do merge. O endereço Pages mencionado acima constava no README original; a conferência de 28/10/2026 encontrou HTTP404 e Pages inativo. Não afirmar implantação a partir de código salvo. Para hospedagem na raiz pelo GitHub Pages: Settings→Pages→Deploy from a branch→main→/(root).


## Divulgação nos canais do projeto — 30/10/2026

A integração de NeuroVínculos, do guia TDAH e do FOCO CLARO foi publicada em 30/10/2026 (PR #1, commit d708d260). A seção do AldenirMed89 também foi publicada (PR #62, commit 0b636ce7). O registro de HTTP404 em 28/10 acima permanece como histórico; não é o estado atual.

A área `divulgue/index.html` oferece quatro destinos, convites para copiar e a imagem original do projeto para baixar. O compartilhamento é iniciado pelo visitante; a página não posta em redes, não envia mensagens automaticamente e não mede alcance. O repositório ganhou prévias Twitter completas e um `sitemap.xml` com cinco páginas HTML canônicas, sem inventar páginas independentes para as âncoras da revista.

O sitemap e os metadados ajudam a descoberta, sem garantir indexação, posição em buscas ou audiência. Não foi criado `robots.txt` no subdiretório: a política de rastreamento é definida na raiz do host, fora do escopo deste repositório.

Referências técnicas: [Google — sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [Google — localização do robots.txt](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt) e [Open Graph](https://ogp.me/).

Verificação adicional: `node --check divulgue/compartilhar.js` e `python3 scripts/check_discovery.py`. A atualização de divulgação não altera as datas de revisão científica e jurídica dos conteúdos.
