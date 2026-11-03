"""Explicit inventories: unrelated/private documents never enter either package."""
PUBLIC = [
    'index.html', 'styles.css', 'app.js', 'content.js',
    'foco-app/index.html', 'foco-app/app.css', 'foco-app/app.js', 'foco-app/model.js',
    'foco-app/sw.js', 'foco-app/manifest.webmanifest', 'foco-app/icon.svg', 'foco-app/catalogo.json',
    'assets/simbolo.svg', 'assets/pertencer.svg', 'FONTES.md', 'README.md', '.nojekyll',
    'foco-claro/automatico.html', 'foco-claro/automatico.css', 'foco-claro/automatico.js', 'foco-claro/servico-config.js',
    'foco-claro/PAINEL.html', 'foco-claro/painel.js', 'foco-claro/motor.js', 'foco-claro/dados.js',
    'foco-claro/rubricas.json', 'foco-claro/cursos.json', 'foco-claro/fontes.json',
    'foco-claro/perfil_preferencias.json', 'foco-claro/avaliacao_em_branco.json',
    'foco-claro/AGENTE.md', 'foco-claro/SKILL.md', 'foco-claro/CURSOS.md', 'foco-claro/INTEGRACAO.md',
    'pesquisa-tdah/index.html', 'pesquisa-tdah/guia.css', 'pesquisa-tdah/guia.js',
    'pesquisa-tdah/dados.js', 'pesquisa-tdah/fontes.json', 'pesquisa-tdah/GUIA_TDAH.md',
    'pesquisa-tdah/AGENTE.md', 'pesquisa-tdah/PROTOCOLO_PESQUISA.md'
]
SOURCE = PUBLIC + [
    'AGENTS.md', 'package.json', '.gitignore', 'foco-app/README.md', 'foco-app/test-model.cjs', 'foco-app/PLANO_COMERCIAL.md',
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
SOURCE += [
    'servico-foco/.gitignore', 'servico-foco/README.md',
    'servico-foco/package.json', 'servico-foco/package-lock.json',
    'servico-foco/core.mjs', 'servico-foco/limits.mjs', 'servico-foco/worker.mjs',
    'servico-foco/build.mjs', 'servico-foco/local.mjs',
    'servico-foco/test-core.mjs', 'servico-foco/test-service.mjs',
    'servico-foco/drizzle/0000_foco_quota.sql', 'servico-foco/drizzle/meta/_journal.json'
]

SOURCE += [
 'comercio-foco/.gitignore','comercio-foco/README.md','comercio-foco/package.json',
 'comercio-foco/core.mjs','comercio-foco/worker.mjs','comercio-foco/runtime.mjs',
 'comercio-foco/d1-repository.mjs','comercio-foco/build.mjs','comercio-foco/local-sandbox.mjs',
 'comercio-foco/test-core.mjs','comercio-foco/test-d1.mjs','comercio-foco/test-runtime.mjs','comercio-foco/test-sandbox.mjs',
 'comercio-foco/drizzle/0000_comercio_foco.sql','comercio-foco/drizzle/meta/_journal.json'
]
