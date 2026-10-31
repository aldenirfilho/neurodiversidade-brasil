# NeuroVínculos Brasil

**Pertencer é um direito.** Portal brasileiro de neurodiversidade, vínculos, ciência, inclusão religiosa e direitos. Edição 1.1, conteúdo consultado em 09/10/2026.

## Abrir e editar

O site é estático, sem dependências de produção. Pode ser aberto pelo `index.html` ou servido localmente. Para validação e prévia, com Node.js e Python 3 disponíveis:

```sh
npm run check
npm run build
npm run preview
```

A prévia usa `http://127.0.0.1:4173`. Não exige instalação de pacotes.

| Arquivo | O que editar |
| --- | --- |
| `index.html` | Estrutura, títulos e textos de acolhimento |
| `content.js` | Perfis, evidências, leis, fontes e roteiros |
| `styles.css` | Cores, tamanhos e responsividade |
| `app.js` | Abas, filtros, busca e exportação de roteiro |
| `FONTES.md` | Critérios editoriais e referências |

## Funcionalidades

- Perfis de TDAH, autismo, dislexia/discalculia e Tourette.
- Perguntas sobre genética, evolução, sono, personalidade e sexualidade, com achados e limites.
- Biblioteca de fontes com busca que ignora acentos.
- Filtros de legislação e identificação explícita de projetos de lei.
- Roteiros de pedido de apoio, checklist com marcações por contexto durante a sessão e download em texto.
- Controles de texto maior e leitura tranquila antes do conteúdo, impressão e navegação por teclado.
- Proteção contra constrangimento religioso e propostas de acolhimento em diferentes tradições.
- Lei de Tourette de 2026 e STF Tema 1.097, com condições e limites de verificação explícitos.

## Privacidade e conteúdo

Não há formulários de diagnóstico, relatos pessoais, contas, analytics, cookies de aplicação ou armazenamento persistente. Preferências e marcações ficam em memória na página. Hospedagem pode manter seus registros técnicos e links externos têm suas próprias políticas. Nada é enviado automaticamente pelos roteiros.

Fonte de inspiração editorial: ADDitude. Projeto independente, sem vínculo, tradução de artigos ou reprodução de identidade. SVGs originais produzidos para este projeto. O material não diagnostica, prescreve tratamento ou assegura benefício jurídico individual.

## GitHub Pages

O workflow `.github/workflows/pages.yml` está preparado para validar, empacotar somente a lista pública e publicar no GitHub Pages. No repositório de destino, selecionar **Settings → Pages → Source → GitHub Actions**. O deploy pode ser acionado manualmente e em alterações na branch `main`.

O pacote e a presença dos arquivos no GitHub não comprovam publicação. Confirmar a execução do workflow e a URL final antes de anunciar o site ao público.

## Atualizações e reversão

Revisar legislação na fonte primária antes de atualizar a data editorial. Os projetos de lei não se tornam leis por atualização automática. Para reverter, retornar ao commit anterior e executar o deploy novamente. Não há banco de dados ou migração.

Antes de adicionar coleta de relatos ou comunidade online, definir moderação, consentimento, base legal, segurança e responsabilidades. A versão inicial oferece educação e ferramentas locais, não uma rede social.

## Estado de entrega — 09/10/2026

Versão 1.1 preparada localmente. A pasta não tinha vínculo Git na abertura desta entrega. O destino no GitHub foi solicitado ao idealizador; nenhum repositório deve ser presumido a partir de seu nome. A presença do workflow preparado não confirma implantação. Backup da base 1.0 preservado localmente e excluído dos pacotes de publicação.

## Integração FOCO CLARO 1.2 — 10/10/2026

O portal inclui agora o painel Selo TDAH Friendly, motor Python/JavaScript, agente operacional e habilidade Codex portátil. Abrir `foco-claro/PAINEL.html` para preparar um pedido por nome/link e importar uma avaliação documentada. O painel não contém IA e não lê PDFs automaticamente. O assistente executa o protocolo com ferramentas disponíveis.

10 categorias, 8 critérios e limites exatos: até70 sem selo; >70 até80 bronze; >80 até90 prata; >90 ouro. Cobertura100%, evidência sem apenas inferência e três condições essenciais verificadas são necessárias. O cálculo confere estrutura e matemática, não a veracidade das fontes.

Tabela com10 graduações existentes e11 trilhas propostas preservadas separadamente. Índice preenchível de compatibilidade; probabilidades individuais de sucesso permanecem desconhecidas.

`npm run check` inclui equivalência entre motores; `npm run build` gera o pacote público por lista permitida. O ZIP completo usa `scripts/package_delivery.py`. Documentos privados, backups e outros arquivos da pasta ficam fora da entrega.


## Atualização 1.3 — guia e pesquisa em TDAH (28/10/2026)

A fonte deste módulo é integrada à revista DiversaMente no repositório `aldenirfilho/neurodiversidade-brasil`. `tools/neurovinculos` contém a fonte e `public/neurovinculos` o site estático. A revista original permanece na raiz do repositório; seus artigos, ferramentas e dados locais são preservados.

Abra **pesquisa-tdah/index.html** para o guia de cuidado e referências internacionais, com 12 fontes oficiais. Consulta do novo guia:28/10/2026. A base anterior de ciência e direitos mantém sua data de 09/10/2026, sem alegar uma nova revisão integral.

A habilidade portátil está em `skills/tdah-pesquisa-inovacao/SKILL.md`; o agente e o protocolo estão em `pesquisa-tdah`. Comandos: `/TDAH`, `/PESQUISAR-TDAH`, `/ESTUDOS-TDAH`, `/GUIA-TDAH` e `/INOVAR-TDAH`. O formulário prepara um pedido; pesquisa e análise por IA ocorrem no assistente, com as ferramentas apropriadas. A habilidade acompanha o pacote; isso não a instala globalmente.

O método separa estudo registrado, resultado publicado, recomendação, autorização regulatória e acesso local. Referências do Brasil, Reino Unido, Austrália e EUA são selecionadas; o guia não descreve todos os países. Não há doses, prescrição individual, promessa de cura ou selo de eficácia clínica. Inovações são investigadas com população, comparador, desfechos, danos e lacunas explícitos.

`npm run check` inclui validação do catálogo, datas, âncoras e referências portáteis. `npm run build` gera os dados do guia e o inventário público. O empacotador aceita somente os arquivos públicos declarados e confere seus hashes.
