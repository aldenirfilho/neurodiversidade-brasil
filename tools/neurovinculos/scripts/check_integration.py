"""Check that fusion retains original articles/scripts and exactly mirrors public assets."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from public_inventory import PUBLIC, SOURCE

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--repository', required=True, type=Path)
repo = parser.parse_args().repository.resolve()
baseline = json.loads((ROOT / 'integracao/baseline-diversamente-20261028.json').read_text())
text = (repo / 'index.html').read_text()
errors = []
for aid, expected in baseline['articles'].items():
    match = re.search(r'<article\b[^>]*\bid="' + re.escape(aid) + r'"[\s\S]*?</article>', text)
    if not match or hashlib.sha256(match.group().encode()).hexdigest() != expected:
        errors.append('Original article changed or missing: ' + aid)
scripts = re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', text)
if [hashlib.sha256(s.encode()).hexdigest() for s in scripts] != baseline['inline_scripts']:
    errors.append('Original magazine JavaScript changed')
for file in ['.nojekyll', 'og-image.png']:
    if hashlib.sha256((repo / file).read_bytes()).hexdigest() != baseline['files'][file]:
        errors.append('Original asset changed: ' + file)

class MagazineParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.hashes, self.files = [], [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a':
            url = a.get('href', '')
            if url.startswith('#'):
                self.hashes.append(url[1:])
            elif url and not url.startswith(('http', 'tel:', 'mailto:')):
                self.files.append(url.split('#')[0])
doc = MagazineParser()
doc.feed(text)
if len(doc.ids) != len(set(doc.ids)):
    errors.append('Duplicate magazine HTML ID')
cats = {'c-' + s for s in ('entenda','forcas','travas','rotina','vinculos','saude','direitos','fe','ferramentas')}
for anchor in doc.hashes:
    if anchor and anchor not in set(doc.ids) | cats:
        errors.append('Broken magazine anchor: ' + anchor)
for file in doc.files:
    if not (repo / file).is_file():
        errors.append('Broken magazine local link: ' + file)
expected = set(PUBLIC) | {'manifesto-publico.json'}
public = repo / 'public/neurovinculos'
actual = {str(p.relative_to(public)) for p in public.rglob('*') if p.is_file()}
if expected != actual:
    errors.append('Unexpected or missing public module files')
for file in expected:
    if (ROOT/'dist'/file).read_bytes() != (public/file).read_bytes():
        errors.append('Public mirror mismatch: ' + file)
module = repo / 'tools/neurovinculos'
for file in SOURCE:
    if (ROOT / file).read_bytes() != (module / file).read_bytes():
        errors.append('Source mirror mismatch: ' + file)
with tempfile.TemporaryDirectory() as tmp:
    for i, script in enumerate(scripts):
        path = Path(tmp) / f'magazine-{i}.js'
        path.write_text(script)
        result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
        if result.returncode:
            errors.append(result.stderr)
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(baseline["articles"])} original articles, scripts and assets unchanged; links valid; {len(expected)} public files mirrored.')
