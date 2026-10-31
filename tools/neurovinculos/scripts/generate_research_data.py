"""Generate browser data from the reviewed research source catalog, without runtime requests."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / 'pesquisa-tdah/fontes.json').read_text())
text = json.dumps(data, ensure_ascii=False, indent=2).replace('<', '\\u003c')
(ROOT / 'pesquisa-tdah/dados.js').write_text('/* Gerado de fontes.json. Editar a fonte canônica. */\nwindow.TDAH_RESEARCH = ' + text + ';\n')
print('Generated research source catalog.')
