# FOCO CLARO + NeuroVínculos Brasil

Versão integrada 1.1 · 10/10/2026.

## Usar pelo nome ou arquivo

No seu assistente, envie `/FOCO nome, link ou arquivo` e forneça [AGENTE.md](AGENTE.md) e [SKILL.md](SKILL.md) quando a habilidade não estiver instalada. Para PDF privado, anexe o arquivo no ambiente em que deseja analisá-lo; ele não é enviado pelo site.

O agente identifica a edição, investiga as fontes, aplica [rubricas.json](rubricas.json) e cria uma avaliação JSON. O [painel](PAINEL.html) importa esse JSON, calcula o resultado e exporta o relatório. O campo “Preparar pedido” gera uma solicitação reutilizável. Ele não executa pesquisa ou IA no navegador.

## Integração dos componentes

| Componente | Função |
| --- | --- |
| NeuroVínculos | Ciência, direitos, fé e inclusão no Brasil; porta de entrada do avaliador. |
| Agente FOCO CLARO | Investiga nome/link/arquivo com as ferramentas do assistente e documenta as evidências. |
| Habilidade portátil | Protocolo de análise e limites; versão Codex em `skills/foco-claro-tdah-friendly`. |
| Motor Python e JavaScript | Calculam a mesma rubrica e as condições para emissão do selo. |
| Painel | Preenchimento/importação, cálculo, exportação e índice de compatibilidade de cursos. |

`dados.js` é gerado das fontes JSON. Alterar a rubrica ou os cursos exige gerar novamente os dados e validar o pacote. Um nome isolado ou uma preferência não produz selo automaticamente.

## Regra de emissão

Todos os critérios precisam de nota, evidência e fonte, sem depender apenas de inferência. As três condições essenciais precisam estar verificadas. Lacunas ou inferências deixam a classificação pendente; falha crítica impede selo. Pontuação completa: até 70 sem selo; acima de 70 até 80 bronze; acima de 80 até 90 prata; acima de 90 ouro. Aplicar os limites antes de arredondar.

As notas de cada critério vão de 0 a 5, com até uma casa decimal, em ambos os motores. O selo é editorial experimental no escopo documentado. Não mede dopamina ou chance de atenção. O índice de cursos é compatibilidade das respostas preenchidas; a probabilidade de sucesso profissional permanece não estimada.

## Preservação

O pacote original FOCO CLARO 1.0 foi preservado em backup. A integração 1.1 corrige diferenças entre os motores, impede selo baseado somente em inferências e valida importações antes de preencher o painel. Preferências de jogos continuam separadas das notas.

O pacote público e o arquivo de entrega usam listas de arquivos permitidos. Documentos particulares que compartilhem a pasta de trabalho não entram na entrega. Salvar o código no GitHub, publicar um site, instalar a habilidade e catalogar no Notion são estados verificados separadamente.
