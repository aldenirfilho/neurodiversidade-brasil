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


## FOCO CLARO automático — preparação 1.4 (03/11/2026)

Nova interface: `public/neurovinculos/foco-claro/automatico.html` (na fonte do módulo: `foco-claro/automatico.html`). Nome, URL pública e PDF; nota, cobertura, selo, evidências, fontes e exportação. Serviço privado: https://foco-claro-neurovinculos.aldenirmed.chatgpt.site . Código e contrato em `servico-foco/README.md` na fonte NeuroVínculos.

**Ativação da API pendente da configuração segura da chave.** A interface publicada informa esse estado e preserva a alternativa manual. Testes com provedor simulado não comprovam execução real. A versão inicial prevê 3 pedidos/dia, intervalo de 1 minuto, 1 chamada por pedido, até 5.000 tokens de saída e PDFs de até 2 MB/12 páginas. São limites de uso, sem promessa de teto monetário.

A chave fica somente no servidor; envio de material exige consentimento. O banco persiste apenas identificador/dia/horário da reserva, sem guardar perguntas ou PDFs. O serviço usa `store:false`; as políticas próprias de retenção do provedor e da hospedagem permanecem aplicáveis. Rubrica e datas clínicas/jurídicas anteriores preservadas.


## App FOCO CLARO — piloto de relatórios avulsos (03/11/2026)

App em `public/neurovinculos/foco-app/index.html`, fonte em `tools/neurovinculos/foco-app`. Prepara rascunhos locais, importa e recalcula relatórios, compara critérios e oferece acervo temporário por padrão. Persistência e cache da interface são opt-in separados; APIs, PDFs, pedidos e relatórios não entram no cache offline.

Modelo comercial escolhido: relatório avulso por objeto/edição/amostra. Preço confirmado: R$ 39,90 por relatório com revisão humana. Projeto360x foi escolhida para produção após validar a integração; prazo, disponibilidade e pagamento continuam em validação. O app não transmite pedidos nem confirma compra; pagamento não garante selo. O operador usa o serviço privado, com cota GLOBAL de 3 tentativas/dia, compartilhada entre trabalhos e testes.

A chave da API foi criada e configurada no servidor com audiência privada, sem inclusão no GitHub. A conexão ao modelo foi verificada. Duas tentativas receberam recusa do provedor; a terceira completou após a concessão de créditos, mas a validação descartou as fontes e manteve nota/selo pendentes. O caso foi complementado por revisão assistida separada, sem nova chamada paga. Diagnóstico técnico seguro distingue acesso, quota, rate limit e falha de configuração. Isso atualiza o estado de preparação descrito na seção1.4, sem revalidar conteúdo clínico/jurídico.

Validação: 15 testes do app, 48 do serviço, 30 do motor e 90 casos de equivalência; 39 artigos/ferramentas anteriores preservados. Instalação PWA depende do navegador e não foi homologada fisicamente em Safari/iOS. Não há cobrança ativa nem receita demonstrada.


## Contato e prazo do FOCO CLARO — 03/11/2026

Contato público autorizado: **aldenirmed@gmail.com**. O prazo será **combinado em cada pedido**, com data concreta, forma de entrega, escopo e disponibilidade registrados na cotação antes da contratação. O app, o rascunho e o catálogo apresentam essa política; os links `mailto:` não enviam mensagens automaticamente.

As condições do piloto estão em `foco-app/index.html#contato` na fonte do módulo. Preço permanece R$39,90, cobrança desativada e cota global de três tentativas/dia preservada. E-mail e política de prazo definidos não comprovam homologação do pagamento/entrega. As datas dos artigos clínicos e jurídicos anteriores foram preservadas.
