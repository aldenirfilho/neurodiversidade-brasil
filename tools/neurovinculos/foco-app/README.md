# FOCO CLARO App — piloto 0.1.0

Interface web instalável em português brasileiro para preparar pedidos, importar relatórios FOCO CLARO, consultar critérios e fontes e comparar duas avaliações da mesma categoria.

## Entrega concreta

- Pedido de **relatório avulso**, com objeto/edição/amostra, categoria e objetivo; gera texto baixável no navegador, sem transmissão ou compra.
- Link para a área privada do operador do projeto. O piloto prevê produção mediada pelo operador, não acesso automático de compradores ao serviço. A cota inicial é **global: 3 análises/dia**, não uma franquia por comprador.
- Acervo de até 20 relatórios importados, somente em memória por padrão. Persistência neste navegador depende de consentimento explícito; desmarcar remove apenas as chaves de cópia do app.
- Importação JSON até 2 MB: exige `assessment` + `report` da rubrica atual; ignora nota/selo recebidos e recalcula pelo motor canônico. Fontes referenciadas precisam existir no arquivo; autenticidade e veracidade não são verificadas novamente.
- Comparação lado a lado da mesma categoria, com alerta de escopos diferentes e de notas parciais. Não cria ranking de pessoas nem certifica atenção futura.
- Manifesto PWA e ícone SVG. Instalação depende do suporte do navegador.
- Service worker registrado apenas por ação explícita. Cache permite somente a interface e o motor/rubrica; nenhuma API, PDF, pedido ou relatório entra nesse cache.

## Oferta comercial

Modelo escolhido pelo usuário: venda de relatórios avulsos. A oferta identifica um objeto/edição/amostra; inclui nota/cobertura, selo editorial ou pendência, fontes, facilitadores/barreiras e limites. **Preço confirmado: R$ 39,90 por relatório com revisão humana. Conta escolhida: Projeto360x, após validação da integração. Não há checkout ativo nesta versão; disponibilidade e prazo serão confirmados antes da contratação.** O botão Montar pedido funciona localmente e não realiza contratação.

Os recursos de acervo e comparação não têm paywall nesta versão. Não há promessa de geração de receita, benefício clínico, selo garantido ou retenção de atenção.

## Integração

A pasta depende de `../foco-claro/dados.js` e `../foco-claro/motor.js`, preservados como fonte canônica. Incluir os arquivos desta pasta na lista pública e espelhá-los por build. O controle de integridade anterior deve permitir apenas nesta pasta os usos explícitos de armazenamento local e do cache opt-in; não remover a restrição geral das outras páginas.

Abrir por servidor HTTP/HTTPS, sem executar arquivos recebidos. Para testes unitários: `node --test foco-app/test-model.cjs`, a partir da fonte NeuroVínculos. Nenhuma chamada paga é feita pelo app; pedidos reais ocorrem no serviço privado com consentimento próprio.

Os originais da revista e as datas clínicas/jurídicas não foram alterados. Nenhuma chave, dado pessoal ou relatório real foi incluído no código. Dados sintéticos de teste não são avaliações reais.
