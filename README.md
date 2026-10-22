# DiversaMente

[🧭 Portfólio Projeto 360X](https://github.com/aldenirfilho/aldenirmed89/blob/main/docs_usuario/PORTFOLIO_GITHUB/README.md) · [👤 Aldenir Rocha](https://github.com/aldenirfilho)

**Área:** Sociedade, inclusão e acessibilidade

Revista digital brasileira para **adultos com TDAH**: força no máximo, risco sob controle. Ciência, travas práticas, direitos e fé sem preconceito.

🔗 **Site:** https://aldenirfilho.github.io/neurodiversidade-brasil/

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
