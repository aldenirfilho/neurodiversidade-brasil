"""Publish only explicitly selected site files; keep source and private files out."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
from public_inventory import PUBLIC

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'dist'
subprocess.run(['python3', str(ROOT / 'scripts/generate_foco_data.py')], check=True)
subprocess.run(['python3', str(ROOT / 'scripts/generate_research_data.py')], check=True)
subprocess.run(['python3', str(ROOT / 'scripts/check_research.py')], check=True)
subprocess.run(['python3', str(ROOT / 'scripts/check_site.py')], check=True)
DEST.mkdir(exist_ok=True)
expected = set(PUBLIC) | {'manifesto-publico.json'}
unexpected = [str(p.relative_to(DEST)) for p in DEST.rglob('*') if p.is_file() and str(p.relative_to(DEST)) not in expected]
if unexpected:
    raise SystemExit(f'Unexpected files in dist. Review before publishing: {unexpected}')
inventory = []
for relative in PUBLIC:
    src = ROOT / relative
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, target)
    inventory.append({'path': relative, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'bytes': target.stat().st_size})
(DEST / 'manifesto-publico.json').write_text(json.dumps({'version':json.loads((ROOT/'package.json').read_text())['version'],'content_reviewed':'2026-10-09','foco_integrated':'2026-10-10','research_guide_reviewed':json.loads((ROOT/'pesquisa-tdah/fontes.json').read_text())['reviewed'],'files':inventory}, ensure_ascii=False, indent=2) + '\n')
print(f'Built {len(inventory)} public files in {DEST}.')
