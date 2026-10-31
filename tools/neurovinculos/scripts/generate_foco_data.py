"""Browser data comes from the same JSON files used by the CLI and agent."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
FOCO = ROOT / 'foco-claro'
data = {name: json.loads((FOCO / file).read_text()) for name, file in [
    ('CONFIG', 'rubricas.json'), ('COURSES', 'cursos.json'), ('PROFILE', 'perfil_preferencias.json')
]}
(FOCO / 'dados.js').write_text('window.FOCO_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
print('FOCO CLARO: dados do navegador gerados das fontes JSON.')
