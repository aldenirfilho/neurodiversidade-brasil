# FOCO CLARO — piloto de relatórios avulsos

Pesquisa pública em **03/11/2026**. Modelo escolhido pelo usuário: **venda de relatórios avulsos**. Preço confirmado pelo usuário: **R$ 39,90 por relatório com revisão humana**. Os cenários de custos continuam ilustrativos. Esta pesquisa não criou cobrança ou receita real; produto e preço de teste foram provisionados depois, em sandbox isolado.

Decisões comerciais posteriores: contato público **aldenirmed@gmail.com** e **prazo combinado em cada pedido**. Registrar data concreta e forma de entrega na cotação antes da contratação/pagamento. Os direitos do consumidor permanecem garantidos; os detalhes de operação e a integração hospedada ainda não liberam cobrança de produção.

## Oferta recomendada para o piloto

**Um pedido = um objeto identificado, uma edição/plataforma e uma tarefa ou amostra delimitada.** Entrega: relatório editorial com nota/cobertura, selo quando elegível ou pendências, facilitadores/barreiras, fontes rastreáveis e limites da análise. PDF de até 2 MB/12 páginas no serviço atual; obra maior exige amostra identificada. A pessoa compra o trabalho de análise, **sem comprar aprovação ou selo**. Ausência de evidência pode produzir resultado pendente; isso precisa aparecer antes da compra.

Começar como serviço privado operado por Aldenir: briefing → conferência de escopo e capacidade → checkout → pagamento confirmado → análise → revisão humana → entrega do relatório. O aplicativo organiza pedidos e acervo; a audiência atual do avaliador é privada. Não prometer acesso automático do comprador enquanto identidade, autorização por pedido e entrega segura não estiverem implementadas.

## Capacidade que não pode ser vendida duas vezes

A cota de **3 tentativas por dia é GLOBAL**, compartilhada por todos os pedidos e testes. Não são 3 por comprador. Em um mês ilustrativo de 30 dias, há no máximo **90 tentativas**, não 90 entregas garantidas: falhas e timeouts também podem consumir reservas. Um operador pode avaliar no máximo três pedidos novos no dia, se não houver testes ou falhas. Não prometer entrega instantânea ou prazo fixo sem aferir capacidade.

Antes de cobrar, reservar um prazo de atendimento compatível com a fila. Um checkout que venda pedidos ilimitados é incompatível com esta versão. Para ampliar depois: identidades e pedidos isolados, cotas por cliente + teto global persistente, orçamento e direitos de acesso. Isso exige nova decisão; a cota atual deve permanecer em 3.

## Custos verificáveis da API

Preço padrão consultado: GPT-5.4 mini **US$0,75 por milhão de tokens de entrada**, **US$4,50 por milhão de saída**; pesquisa web **US$0,01 por chamada**, além dos tokens recuperados. Entrada total deve incluir prompt, material e pesquisa. [Preços oficiais OpenAI](https://developers.openai.com/api/docs/pricing).

Fórmula: `C_API_USD = 0,75 × entrada/1.000.000 + 4,50 × saída/1.000.000 + 0,01 × buscas`.

| Cenário ilustrativo por tentativa | Saída / buscas | Custo por tentativa | Até 90 tentativas nesse cenário |
|---|---:|---:|---:|
| 10 mil tokens de entrada total | 5 mil / 1 | US$0,040 | US$3,60 |
| 50 mil tokens de entrada total | 5 mil / 1 | US$0,070 | US$6,30 |
| 150 mil tokens de entrada total | 5 mil / 1 | US$0,145 | US$13,05 |

Esses cenários não são teto financeiro nem previsão de uso. PDFs são processados como texto **e imagens**; tamanho em MB e páginas não determina tokens. `detail:low` reduz detalhe visual, sem eliminar o texto. [Documentação oficial de arquivos](https://developers.openai.com/api/docs/guides/file-inputs).

## Três preços hipotéticos para decidir o piloto

Tarifa pública padrão da Stripe Brasil para cartão nacional: **3,99% + R$0,39** por transação. Checkout e Payment Links constam como incluídos no Payments; contratos, métodos e serviços adicionais podem alterar o custo. [Preços oficiais Stripe Brasil](https://stripe.com/br/pricing).

Para esta conta de exemplo, assumimos **câmbio fictício de R$5,50/US$**, API de US$0,04 e **uma tentativa por relatório**. Não é cotação atual. Revisão humana ilustrativa: 15 minutos a R$50/h = R$12,50. Preços abaixo são hipóteses, sem checkout publicado.

| Preço hipotético | Taxa de cartão | Após cartão + API | Após também 15 min de revisão |
|---:|---:|---:|---:|
| R$9,90 | R$0,79 | R$8,89 | **−R$3,61** |
| R$19,90 | R$1,18 | R$18,50 | R$6,00 |
| R$39,90 | R$1,98 | R$37,70 | R$25,20 |

São contribuições parciais, **não lucro**: faltam impostos, câmbio efetivo, hospedagem, suporte, aquisição de clientes, reprocessamentos, reembolsos e contestações. R$39,90 foi o preço escolhido para o piloto; o exemplo não prova aceitação do mercado. Reavaliar sua sustentabilidade a partir do tempo medido em relatórios reais e da experiência de compradores, sem alterar unilateralmente cotações já aceitas.

## Pagamento e entrega: requisitos concretos

Uma venda avulsa usa Checkout em modo `payment`, com preço validado no servidor. O retorno visual de sucesso não comprova pagamento nem libera o relatório. A entrega deve depender de webhook com assinatura verificada, estado de pagamento pertinente e processamento idempotente. Pagamentos assíncronos exigem tratar sucesso/falha posterior. [Guia Stripe para entrega após Checkout](https://docs.stripe.com/checkout/fulfillment), [assinatura de webhooks](https://docs.stripe.com/webhooks).

Desenvolver e conferir em sandbox isolado antes de cobrar em produção. [Testes Stripe](https://docs.stripe.com/testing-use-cases). Não habilitar faturamento recorrente para este produto avulso. Tributos e emissão fiscal precisam de definição contábil; não presumir que um parâmetro de imposto resolva essas obrigações.

## Decisões que faltam para abrir vendas

1. Preço e política de prazo confirmados. Formalizar escopo, data e forma de entrega por pedido, condições de resultado inconclusivo e reembolso; medir tempo e tokens em um relatório real.
2. Confirmar conta/ambiente de pagamento e validar sandbox, webhook, pedido e entrega. A conta de produção conectada, por si só, não autoriza alterações financeiras nem prova cobrança.
3. Validar oferta com um pequeno piloto pago autorizado. Contar pedidos, pagamentos, relatórios entregues e reembolsos separadamente; interface, checkout de teste e intenção de compra não são receita.

Nenhuma nota pode ser ajustada para satisfazer cliente pagante. O selo continua editorial experimental, sem certificação clínica, promessa de dopamina, atenção garantida ou adequação universal ao TDAH.


---

# Apêndice — contrato de comércio do piloto

Desenho técnico para implementação revisável em 03/11/2026. **Não descreve pagamento, pedido recebido ou entrega já existentes.** Permite testar o fluxo com fixtures sem chave Stripe e sem tocar na conta de produção.

## MVP aprovável agora

Aplicativo instalável com descrição da entrega, briefing de um objeto, importação e comparação de relatórios e exportação de um **rascunho de pedido**. A interface apresenta o preço confirmado e informa que o pagamento continua em validação. Um rascunho gerado no navegador não é pedido enviado. Nenhum nome, e-mail ou material é transmitido sem ação/consentimento específicos. O operador revisa o briefing e confirma escopo, disponibilidade, data e forma de entrega antes da cobrança.

Estado público atual do catálogo: `mode=pilot_validation`, `checkout_enabled=false`, `currency=brl`, `unit_amount=3990`, `price_confirmed=true`, `global_daily_attempt_limit=3`, `support_email=aldenirmed@gmail.com`, `deadline_policy=per_order_agreement`. Sem acesso real ao contador, mostrar disponibilidade “a confirmar”, não inventar vagas. Cada cotação deve ter uma data concreta; a política geral não autoriza prazo indefinido após o pagamento.

## Contratos de servidor para a próxima etapa

| Recurso proposto | Entrada confiável mínima | Saída/efeito permitido |
|---|---|---|
| GET `/api/comercio/catalogo` | Nenhum dado pessoal | Produto/versionamento, escopo, preço confirmado ou null, venda habilitada ou não, limite global e política de inconclusivo |
| POST `/api/comercio/briefings` | Categoria, nome/edição/plataforma, URL pública opcional, escopo, consentimento versionado; limite de tamanho | ID de briefing e estado `aguardando_revisao`; não cria pagamento nem inicia API |
| POST administrativo `/api/comercio/cotacoes` | Briefing aceito, preço/moeda, versão, prazo/capacidade e termos definidos pelo operador autenticado | Cotação imutável/versionada; alteração relevante exige nova aceitação |
| POST `/api/comercio/pedidos` | ID da cotação e sua versão, aceite dos termos, chave de idempotência e identidade autorizada | Reserva de capacidade e pedido `reservado_pendente`; não aceitar preço/status fornecido pelo navegador |
| POST `/api/comercio/checkout` | Pedido autorizado com reserva válida | Sessão Checkout vinculada ao pedido; modo payment, quantidade 1, preço do catálogo do servidor; em piloto offline, 503 `CHECKOUT_NOT_CONFIGURED` sem chamar Stripe |
| GET `/api/comercio/pedidos/{id}` | Identidade com direito àquele pedido | Somente estado e entrega daquele comprador; ID aleatório não substitui autorização |
| POST `/api/comercio/webhook` | Corpo bruto, assinatura Stripe e limite de tamanho | Evento validado, deduplicado e persistido; atualiza pagamento/fila, nunca muda nota ou selo |
| POST administrativo `/api/comercio/pedidos/{id}/entrega` | Operador, pagamento confirmado, relatório revisado com hash/versão | Marca entrega somente após disponibilização segura verificável; não afirmar que e-mail foi enviado sem uma ação real autorizada |

Guardar valores financeiros como centavos inteiros, moeda explícita e snapshot do escopo/termos. O ID local do pedido pode ser `client_reference_id` e metadata do Checkout; evitar dados pessoais e trechos do documento em metadata. Identificadores de sessão e evento devem ter unicidade própria. A chave Stripe e o segredo do webhook ficam no servidor, fora do GitHub e do navegador.

## Três dimensões de estado

Separar pagamento de trabalho e entrega evita “pago = pronto” e permite que uma contestação aconteça após a entrega.

| Dimensão | Estados propostos |
|---|---|
| Pedido | rascunho → aguardando_revisao → cotado → reservado_pendente → aceito → encerrado; cancelado quando pertinente |
| Pagamento | nao_iniciado, pendente, pago_confirmado, falhou, expirado, reembolsado, contestado |
| Relatório | nao_iniciado, na_fila, em_analise, em_revisao, disponivel_para_entrega, entregue, bloqueado |

Fluxo nominal: cotação aceita + capacidade reservada → checkout pendente → webhook confirma pagamento → fila assistida → operador inicia análise respeitando cota → revisão → relatório disponibilizado ao comprador → entrega registrada. “Despachado” só é usado quando houve uma disponibilização/transmissão concreta; não equivale a leitura pelo comprador.

No protótipo, qualquer transição de pagamento deve carregar `simulated=true` e ambiente `fixture`; não misturar esses eventos com relatórios de receita ou pedidos reais. Um operador não deve clicar “Marcar pago” para simular confirmação de Stripe em produção.

## Webhook e reconciliação

Assinatura verificada sobre o **corpo bruto**, validação de recência e prevenção de replay precedem mudança de estado. O evento e o pedido precisam corresponder ao ambiente, conta, sessão, preço e moeda esperados. Duplicatas válidas retornam sucesso sem novo pedido, nova análise ou segunda entrega. Não rebaixar um pedido já pago por uma mensagem antiga fora de ordem: reconciliar o objeto atual quando necessário. [Webhooks Stripe](https://docs.stripe.com/webhooks).

`checkout.session.completed` pode estar com pagamento pendente; nesse caso manter `pendente`. Para esta oferta de preço positivo, só liberar a fila com confirmação de pagamento efetivo. Tratar `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired` conforme o estado pertinente. A página success e um JSON do cliente nunca confirmam recebimento. Expiração de sessão sem pagamento libera a reserva comercial; timeout de análise não devolve automaticamente uma tentativa de API já consumida. [Entrega com Checkout](https://docs.stripe.com/checkout/fulfillment?ui=full-page).

Na criação de Checkout, a mesma tentativa de operação preserva a chave de idempotência. Timeout não significa que não foi criada sessão: reconciliar antes de criar outra. [Tratamento de erros Stripe](https://docs.stripe.com/error-low-level).

**Atenção à audiência privada:** o avaliador atual exige login ChatGPT antes do Worker. Não presumir que a Stripe consegue entregar eventos a uma rota `/webhook` ali. É preciso confirmar uma entrada pública de webhook com validação estrita ou integração oficial suportada, preservando a proteção do avaliador. Não abrir todo o serviço para resolver o callback. Isso é uma dependência arquitetural a testar, não um motivo para retirar autenticação.

## Capacidade e cobranças

A reserva comercial não é a reserva de chamada de API. Ambas precisam ser reconciliadas: tentativas já usadas (incluindo testes/falhas) + trabalhos reservados ainda não iniciados não podem ultrapassar a capacidade prometida para o período. Uma transação deve impedir dois compradores de pegarem a mesma vaga. Como falhas podem consumir as três chamadas sem produzir três relatórios, o prazo do piloto precisa permitir tratamento assistido/remarcação/reembolso conforme a política aceita. Sem essa política e visibilidade do contador, manter checkout desativado.

O pagamento compra análise de um escopo, incluindo eventual conclusão “dados insuficientes”. O comprador não compra nota mínima nem selo. Reembolso, cancelamento e contestação são estados financeiros registrados; não editam o resultado editorial. A política para trabalho não executado, inconclusivo ou falha técnica deve ficar clara antes da venda e ser validada juridicamente/contabilmente antes da operação comercial.

## Testes de contrato, sem Stripe real

1. Catálogo sem preço/configuração bloqueia checkout; briefing/rascunho não é marcado como recebido ou pago.
2. Preço, moeda, conta, ID da sessão ou dono divergentes são rejeitados; pedido alheio não é legível.
3. Duas reservas concorrentes para a última vaga produzem somente uma reserva; preservar o limite global 3.
4. Mesmo event ID/session ID processado duas vezes ou concorrentemente produz uma única confirmação e fila.
5. Assinatura ausente/inválida, replay antigo e corpo acima do limite não alteram pedido.
6. Completed/unpaid mantém pendência; sucesso assíncrono confirma; falha/expiração não entregam; evento antigo não desfaz pagamento confirmado.
7. Página de sucesso, parâmetro `paid=true`, armazenamento local editado ou clique de cliente não liberam relatório.
8. Falha da API consome a reserva da tentativa, sem nova chamada automática e sem declarar relatório entregue.
9. Relatório sem cobertura/travas permanece pendente mesmo para cliente pagante; pagamento nunca muda selo.
10. Dados de fixture ficam identificados como simulação, fora dos totais de receita real.

Aprovação final de preço, conta/ambiente de pagamento, termos, política e endpoint de webhook torna o piloto concreto; nenhum desses testes equivale a pagamento ou entrega reais.
