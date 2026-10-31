window.FOCO_DATA = {
  "CONFIG": {
    "name": "FOCO CLARO — TDAH Friendly",
    "version": "1.1.0",
    "date": "2026-10-09",
    "status": "Método editorial experimental e personalizado; não é certificação clínica ou oficial.",
    "axes": [
      {
        "id": "clareza",
        "label": "Clareza do objetivo",
        "description": "Entender o objetivo e a próxima ação sem adivinhar.",
        "anchors": {
          "0": "Objetivo ou próxima ação não identificável.",
          "3": "Objetivo identificável, mas exige procura/ajuda em alguns momentos.",
          "5": "Objetivo e próxima ação claros e disponíveis quando necessários."
        }
      },
      {
        "id": "fluxo",
        "label": "Continuidade e pouco atrito",
        "description": "Chegar à atividade principal e mantê-la sem interrupções desnecessárias.",
        "anchors": {
          "0": "Interrupções ou etapas alheias impedem a atividade principal.",
          "3": "Fluxo utilizável com interrupções ocasionais documentadas.",
          "5": "Atividade principal direta; interrupções raras, úteis ou controláveis."
        }
      },
      {
        "id": "entrada",
        "label": "Simplicidade para começar",
        "description": "Aprender o essencial e começar; profundidade opcional não equivale a barreira.",
        "anchors": {
          "0": "Entrada bloqueada por instruções, configuração ou comandos indecifráveis.",
          "3": "É possível começar após orientação moderada.",
          "5": "O essencial se aprende e se executa com pouca preparação; complexidade é progressiva."
        }
      },
      {
        "id": "memoria",
        "label": "Baixa exigência de memória operacional",
        "description": "Objetivos, contexto e caminhos visíveis; não depender de lembrar informações dispersas.",
        "anchors": {
          "0": "Exige lembrar contexto, regras e caminhos que não podem ser consultados.",
          "3": "Algumas informações externas à memória estão disponíveis.",
          "5": "Contexto, objetivos, exemplos ou referências recuperáveis com facilidade."
        }
      },
      {
        "id": "engajamento",
        "label": "Engajamento significativo",
        "description": "Interesse, progresso e retorno compreensível; não premiar compulsão ou tempo infinito de uso.",
        "anchors": {
          "0": "O conteúdo/retorno não atende ao objetivo e ao interesse declarado no escopo.",
          "3": "Interesse e retorno úteis, mas irregulares.",
          "5": "Interesse sustentado relatado/observado, progresso ou significado claros, sem depender de coerção."
        }
      },
      {
        "id": "retomada",
        "label": "Pausa, retomada e recuperação",
        "description": "Parar e voltar sem perder contexto/progresso; recuperar erros sem punição desproporcional.",
        "anchors": {
          "0": "Interromper causa perda importante de contexto/progresso sem recuperação.",
          "3": "Retomada possível com algum retrabalho.",
          "5": "Pausa, retomada, recapitulação ou recuperação simples e confiável."
        }
      },
      {
        "id": "apresentacao",
        "label": "Apresentação e controle de estímulos",
        "description": "Legibilidade e opções para ajustar sons, animações, densidade e outros estímulos.",
        "anchors": {
          "0": "Apresentação impede compreensão/uso no contexto avaliado.",
          "3": "Apresentação utilizável, com limitações ou opções incompletas.",
          "5": "Apresentação clara e controles adequados aos estímulos e necessidades do contexto."
        }
      },
      {
        "id": "autonomia",
        "label": "Autonomia e ausência de coerção",
        "description": "Liberdade para parar, sair, desfazer e recusar; sem pressão manipulativa.",
        "anchors": {
          "0": "Barreiras coercitivas à saída/recusa ou pressão manipulativa grave observada.",
          "3": "É possível controlar e encerrar, mas há fricções evitáveis.",
          "5": "Controle claro de pausas, saída e opções; ausência de coerção no escopo verificado."
        }
      }
    ],
    "categories": {
      "jogo": {
        "weights": {
          "clareza": 15,
          "fluxo": 20,
          "entrada": 15,
          "memoria": 10,
          "engajamento": 15,
          "retomada": 10,
          "apresentacao": 10,
          "autonomia": 5
        },
        "focus": [
          "Tempo entre iniciar e jogar de fato",
          "Interrupções obrigatórias, tutoriais e cenas não puláveis",
          "Controles essenciais versus combinações opcionais avançadas",
          "Inventários, coleta e deslocamentos obrigatórios",
          "Objetivos e orientação consultáveis",
          "Pausa, salvamento e repetição após erros",
          "Leitura da tela, câmera e controles de áudio",
          "Adequação de dificuldade sem confundir desafio com burocracia"
        ]
      },
      "livro": {
        "weights": {
          "clareza": 15,
          "fluxo": 10,
          "entrada": 15,
          "memoria": 20,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 15,
          "autonomia": 5
        },
        "focus": [
          "Edição e formato",
          "Amostra representativa, inclusive capítulo denso",
          "Estrutura e títulos",
          "Parágrafos, exemplos e resumos",
          "Dependências de leitura e glossário",
          "Retomada e navegação",
          "Rigor e precisão separados de apresentação",
          "Interesse pelo tema sem presumir atenção universal"
        ]
      },
      "pdf": {
        "weights": {
          "clareza": 15,
          "fluxo": 10,
          "entrada": 15,
          "memoria": 20,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 15,
          "autonomia": 5
        },
        "focus": [
          "Arquivo exato e páginas avaliadas",
          "Texto selecionável e pesquisável",
          "Índice, marcadores e ordem de leitura",
          "Hierarquia, contraste, tabelas e figuras",
          "Verificação visual além da extração textual",
          "Exemplos, resumos e recuperação do contexto",
          "Conteúdo técnico não deve perder rigor para ficar curto",
          "Amostra parcial não representa automaticamente o documento inteiro"
        ]
      },
      "filme": {
        "weights": {
          "clareza": 15,
          "fluxo": 20,
          "entrada": 10,
          "memoria": 20,
          "engajamento": 15,
          "retomada": 10,
          "apresentacao": 5,
          "autonomia": 5
        },
        "focus": [
          "Título, ano e versão",
          "Clareza de objetivo e personagens",
          "Dependência de muitas linhas temporais",
          "Ritmo e retorno narrativo relevantes ao gosto, não velocidade por si só",
          "Carga de exposição e informação",
          "Pausas e retomada dependem também da plataforma",
          "Legendas, dublagem e áudio dependem da edição",
          "Não confundir qualidade artística e afinidade pessoal"
        ]
      },
      "serie": {
        "weights": {
          "clareza": 15,
          "fluxo": 20,
          "entrada": 10,
          "memoria": 20,
          "engajamento": 15,
          "retomada": 10,
          "apresentacao": 5,
          "autonomia": 5
        },
        "focus": [
          "Título, ano, temporada e amostra de episódios",
          "Clareza de premissa e personagens",
          "Continuidade obrigatória entre episódios",
          "Recapitulação e retomada",
          "Ritmo e carga narrativa",
          "Não avaliar a série inteira só pelo piloto",
          "Controles e publicidade pertencem à plataforma",
          "Evitar spoilers e alegações de ter assistido sem acesso"
        ]
      },
      "programa_tv": {
        "weights": {
          "clareza": 15,
          "fluxo": 20,
          "entrada": 10,
          "memoria": 20,
          "engajamento": 15,
          "retomada": 10,
          "apresentacao": 5,
          "autonomia": 5
        },
        "focus": [
          "Programa e edição/episódio",
          "Objetivo de cada bloco",
          "Mudanças de assunto e interrupções",
          "Poluição audiovisual",
          "Publicidade separada do conteúdo",
          "Recapitulação e retomada",
          "Controles disponíveis na plataforma",
          "Não inferir transmissão completa a partir de sinopse"
        ]
      },
      "site": {
        "weights": {
          "clareza": 15,
          "fluxo": 15,
          "entrada": 20,
          "memoria": 15,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 10,
          "autonomia": 5
        },
        "focus": [
          "Página e fluxo exatos",
          "Número de etapas e próxima ação",
          "Consistência de menus e rótulos",
          "Interrupções, publicidade e notificações",
          "Ajuda e correção de erros",
          "Retomada e dados preservados",
          "Acessibilidade visual e teclado quando testável",
          "Não acessar conta ou dados pessoais sem autorização"
        ]
      },
      "app": {
        "weights": {
          "clareza": 15,
          "fluxo": 15,
          "entrada": 20,
          "memoria": 15,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 10,
          "autonomia": 5
        },
        "focus": [
          "Versão, sistema e plano",
          "Configuração inicial",
          "Ação principal",
          "Notificações e ruído",
          "Rascunhos, desfazer e salvamento",
          "Controles de estímulos",
          "Saída e cancelamento claros",
          "Separar privacidade e segurança de facilidade de uso"
        ]
      },
      "software": {
        "weights": {
          "clareza": 15,
          "fluxo": 15,
          "entrada": 20,
          "memoria": 15,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 10,
          "autonomia": 5
        },
        "focus": [
          "Versão e ambiente",
          "Fluxo de tarefa representativo",
          "Configuração e curva de entrada",
          "Atalhos e comandos consistentes",
          "Automação com revisão humana quando necessária",
          "Histórico, desfazer e recuperação",
          "Personalização de interface e alertas",
          "Não desabilitar mecanismos de segurança para ganhar pontos"
        ]
      },
      "produto": {
        "weights": {
          "clareza": 15,
          "fluxo": 15,
          "entrada": 20,
          "memoria": 15,
          "engajamento": 10,
          "retomada": 10,
          "apresentacao": 10,
          "autonomia": 5
        },
        "focus": [
          "Modelo e finalidade",
          "Manual e sinalização",
          "Montagem e primeira utilização",
          "Controles físicos compreensíveis",
          "Erros e manutenção",
          "Feedback do estado",
          "Segurança obrigatória preservada",
          "Ficha comercial não substitui teste de uso"
        ]
      }
    },
    "boundaries": {
      "SEM_SELO": "0 <= S <= 70",
      "BRONZE": "70 < S <= 80",
      "PRATA": "80 < S <= 90",
      "OURO": "90 < S <= 100"
    },
    "gates": [
      "seguranca_essencial",
      "autonomia_sem_coercao",
      "objeto_e_escopo_identificados"
    ],
    "bases": [
      "observacao_direta",
      "documentacao_primaria",
      "relato_usuario",
      "inferencia"
    ],
    "course_weights": {
      "interesse": 25,
      "pratica_verificada": 20,
      "estrutura_e_apoio": 20,
      "rotina_sustentavel": 15,
      "viabilidade_custo": 10,
      "trajetoria_e_mercado_verificados": 10
    },
    "integration_date": "2026-10-10"
  },
  "COURSES": {
    "note": "Graduações existentes e propostas curriculares estão separadas. Denominações e graus têm referência oficial; nenhuma instituição, campus, vaga, currículo, apoio, remuneração ou oferta concreta foi validada. TDAH não determina carreira. Não foram localizadas probabilidades brasileiras validadas de sucesso individual por graduação em TDAH grave; probabilidades e índices permanecem null até verificação apropriada, e o índice nunca vira prognóstico.",
    "weights": {
      "interesse": 25,
      "pratica_verificada": 20,
      "estrutura_e_apoio": 20,
      "rotina_sustentavel": 15,
      "viabilidade_custo": 10,
      "trajetoria_e_mercado_verificados": 10
    },
    "courses": [
      {
        "id": "design",
        "curso": "Design",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Criar produtos, comunicação visual ou serviços por pesquisa, prototipagem e testes.",
        "afinidade_condicional": "Investigar se há interesse persistente em resolver problemas visuais e revisar soluções após feedback.",
        "apoio": "Briefing por escrito, etapas pequenas, revisão de usuários e portfólio com escopo delimitado.",
        "barreira": "Prazos simultâneos, críticas, revisões repetidas e documentação; criatividade não elimina execução.",
        "atuacao": "Design de produtos, comunicação e serviços, conforme formação e portfólio.",
        "fontes_denominacao": [
          "MEC-DCN-GRAD"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "ads",
        "curso": "Análise e Desenvolvimento de Sistemas",
        "grupo": "graduacoes_existentes",
        "grau": "Tecnólogo",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Analisar requisitos, programar, testar e manter sistemas.",
        "afinidade_condicional": "Experimentar programação e depuração; gostar de tecnologia não comprova afinidade com o trabalho diário.",
        "apoio": "Entregas pequenas, tutoria, testes, revisão de código e registro do próximo passo.",
        "barreira": "Depuração longa, leitura técnica, manutenção, concentração em detalhes e atualização contínua.",
        "atuacao": "Desenvolvimento, testes e manutenção de software.",
        "fontes_denominacao": [
          "MEC-CNCST2024"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "fisioterapia",
        "curso": "Fisioterapia",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Avaliar movimento e função, planejar intervenções e acompanhar evolução em práticas supervisionadas.",
        "afinidade_condicional": "Investigar interesse em anatomia, raciocínio clínico, contato com pessoas e acompanhamento continuado.",
        "apoio": "Treino supervisionado, roteiros de avaliação, agenda, registro estruturado e feedback clínico.",
        "barreira": "Conteúdo biológico, documentação, atenção aos limites de segurança, estágio e repetição terapêutica.",
        "atuacao": "Avaliação funcional e cuidado fisioterapêutico, conforme habilitação e registro profissional.",
        "fontes_denominacao": [
          "MEC-DCN-GRAD"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "educacao-fisica",
        "curso": "Educação Física",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado ou licenciatura, com percursos distintos",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Estudar movimento, planejar práticas corporais e acompanhar aprendizagem ou exercício conforme o grau.",
        "afinidade_condicional": "Testar interesse em ensino, movimento e acompanhamento de pessoas; praticar esporte e ensinar são atividades diferentes.",
        "apoio": "Plano de aula ou sessão, instruções escritas, calendário, supervisão e rotinas de segurança.",
        "barreira": "Fisiologia, avaliações, planejamento, gestão de grupos e responsabilidade; verificar as atribuições de cada grau.",
        "atuacao": "Ensino escolar no percurso de licenciatura; exercício e práticas corporais nas atribuições do bacharelado.",
        "fontes_denominacao": [
          "MEC-DCN-GRAD"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "engenharia-mecanica",
        "curso": "Engenharia Mecânica",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Analisar, projetar e testar sistemas mecânicos com matemática, simulação e laboratório.",
        "afinidade_condicional": "Verificar interesse sustentado em matemática, física, projeto e testes, incluindo cálculos e registros.",
        "apoio": "Tutoria em fundamentos, exercícios por etapas, laboratório supervisionado e revisão de cálculos.",
        "barreira": "Cálculo, física, relatórios, normas, precisão, segurança e projetos de longa duração.",
        "atuacao": "Projetos, testes, produção e manutenção de sistemas mecânicos, conforme habilitação.",
        "fontes_denominacao": [
          "INEP-CINE2025"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "jogos-digitais",
        "curso": "Jogos Digitais",
        "grupo": "graduacoes_existentes",
        "grau": "Tecnólogo",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Projetar, programar, testar e produzir experiências interativas.",
        "afinidade_condicional": "Criar um protótipo pequeno e experimentar tarefas técnicas; gostar de jogar não basta.",
        "apoio": "Escopo reduzido, divisão clara de funções, controle de versões, testes e entregas intermediárias.",
        "barreira": "Programação, arte ou áudio, correção repetitiva de falhas, negociação de equipe e controle de escopo.",
        "atuacao": "Desenvolvimento, testes e produção de jogos e experiências interativas.",
        "fontes_denominacao": [
          "MEC-CNCST2024"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "estatistica",
        "curso": "Estatística",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Planejar coleta, analisar dados, modelar incerteza e comunicar resultados.",
        "afinidade_condicional": "Testar interesse em matemática, investigação e checagem de resultados, incluindo limpeza de dados.",
        "apoio": "Problemas definidos, cadernos de análise, tutoria matemática, revisão de código e resultados.",
        "barreira": "Probabilidade, cálculo, programação, dados incompletos, checagem minuciosa e comunicação de limites.",
        "atuacao": "Análise de dados, modelagem e pesquisa aplicada, conforme formação.",
        "fontes_denominacao": [
          "MEC-ESTATISTICA"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "administracao",
        "curso": "Administração",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Planejar e acompanhar processos, recursos, equipes e decisões organizacionais.",
        "afinidade_condicional": "Investigar interesse em resolver problemas organizacionais e executar acompanhamento, não apenas ter ideias.",
        "apoio": "Agenda visível, papéis claros, estudos de caso, metas intermediárias e revisão financeira.",
        "barreira": "Planilhas, prazos, rotinas administrativas, conflitos, prestação de contas e tarefas recorrentes.",
        "atuacao": "Gestão de processos, projetos e organizações, conforme experiência e atribuições.",
        "fontes_denominacao": [
          "MEC-DCN-GRAD"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "enfermagem",
        "curso": "Enfermagem",
        "grupo": "graduacoes_existentes",
        "grau": "Bacharelado",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Planejar e executar cuidado, acompanhar pacientes e coordenar processos em práticas supervisionadas.",
        "afinidade_condicional": "Verificar interesse pelo cuidado, estudo clínico e responsabilidade em equipe, sem presumir aptidão pelo diagnóstico.",
        "apoio": "Supervisão, rotinas de conferência, registros estruturados, passagem de informações e planejamento de estudo.",
        "barreira": "Conteúdo clínico, procedimentos, registros, interrupções, turnos e responsabilidade por segurança.",
        "atuacao": "Cuidado e gestão em enfermagem, conforme habilitação e registro profissional.",
        "fontes_denominacao": [
          "MEC-DCN-GRAD"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      },
      {
        "id": "pedagogia",
        "curso": "Pedagogia",
        "grupo": "graduacoes_existentes",
        "grau": "Licenciatura",
        "status": "Graduação existente no Brasil; oferta específica a verificar",
        "atividade": "Planejar ensino, acompanhar aprendizagem e estudar práticas e organização educacionais.",
        "afinidade_condicional": "Experimentar planejamento e condução de uma atividade de ensino, além do interesse por educação.",
        "apoio": "Planos por etapas, rubricas, co-planejamento, materiais acessíveis e feedback de supervisão.",
        "barreira": "Leitura e escrita acadêmica, planejamento, documentação, gestão de grupos e acompanhamento prolongado.",
        "atuacao": "Docência e atividades educacionais nas atribuições do curso e das normas aplicáveis.",
        "fontes_denominacao": [
          "INEP-CINE2025"
        ],
        "natureza_analise": "Atividade, afinidade, barreiras e apoios são síntese editorial para investigação individual; não ranking clínico nem resultado medido deste curso.",
        "verificacao_oferta": {
          "instituicao": null,
          "campus": null,
          "modalidade": null,
          "codigo_emec": null,
          "ato_regulatorio": null,
          "curriculo": null,
          "apoio_institucional": null
        },
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        }
      }
    ],
    "schema_version": "1.1.0",
    "updated": "2026-10-10",
    "proposed_courses": [
      {
        "curso": "Supervisão e Auditoria de IA",
        "status": "Curso proposto",
        "atividade": "Investigar falhas, testar sistemas e produzir relatórios curtos.",
        "apoio": "Listas de verificação, casos delimitados e revisão em dupla.",
        "barreira": "Normas extensas, documentação minuciosa e responsabilidade.",
        "atuacao": "Auditoria, testes de qualidade e governança.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Engenharia da Simplicidade e Experiência do Usuário",
        "status": "Curso proposto",
        "atividade": "Transformar produtos confusos em protótipos funcionais.",
        "apoio": "Projetos pequenos, retorno de usuários e critérios objetivos.",
        "barreira": "Revisões sucessivas, negociação e prazos.",
        "atuacao": "Pesquisa de uso, design de interação e produtos digitais.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Neurodesign e Acessibilidade Cognitiva",
        "status": "Curso proposto",
        "atividade": "Criar interfaces com menos ruído e validar com usuários.",
        "apoio": "Roteiros de teste, supervisão e métricas de tarefa.",
        "barreira": "Ética, pesquisa, estatística e risco de generalizar perfis.",
        "atuacao": "Acessibilidade, pesquisa de experiência e avaliação de interfaces.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Saúde Digital e Informática em Saúde",
        "status": "Trilha interdisciplinar proposta",
        "atividade": "Organizar dados e melhorar sistemas de saúde.",
        "apoio": "Casos práticos, revisão técnica e escopo definido.",
        "barreira": "Privacidade, qualidade de dados e segurança; não substitui habilitação clínica.",
        "atuacao": "Implementação, curadoria de dados e qualidade de sistemas.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Design Educacional e Tutoria com IA",
        "status": "Trilha interdisciplinar proposta",
        "atividade": "Criar aulas, simuladores e materiais claros.",
        "apoio": "Módulos curtos, rubricas, colaboração com educadores.",
        "barreira": "Planejamento, acessibilidade e comprovação de aprendizagem.",
        "atuacao": "Produção educacional, formação de docentes e avaliação de ferramentas.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Gestão de Pessoas e Transição do Trabalho com IA",
        "status": "Curso proposto",
        "atividade": "Redesenhar funções e apoiar requalificação.",
        "apoio": "Casos concretos, agenda visível e acompanhamentos regulares.",
        "barreira": "Conflitos, processos repetitivos e acompanhamento prolongado.",
        "atuacao": "Desenvolvimento de pessoas e desenho de trabalho.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Política, Governo e Ciência de Decisão",
        "status": "Curso proposto",
        "atividade": "Construir e comparar políticas públicas.",
        "apoio": "Simulações, metas verificáveis e projetos com equipe.",
        "barreira": "Leitura extensa, negociação, orçamento e prestação de contas.",
        "atuacao": "Análise de políticas, gestão pública e assessoria; não garante cargo eletivo.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Jogos Digitais e Simulação",
        "status": "Trilha de investigação proposta",
        "atividade": "Programar protótipos e testar interações.",
        "apoio": "Projetos delimitados, papéis de equipe e escopo controlado.",
        "barreira": "Criar jogos exige trabalho técnico repetitivo; gostar de jogar não basta.",
        "atuacao": "Desenvolvimento, testes e simulação educacional.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares",
        "nota_denominacao": "O título composto é uma trilha do projeto, não uma denominação de graduação verificada. Investigar cursos-base com nomes oficiais."
      },
      {
        "curso": "Ciência de Dados e Estatística Aplicada",
        "status": "Trilha de investigação proposta",
        "atividade": "Responder perguntas com dados e modelos.",
        "apoio": "Problemas definidos, revisões e cadernos de análise.",
        "barreira": "Matemática, limpeza de dados e checagem detalhada.",
        "atuacao": "Análise, qualidade de dados e pesquisa aplicada.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares",
        "nota_denominacao": "O título composto é uma trilha do projeto, não uma denominação de graduação verificada. Investigar cursos-base com nomes oficiais."
      },
      {
        "curso": "Comunicação Científica e Produção Multimídia",
        "status": "Trilha interdisciplinar proposta",
        "atividade": "Explicar temas complexos com materiais visuais.",
        "apoio": "Pautas delimitadas, roteiros e revisão científica.",
        "barreira": "Revisão, direitos autorais e disciplina de produção.",
        "atuacao": "Conteúdo científico, documentação e educação.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares"
      },
      {
        "curso": "Engenharia Biomédica e Tecnologias Assistivas",
        "status": "Trilha de investigação proposta",
        "atividade": "Projetar e testar soluções de uso concreto.",
        "apoio": "Laboratórios supervisionados e etapas verificáveis.",
        "barreira": "Matemática, validação, manutenção e regras de segurança.",
        "atuacao": "Desenvolvimento, testes e gestão de tecnologia.",
        "probabilidade_sucesso_profissional": null,
        "indice_compatibilidade": null,
        "ratings": {
          "interesse": null,
          "pratica_verificada": null,
          "estrutura_e_apoio": null,
          "rotina_sustentavel": null,
          "viabilidade_custo": null,
          "trajetoria_e_mercado_verificados": null
        },
        "grupo": "propostas_curriculares",
        "nota_denominacao": "O título composto é uma trilha do projeto, não uma denominação de graduação verificada. Investigar cursos-base com nomes oficiais."
      }
    ],
    "interpretation": "O índice preenchível descreve compatibilidade segundo uma rubrica editorial não validada clinicamente. Zero exige barreira documentada; null significa dado ausente. Apoios devem preservar competências essenciais e segurança."
  },
  "PROFILE": {
    "scope": "Preferências declaradas; não constitui diagnóstico, validação clínica ou auditoria de jogos.",
    "likes": [
      "ação imediata",
      "pouca narrativa obrigatória",
      "poucas interrupções",
      "controles essenciais diretos",
      "sessões de 15–40 minutos",
      "retomada simples"
    ],
    "anchors": [
      {
        "title": "Devil May Cry 5",
        "edition": "não especificada neste pedido",
        "declared_preference": "referência de ouro",
        "audited_score": null
      },
      {
        "title": "Ninja Gaiden",
        "edition": "não especificada neste pedido",
        "declared_preference": "referência de ouro",
        "audited_score": null
      },
      {
        "title": "Onimusha",
        "edition": "não especificada neste pedido",
        "declared_preference": "referência de baixa afinidade / sem selo pessoal",
        "audited_score": null
      }
    ],
    "rule": "As referências calibram preferências; nunca pré-preencher notas ou forçar resultados por título."
  }
};
