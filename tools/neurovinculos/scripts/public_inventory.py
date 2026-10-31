"""Explicit inventories: unrelated/private documents never enter either package."""
PUBLIC = [
    'index.html', 'styles.css', 'app.js', 'content.js',
    'assets/simbolo.svg', 'assets/pertencer.svg', 'FONTES.md', 'README.md', '.nojekyll',
    'foco-claro/PAINEL.html', 'foco-claro/painel.js', 'foco-claro/motor.js', 'foco-claro/dados.js',
    'foco-claro/rubricas.json', 'foco-claro/cursos.json', 'foco-claro/fontes.json',
    'foco-claro/perfil_preferencias.json', 'foco-claro/avaliacao_em_branco.json',
    'foco-claro/AGENTE.md', 'foco-claro/SKILL.md', 'foco-claro/CURSOS.md', 'foco-claro/INTEGRACAO.md',
    'pesquisa-tdah/index.html', 'pesquisa-tdah/guia.css', 'pesquisa-tdah/guia.js',
    'pesquisa-tdah/dados.js', 'pesquisa-tdah/fontes.json', 'pesquisa-tdah/GUIA_TDAH.md',
    'pesquisa-tdah/AGENTE.md', 'pesquisa-tdah/PROTOCOLO_PESQUISA.md'
]
SOURCE = PUBLIC + [
    'AGENTS.md', 'package.json', '.gitignore',
    'scripts/public_inventory.py', 'scripts/generate_foco_data.py', 'scripts/check_site.py',
    'scripts/build_site.py', 'scripts/test_foco_parity.py', 'scripts/package_delivery.py',
    'foco-claro/motor.py', 'foco-claro/test_motor.py', 'foco-claro/exemplo_ficticio.json',
    'foco-claro/README.md', 'foco-claro/manifesto.json',
    'skills/foco-claro-tdah-friendly/SKILL.md', 'skills/foco-claro-tdah-friendly/agents/openai.yaml',
    'skills/tdah-pesquisa-inovacao/SKILL.md', 'skills/tdah-pesquisa-inovacao/agents/openai.yaml',
    'scripts/generate_research_data.py', 'scripts/check_research.py',
    'scripts/integrate_magazine.py', 'scripts/check_integration.py',
    'integracao/baseline-diversamente-20261028.json'
]
