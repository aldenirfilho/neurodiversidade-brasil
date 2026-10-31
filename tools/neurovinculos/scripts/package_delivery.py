"""Create a portable archive from reviewed sources and public files only."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
from public_inventory import SOURCE

ROOT=Path(__file__).resolve().parent.parent
version=json.loads((ROOT/'package.json').read_text())['version']
archive=ROOT/f'NeuroVinculos_TDAH_v{version}_COMPLETO.zip'
if archive.exists(): raise SystemExit('Arquivo já existe. Preservar ou escolher nova versão antes de empacotar.')
from public_inventory import PUBLIC
expected=set(PUBLIC)|{'manifesto-publico.json'}
actual={str(p.relative_to(ROOT/'dist')) for p in (ROOT/'dist').rglob('*') if p.is_file()}
if actual != expected: raise SystemExit('Inventário público divergente. Conferir build antes de empacotar.')
manifest=json.loads((ROOT/'dist/manifesto-publico.json').read_text())
for row in manifest['files']:
    if hashlib.sha256((ROOT/'dist'/row['path']).read_bytes()).hexdigest()!=row['sha256']:
        raise SystemExit('Hash público divergente: '+row['path'])
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    for relative in SOURCE:
        z.write(ROOT/relative,'fonte/'+relative)
    for relative in sorted(expected): z.write(ROOT/'dist'/relative,'site/'+relative)
with ZipFile(archive) as z:
    assert not any('SCMS' in name or name.startswith(('backups/','.qa/')) or '._' in name for name in z.namelist())
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},ensure_ascii=False))
