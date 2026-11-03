# FOCO CLARO — comércio assistido 0.1.0

Núcleo e rotas de servidor para **um relatório editorial avulso de R$39,90 (3990 centavos BRL)**, preço autorizado pelo usuário. Código executável com fixtures; **checkout de produção permanece desativado por padrão**. A suíte automatizada não usa credenciais nem rede; a validação separada em sandbox está registrada abaixo. Não houve cobrança ou entrega comercial real.

A compra cobre o trabalho de análise de um objeto/edição/tarefa/amostra. Não compra aprovação: o relatório pode ter nota incompleta e selo pendente. Pagamento não altera a rubrica, a nota ou o selo.

## Fluxo e autenticação

1. Um operador autenticado confirma objeto, escopo, comprador, termos, capacidade e prazo; `createQuote` gera um snapshot imutável, válido por 30 minutos.
2. O comprador autenticado aceita a versão da cotação e dos termos. `reserveOrder` exige repositório durável e operação atômica; UUID do pedido não substitui autorização.
3. `checkoutParameters` usa somente preço do servidor, quantidade 1, modo `payment`, metadata do pedido e URLs HTTPS configuradas no servidor. A chave de idempotência é estável; `integration_identifier` termina em oito letras aleatórias. Não há `payment_method_types`.
4. Reserva comercial dura 35 minutos; a criação de Checkout exige pelo menos 31 minutos restantes e transmite a expiração à Stripe. Se a janela não comportar criação segura, renovar a reserva com o operador. Não liberar capacidade de um checkout ainda pagável apenas por um relógio local: reconciliar sessão/expiração na Stripe.
5. Webhook com assinatura válida e pagamento efetivo confirma o pedido e o coloca em **fila assistida**. Não inicia API, cria selo, marca entrega ou envia mensagem.
6. Operador executa análise respeitando o contador FOCO CLARO, revisa e disponibiliza o relatório. O registro de entrega ainda deve ser integrado pelo hospedeiro.

## Limites e capacidade

`capacityApproved:true` é uma decisão do operador em contexto autenticado, não um parâmetro que o comprador pode se atribuir. A reserva comercial é separada do ledger da API. Este módulo **não lê o ledger FOCO CLARO e não garante sozinho três chamadas globais/dia**. A cota existente continua em 3; não há aumento, multiplicação por comprador ou início automático de análise a partir de pagamento.

Antes de abrir vendas, o operador precisa validar prazo e fila. Um adaptador integrado deve reconciliar chamadas já consumidas (incluindo falhas/testes) com trabalhos reservados e impedir sobrecontratação. Preço confirmado não comprova disponibilidade de atendimento.

## Arquivos e funções

- `core.mjs`: catálogo, cotação, reserva, parâmetros/abertura de Checkout e verificação/processamento de webhook.
- `worker.mjs`: factory `createCommerceHandler({repository,resolveIdentity,createStripeSession,config,now})`. Export default seguro expõe catálogo e recusa pagamentos sem configuração.
- `d1-repository.mjs`: adaptador real com statements preparados D1; `drizzle/` contém a migração schema-only.
- `runtime.mjs`: configuração por ambiente e factory de Worker, com construtor SDK injetado e identidade do operador vinculada por ID.
- `test-*.mjs`: testes sem rede, com SQLite real, compatibilidade da API D1, rollback e HMAC WebCrypto. A camada que simula o transporte D1 nos testes é uma fixture; o SQL exercitado é o do adaptador real. **D1 hospedado ainda não homologado**.

Rotas da factory: GET `/api/comercio/catalogo`; POST `/api/comercio/cotacoes` (operador); POST `/api/comercio/pedidos`; POST `/api/comercio/checkout`; GET `/api/comercio/pedidos/{id}` (dono); POST `/api/comercio/webhook` (assinatura, sem login de comprador).

O resolvedor de identidade deve obter autenticação confiável no servidor. Nunca construir `actor` a partir de JSON, parâmetros de URL ou um cabeçalho de cliente não autenticado.

`operatorOwnerId` é obrigatório na configuração. O Worker deriva o papel do ID autenticado que corresponde a esse valor: um usuário comum que declare `role:operator` não cria cotações. `authenticated` e flags de habilitação só aceitam o booleano `true`, nunca um texto truthy.

## Contrato do repositório injetado

`durable:true` é atestação do adaptador validado, não uma alternativa a persistência real:

- `putQuote(quote)`, `getQuote(id)` e `getOrder(id)` guardam/recuperam snapshots.
- `reserveOrder(args)` revalida atomicamente cotação, versão, termos, dono, aprovação e expiração; uma cotação só pode reservar um pedido. O par comprador/chave de idempotência retorna o mesmo pedido e rejeita reutilização em outra cotação.
- `attachCheckout({orderId,sessionId,url,expectedRevision})` vincula uma sessão por pedido com compare-and-swap; a mesma sessão repetida é idempotente.
- `getEvent(id)` e `commitWebhook({eventId,eventType,orderId,sessionId,expectedRevision,update,receivedAt})` deduplicam evento e atualizam pedido **na mesma transação**. Resposta `{conflict:true}` permite releitura limitada; `{duplicate:true,order}` confirma replay sem novo efeito.

O adaptador D1 usa um único INSERT condicional com índices UNIQUE para reservar; a aplicação do webhook combina INSERT de evento, UPDATE com compare-and-swap e marcação de processamento no mesmo `db.batch`. Falha de qualquer statement deve reverter o lote. O SQL é testado em SQLite com a API D1 simulada, incluindo falha induzida e reabertura de arquivo. Não há fallback em memória ou criação de tabelas durante uma requisição. Persistem apenas dados necessários do pedido; PDFs, avaliações e cartões não entram nesse repositório. [Contrato transacional oficial de batch D1](https://developers.cloudflare.com/d1/worker-api/d1-database/).

A migração é para instalação nova. Se o banco já tiver histórico de migrações, anexar a próxima migração/journal ao histórico correto; **não substituir um journal já aplicado pelo deste módulo**. Fonte e migrações ainda precisam ser implantadas e testadas em D1 hospedado.

## Configuração e fail closed

São obrigatórios os sinais de implantação validada `checkoutEnabled`, `paymentIntegrationValidated`, `persistenceValidated`, mais `operatorOwnerId`, `priceId`, `accountId`, `livemode` e `publicBaseUrl`. Flags não fazem a validação por conta própria: só ativá-las após os testes de integração e a autorização do ambiente. O adapter `createStripeSession(params,{idempotencyKey})` deve usar a API/SDK oficial com chave somente no servidor. `validatedSessionCreator` verifica o Price efetivo antes de criar uma sessão: ativo, avulso, 3990 BRL e ambiente correspondente. Erro de preço não deve ser descoberto apenas depois de uma cobrança, no webhook.

`createRuntimeWorker({stripeClientFactory,resolveIdentity})` aceita um construtor da instância oficial StripeClient. Usa `client.v1` quando presente ou os métodos do cliente fornecido; as operações sempre pertencem à instância. O artefato padrão não injeta SDK e, portanto, **não abre Checkout mesmo que existam flags no ambiente**. A API do catálogo só anuncia habilitação com persistência, identidade e adapter disponíveis. A configuração por ambiente usa os nomes abaixo, sem seus valores secretos no código:

| Nome de ambiente | Finalidade |
|---|---|
| `DB` | Binding D1 com migração aplicada |
| `FOCO_COMMERCE_OPERATOR_ID` | ID confiável do operador autorizado |
| `FOCO_COMMERCE_ENABLED`, `FOCO_COMMERCE_VALIDATED`, `FOCO_COMMERCE_PERSISTENCE_VALIDATED` | Habilitação após testes; valores exatos `true` |
| `FOCO_STRIPE_PRICE_ID`, `FOCO_STRIPE_ACCOUNT_ID`, `FOCO_STRIPE_LIVEMODE` | Preço/conta aprovados; modo explícito true/false |
| `FOCO_COMMERCE_PUBLIC_BASE_URL` | Origem HTTPS confiável dos retornos |
| `STRIPE_SECRET_KEY` | Chave restrita do servidor, no ambiente correto |
| `STRIPE_WEBHOOK_SECRET`, `FOCO_COMMERCE_WEBHOOK_ENABLED`, `FOCO_STRIPE_DIRECT_ACCOUNT_WEBHOOK` | Assinatura/ativação e vínculo da conta |
| `FOCO_TRUST_SITES_IDENTITY` | Só ativar quando o gateway Sites autentica e substitui os cabeçalhos de identidade |

Fora da fronteira Sites validada, fornecer um resolvedor de identidade real e não confiar em cabeçalhos que o próprio cliente pode enviar.

Webhook exige `webhookEnabled` e `webhookSecret` servidor. O código verifica HMAC-SHA256 do corpo bruto via `crypto.subtle.verify`, janela de 300 segundos e versões v1; não aceita tolerância zero. Valida conta, ambiente, sessão, pedido/referência, versão da oferta/cotação, modo, BRL e valor 3990. `completed/unpaid` fica pendente; sucesso assíncrono exige `paid`; falha/expiração não geram entrega nem rebaixam pagamento já confirmado. O evento válido é deduplicado atomicamente.

Eventos de uma conta Stripe direta podem não conter `event.account`. Só aceitar essa ausência com `directAccountWebhook:true`, atestando que o segredo foi provisionado para o `accountId` do servidor. Caso `event.account` exista, deve corresponder. Chaves/segredos de teste e produção nunca se misturam.

O serviço FOCO CLARO atual é privado. **Não presumir que Stripe consegue entregar webhook através do gate de login ChatGPT**. Confirmar uma entrada pública restrita para webhook ou integração oficialmente suportada, preservando o avaliador privado. Não abrir todo o serviço para contornar esse requisito.

## O que falta antes de vender

- Aplicar/homologar o adaptador persistente e a migração em D1; resolvedor de identidade; integração da reserva com capacidade real; formulário de termos/escopo/prazo e tratamento do resultado inconclusivo.
- Validar em sandbox criação/expiração de sessão, pagamento, evento assíncrono, assinatura, duplicatas, conflito, fila assistida e entrega segura. Sucesso visual do Checkout não prova pagamento ou entrega.
- Configurar conta/ambiente e Price aprovados, segredos e endpoint de webhook acessível; revisar política de reembolso, cancelamento/contestação, suporte, tributos e emissão fiscal.
- Só então ativar flags de produção. Este MVP não automatiza reembolsos nem conciliação de disputas; dependem de operação administrativa e integração posterior. Nenhuma receita foi demonstrada pelo código/testes.

## Testes

Node 24; executar `npm test` nesta pasta. Sem dependências externas de teste e sem acesso a Stripe/OpenAI. Cobertura inclui autenticação/versões/valor, idempotência e concorrência SQLite/D1, persistência/reinício/rollback, origens/URLs, HMAC/replay, vinculação de conta, estados assíncronos e preservação de pagamento confirmado. `npm run build` usa esbuild já instalado no módulo irmão `servico-foco` (ou no próprio projeto) e gera Worker ESM em `dist/server/index.js`, sem ativar Checkout nem criar hospedagem. A integração hospedada real fica a cargo do hospedeiro.

Referências consultadas em 03/11/2026: [Checkout e entrega](https://docs.stripe.com/checkout/fulfillment?ui=full-page), [Checkout](https://docs.stripe.com/checkout/quickstart), [webhooks](https://docs.stripe.com/webhooks), [idempotência/erros](https://docs.stripe.com/error-low-level), [sandbox](https://docs.stripe.com/testing-use-cases).


## Harness local de teste Stripe

`local-sandbox.mjs` não integra a entrada Worker/bundle. Importar o módulo não faz chamadas. Executá-lo com configuração explícita realiza operações reais **somente no sandbox TESTE**, usando instância SDK oficial, SQLite e o adaptador D1 do módulo. Nenhuma execução paga ou de produção é permitida por esse harness.

Pré-requisitos para execução pelo operador:

- `FOCO_STRIPE_TEST_ONLY=true`.
- `FOCO_STRIPE_SANDBOX_CONFIG`: caminho absoluto do JSON autorizado com `secret_key` e `account_id`, arquivo próprio, regular, sem symlink, permissões 0600. Prefixos test aceitos: sk_test_, rk_test_ e rkcs_test_; nenhum deles é convertido em autorização para produção.
- `FOCO_STRIPE_SDK_MODULE`: caminho absoluto do SDK oficial instalado (arquivo ESM ou módulo CommonJS).
- `FOCO_STRIPE_WEBHOOK_SECRET_FILE`: arquivo seguro 0600 contendo o segredo do listener de TESTE como texto ou JSON com `webhook_secret`. O segredo não aparece nos argumentos de processo nem nos logs.
- `FOCO_STRIPE_CATALOG_FILE`: caminho absoluto de catálogo de teste já criado, contendo price_id/product_id e, quando presentes, amount/currency/livemode/account_id coerentes. Também aceita `FOCO_STRIPE_PRICE_ID` e `FOCO_STRIPE_PRODUCT_ID`. Se Price já foi criado, fornecê-lo para não criar outro.
- `FOCO_STRIPE_LOCAL_PORT`: opcional, padrão4197. `FOCO_STRIPE_QA_RETURN_ORIGIN`: opcional, padrãohttps://example.org, apenas retorno técnico do fixture. Não representa uma página de entrega de produção.

Com Price fornecido, o harness não cria produto/preço: recupera e valida o preço e cria uma sessão de teste idempotente por pedido. Sem Price, pode criar produto/preço QA em teste, com chaves de idempotência próprias. O resultado só mostra IDs, link checkout de TESTE e endereço local. Dados da chave, segredo e link de claim nunca são impressos ou copiados para o repositório. O comprador usa nome/identidade técnicos e e-mail reservado example.com; não inserir dados de uma pessoa real.

A execução mantém servidor em `http://127.0.0.1:4197`. Encaminhar o listener de TESTE para `/webhook` nesse endereço. GET `/status` informa pagamento/fila assistida e quantidade de eventos processados. HMAC válido e transição local provam somente esse trajeto local via listener; **não provam callback público de produção, hospedagem D1 ou entrega comercial**. O prazo de sete dias do fixture não é promessa do produto. `.runtime/` guarda somente banco e resumo QA local ignorados pelo Git.

Prévia de API do núcleo usada pelo harness: `createQuote(input, operator, {now})` → `repository.putQuote(quote)` → `reserveOrder(repository, request, buyer, config, {now})` → `validatedSessionCreator({retrievePrice,createSession}, config)` → `startCheckout(repository, order.id, buyer, config, creator)`. Webhook usa `processWebhook(repository, rawBody, signatureHeader, config)`.

## Validação observada — 03/11/2026

Em sandbox isolado, o Checkout hospedado exibiu R$39,90 e o aviso de que nenhum pagamento real seria processado. Um cartão oficial de teste e identidade fictícia concluíram o fluxo. O evento real de teste `checkout.session.completed` foi encaminhado pelo listener oficial ao harness: resposta HTTP200, um evento processado, `payment_status:paid_confirmed` e `fulfillment_status:queued_assisted` no SQLite. Nenhuma análise OpenAI, selo ou entrega foi iniciada pelo pagamento.

O retorno usou domínio de exemplo e não comprova a página de entrega. D1 hospedado, callback público, identidade dos compradores, conciliação de capacidade e entrega comercial permanecem pendentes. Este resultado valida o trajeto sandbox → listener → webhook assinado → banco local; não ativa a conta de produção.


## Contato e política de prazo confirmados — 03/11/2026

Contato público: **aldenirmed@gmail.com**. Prazo **combinado em cada pedido**; esta política não substitui a data futura concreta `deliveryDueAt` obrigatória em cada cotação antes do pagamento. Escopo, capacidade e forma de entrega precisam ser acordados. Cobrança de produção continua desativada; não foi realizada nova operação Stripe por esta atualização.
