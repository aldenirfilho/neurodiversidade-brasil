# FOCO CLARO — Motor TDAH Friendly 1.1

**Método editorial experimental para escolhas pessoais. Não é selo oficial, avaliação clínica ou certificado WCAG.**

## Começar pelo caminho mais simples
Abra **PAINEL.html** no navegador. O painel funciona localmente, sem cadastro, assinatura, envio de dados ou chave de API. Escolha o tipo de conteúdo, descreva a edição/tarefa avaliada e preencha apenas critérios com evidência. O painel calcula e exporta a avaliação. A aba de cursos apresenta ideias e um índice de compatibilidade preenchível.

**O painel não pesquisa um título sozinho e não lê PDFs automaticamente.** A avaliação do conteúdo é feita por uma pessoa ou por um assistente com as ferramentas apropriadas, guiado por **AGENTE.md** e **SKILL.md**. Depois, o motor calcula as notas documentadas. Este pacote não instala serviço autônomo ou plugin.

## Os três componentes
| Componente | Arquivo | Função |
|---|---|---|
| Agente | AGENTE.md | Prompt que orienta coleta de evidências e análise. |
| Habilidade | SKILL.md | Regras completas por mídia, evidência, limites, privacidade e saída. |
| Motor | motor.py e PAINEL.html | Cálculo, faixas, cobertura, travas e exportação. |

## Selos
| Resultado | Regra exata |
|---|---|
| Sem selo | S ≤ 70 |
| Bronze | 70 < S ≤ 80 |
| Prata | 80 < S ≤ 90 |
| Ouro | 90 < S ≤ 100 |

70 não aprova; 80 é bronze; 90 é prata. A nota é um índice em 100 pontos, não porcentagem de atenção futura. Dados ausentes e travas não verificadas produzem pendência, não selo completo. Uma barreira crítica de segurança ou manipulação pode impedir selo mesmo com boa apresentação.

## Critérios
Clareza; continuidade/pouco atrito; facilidade para começar; baixa carga de memória; engajamento significativo; pausa/retomada; apresentação/controle de estímulos; autonomia. Notas de 0 a 5, com âncoras em rubricas.json. O painel e o motor Python aceitam até uma casa decimal.

Pesos de jogos: **15 / 20 / 15 / 10 / 15 / 10 / 10 / 5**. Os pesos de outros tipos estão no arquivo de rubricas. Todos somam 100. Os pesos são uma proposta editorial, não derivação de ensaio clínico.

**S = soma(peso × nota / 5).**

### Não confundir
Afinidade pessoal ≠ acessibilidade geral. Facilidade para começar ≠ jogo sem desafio. Ritmo interessante ≠ cortes rápidos obrigatórios. Leitura clara ≠ perda de rigor. Interesse sustentável ≠ incapacidade de parar. A escala não mede dopamina.

## Uso com um assistente
Forneça AGENTE.md, SKILL.md e rubricas.json a um ambiente com pesquisa e leitura de arquivos; inclua perfil_preferencias.json para a personalização declarada. Exemplos de solicitação:

```text
/FOCO [nome e edição do jogo]
/FOCO [nome do filme e ano]
/FOCO [arquivo PDF anexado]
/COMPARAR [produto A] versus [produto B]
/CURSO [nome do curso e instituição]
```

O comando é uma convenção deste projeto, não um recurso que instala um agente automaticamente. Os três exemplos de jogos do perfil são referências declaradas, **não avaliações publicadas**. Não existem notas reais pré-preenchidas neste pacote.

## Uso técnico — Python
Requisito: Python 3.10 ou superior. Apenas biblioteca padrão; sem instalação de dependências.

```bash
cd foco-claro
python motor.py exemplo_ficticio.json --output resultado.json --markdown resultado.md
python -m unittest -v
```

Copie avaliacao_em_branco.json e preencha título, categoria, escopo, notas, evidências, fontes e travas. Critérios sem observação ficam com rating: null. Não execute arquivos anexados desconhecidos. Este script não precisa nem solicita senhas.

Para o índice de curso, crie um JSON contendo ratings com os seis campos de course_weights em rubricas.json e valores de 0 a 5:

```bash
python motor.py meu_curso.json --course --output compatibilidade.json
```

**success_probability permanece null por construção.** O índice de compatibilidade só é calculado quando todas as respostas estão presentes; não pressupõe informações pessoais.

## Travas e confiança
As travas são segurança essencial, autonomia sem coerção e objeto/escopo identificados. Elas se referem somente ao contexto observado e não substituem auditorias especializadas. Desconhecido não é aprovação; falha impede selo.

O relatório mostra:
- Nota completa quando todos os critérios estão documentados.
- Cobertura percentual dos critérios, ponderada pelos pesos.
- Nota parcial normalizada apenas como informação provisória.
- Limites aritméticos da nota caso os critérios ausentes fossem todos 0 ou todos 5 — não intervalo estatístico.
- Confiança qualitativa e critérios pendentes.

Alta confiança no escopo significa observação direta documentada, não eficácia clínica nem garantia de preferência. O motor verifica campos e cálculos, mas não consegue confirmar por si mesmo se a evidência escrita é verdadeira.

## Cursos
CURSOS.md e a aba de cursos reúnem propostas curriculares e bases de graduação para pesquisar. Não há percentuais individuais de sucesso profissional. A seleção busca aproximar os interesses do projeto — tecnologia, saúde, educação, simplificação e governo — de atividades concretas e apoios necessários; não constitui um ranking de carreiras para todas as pessoas com TDAH.

O índice usa interesse (25), prática verificada (20), estrutura/apoio (20), rotina sustentável (15), custo (10) e trajetória/mercado verificados (10). Cada campo recebe 0–5 após experiência ou verificação. Zero significa incompatibilidade/barreira documentada, não ausência de informação. Em branco significa desconhecido. Um resultado de 80 significa 80/100 de compatibilidade nesta rubrica, não 80% de chance de emprego.

Antes de decisões financeiras ou acadêmicas, verificar a oferta concreta, currículo, reconhecimento, custos e apoios disponíveis. Uma formação proposta neste projeto não se transforma em curso reconhecido por ter uma boa ideia ou título.

## Privacidade e limites
Sem telemetria, monitoramento oculto, conexão automática à internet ou armazenamento em nuvem. O painel mantém os dados somente na sessão da página; exporte o JSON para conservá-los. Fechar/recarregar pode perder preenchimentos. Não inserir dados pessoais identificáveis de pacientes, alunos ou terceiros.

Arquivos exportados pelo painel são locais. O painel não envia avaliações automaticamente ao Notion ou a outros serviços. O Markdown pode ser usado como registro em plataformas que aceitem esse formato.

## Evidência e validação
Fontes em fontes.json: W3C COGA e WCAG 2.2, Xbox Accessibility Guidelines, NIMH e Acas. Elas fundamentam princípios gerais, não validam esta escala personalizada. O motor passou por testes de limites, dados ausentes, campos inválidos e travas, registrados em testes.txt. Testes de software não são validação clínica.

Para evoluir para avaliação pública: testar com participantes diversos, comparar avaliadores independentes, medir erros e dificuldades reais de uso, verificar validade de construto e apresentar conflitos de interesse. Para personalização: comparar previsões com feedback posterior em novos itens, sem forçar as referências iniciais.

Versão: 1.0.0 | Data: 09/10/2026.

## Atualização integrada 1.1 — 10/10/2026

O painel agora usa `dados.js`, `motor.js` e `painel.js` adjacentes. Abrir a pasta completa, não copiar somente o HTML. Os dados são gerados de `rubricas.json`, `cursos.json` e `perfil_preferencias.json` por `../scripts/generate_foco_data.py`.

Notas por critério com até uma casa decimal em ambos os motores. Critérios apenas inferidos mantêm pendência; relatório lista a confirmação necessária. Importações são validadas antes do preenchimento. 10 graduações reais e11 propostas curriculares preservadas separadamente em CURSOS.md.

O painel inclui um gerador de pedido por nome/link. A pesquisa e a análise do PDF são executadas pelo assistente com AGENTE.md/SKILL.md; não há IA embutida ou leitura automática de PDF no navegador. A habilidade portátil Codex acompanha o repositório.
