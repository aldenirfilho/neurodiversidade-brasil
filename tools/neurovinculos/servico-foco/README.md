# FOCO CLARO — serviço automático 0.1.0

Implementação de análise por nome, URL pública HTTPS ou PDF autorizado. A IA propõe evidências estruturadas; o motor canônico 1.1 calcula a nota e a elegibilidade do selo. A citação identifica uma fonte atribuída pelo provedor, não comprova por si só a verdade de cada alegação. A identificação de fonte primária pelo modelo é declarada, sem validação independente.

## Estado em 03/11/2026

Serviço publicado com acesso privado: https://foco-claro-neurovinculos.aldenirmed.chatgpt.site

**Chave criada e configurada no servidor privado.** A autenticação e o acesso ao modelo foram conferidos por GET técnico. Duas tentativas reais receberam recusa HTTP do provedor. A terceira foi concluída, mas fontes não aceitas produziram cobertura zero e nenhuma nota ou selo automático. A cota diária chegou a três e foi preservada. A cota conserva essas reservas. O diagnóstico é limitado e redigido sem chave, conteúdo enviado ou mensagens brutas. A correspondência de URLs de fontes recebeu ajuste para parâmetros de rastreamento e metadados de diagnóstico. A causa específica ainda não foi confirmada e o reteste do resultado automático aguarda cota disponível, sem quarta tentativa.

O site GitHub oferece a nova interface e o link ao serviço privado. GitHub Pages hospeda os arquivos estáticos; a execução ocorre no servidor privado. O painel manual continua disponível.

## Limites iniciais de consumo

- 3 pedidos por dia, contados no fuso America/Fortaleza; intervalo mínimo de 1 minuto.
- Reserva atômica em D1/SQLite antes da chamada; persistência entre reinícios; identificador único evita replay.
- Uma chamada Responses por pedido e no máximo uma ferramenta de pesquisa; até 5.000 tokens de saída; sem retry automático.
- Campos de até 1.200 caracteres. PDF: até 2 MB e 12 páginas, confirmadas por parser real; sem execução de anexos. Arquivo inválido, senha ou ação incorporada: rejeitar.
- Falha, timeout ou cancelamento após início podem consumir a cota e gerar cobrança; a reserva não é devolvida.

**Isso limita uso, não estabelece um teto monetário.** Entrada, imagens das páginas, saída e pesquisa têm custos. Não há nesta versão bloqueio financeiro por saldo em reais/dólares. A API recebe texto e imagens em `detail:low`; PDFs não usam pesquisa web. Arquivos maiores devem ser recortados pelo usuário como amostras identificadas.

## Privacidade e autorização

Chave somente no servidor, nunca no HTML, GitHub ou navegador. O banco guarda apenas UUID, dia e horário da reserva; perguntas, PDFs e relatórios não são persistidos pela aplicação. O pedido usa `store:false`, que não elimina as políticas de retenção do provedor. Hospedagem e provedor podem manter registros próprios. Não enviar prontuários, dados pessoais ou informações de terceiros.

O envio exige consentimento explícito na interface. O serviço exige identidade autenticada e mantém a audiência privada. Requisições de origem diferente, sem chave, sem banco ou com controle de uso indisponível são bloqueadas antes da API. URLs do usuário não são baixadas pelo servidor; a pesquisa pública acontece na ferramenta do provedor. Documentos são dados não confiáveis: instruções embutidas não alteram a rubrica.

## Contrato

- `GET /api/foco/status`: estado real, cota, limites e modelo; nenhuma chamada paga.
- `GET /api/foco/diagnostico`: consulta fixa ao modelo, sem gerar relatório ou consumir uma tentativa de análise.
- `POST /api/foco/analisar`: `{request_id,query,category,scope,consent:true,pdf?:{name,data_base64}}`.
- Resposta: `assessment`, `report`, `sources`, `limitations`, `usage`, `quota`.
- Critérios sem fonte rastreável recebem `null`. Fontes apenas localizadas ou secundárias são inferências; travas sem evidência ficam desconhecidas. Cobertura integral sem inferências e três travas verificadas são necessárias para selo.

Fontes expõem URL/arquivo, localização, data de registro e estado: citado pelo modelo, localizado na busca ou arquivo enviado. PDFs trazem páginas válidas; o escopo não é automaticamente a obra inteira. As fontes específicas são retornadas em cada análise, sem avaliações pré-fabricadas para jogos ou filmes reais.

## Verificação e manutenção

Node 24. Executar `npm ci --ignore-scripts --no-audit --no-fund`, `npm run build` e `npm test` nesta pasta. O build empacota o Worker ESM com `pdf-lib` e o motor existente. `npm run preview` inicia somente em `127.0.0.1:4193`, com banco local ignorado pelo Git; sem configuração segura, não faz chamadas pagas.

Na hospedagem: binding D1 `DB`; migração schema-only em `drizzle/`; variáveis secretas/runtime `OPENAI_API_KEY` e `FOCO_ENABLED`. Usar o fluxo seguro da habilidade OpenAI Developers, sem copiar chaves em chats. Falha de implantação pode ter aplicado a migração; preservar o histórico e conferir o estado antes de tentar novamente. O servidor privado também precisa de teste real de API após a configuração.

Rollback: desativar `FOCO_ENABLED` interrompe novas análises; o painel manual e o portal continuam utilizáveis. Código versionado e versões Sites preservam a entrega anterior. Não há instalação global de habilidade nem pesquisa contínua em segundo plano.

## Referências técnicas consultadas em 03/11/2026

- [Responses e pesquisa web](https://developers.openai.com/api/docs/guides/tools-web-search)
- [Entrada de arquivos e processamento visual de PDF](https://developers.openai.com/api/docs/guides/file-inputs)
- [Modelo GPT-5.4 mini e recursos suportados](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [Preços da API — conferir antes de ampliar cotas](https://developers.openai.com/api/docs/pricing)
- [pdf-lib — documentação do projeto](https://pdf-lib.js.org/)

Rubrica, pesos e datas de revisão clínica/jurídica do portal foram preservados. O selo é editorial experimental, não certificação clínica, oficial ou WCAG, e não mede dopamina nem prevê atenção futura.
