"""Check references, publication inventory and basic document integrity. No network."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re
import subprocess
from public_inventory import PUBLIC

ROOT = Path(__file__).resolve().parent.parent
node = subprocess.run(['node', '-e', "global.window={};require('./content.js');process.stdout.write(JSON.stringify(window.NV_CONTENT));"], cwd=ROOT, check=True, capture_output=True, text=True)
data = json.loads(node.stdout)
errors = []
sources = {s['id']: s for s in data['sources']}
if len(sources) != len(data['sources']):
    errors.append('Duplicate source id')
if len({s['n'] for s in data['sources']}) != len(sources):
    errors.append('Duplicate citation number')
for collection in ['profiles', 'science', 'laws']:
    for item in data[collection]:
        refs = item.get('sources', [item['source']] if 'source' in item else [])
        for ref in refs:
            if ref not in sources:
                errors.append(f'Missing source {ref} in {collection}')
        if item.get('proposal') and 'NÃO É LEI' not in item['status']:
            errors.append(f'Unlabelled proposal {item["id"]}')
for source in sources.values():
    if not source['url'].startswith('https://'):
        errors.append(f'Invalid source URL {source["id"]}')

class DocumentCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.anchors = []
        self.files = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'img' and 'alt' not in a:
            errors.append('Image missing alt')
        if tag == 'a' and a.get('href', '').startswith('#'):
            self.anchors.append(a['href'][1:])
        if a.get('target') == '_blank' and 'noopener' not in a.get('rel', ''):
            errors.append('External new tab missing noopener')
        for key in ['src', 'href']:
            value = a.get(key, '')
            if value and not value.startswith(('#', 'http', 'tel:', 'mailto:')):
                self.files.append(value)

doc = DocumentCheck()
html = (ROOT / 'index.html').read_text()
doc.feed(html)
if len(doc.ids) != len(set(doc.ids)):
    errors.append('Duplicate HTML id')
available = set(doc.ids) | {f'fonte-{ref}' for ref in sources}
for target in doc.anchors:
    if target not in available:
        errors.append(f'Missing anchor {target}')
for file in doc.files:
    if not (ROOT / file.split('#')[0]).is_file():
        errors.append(f'Missing local asset {file}')
    elif file.split('#')[0] not in PUBLIC:
        errors.append(f'Local asset excluded from public inventory {file}')
if '<html lang="pt-BR">' not in html:
    errors.append('Language not set')
for path in PUBLIC:
    if not (ROOT / path).is_file():
        errors.append(f'Missing public file {path}')
        continue
    text = (ROOT / path).read_text()
    for sensitive in ['16587', '11846', '62032110', 'Raimunda Lopes', 'Venvanse 70', 'token ghp_', 'github_pat_']:
        if sensitive in text:
            errors.append(f'Unexpected personal or credential string in {path}')
    if path.endswith(('.js','.html')) and re.search(r'\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage)\b', text):
        errors.append(f'Unexpected collection or persistence API in {path}')
panel = DocumentCheck()
panel.feed((ROOT / 'foco-claro/PAINEL.html').read_text())
if len(panel.ids) != len(set(panel.ids)):
    errors.append('Duplicate panel id')
for file in panel.files:
    target = (ROOT / 'foco-claro' / file.split('#')[0]).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file():
        errors.append(f'Missing panel asset {file}')
    elif str(target.relative_to(ROOT)) not in PUBLIC:
        errors.append(f'Panel asset excluded from public inventory {file}')
config=json.loads((ROOT/'foco-claro/rubricas.json').read_text())
for category, spec in config['categories'].items():
    if sum(spec['weights'].values()) != 100:
        errors.append(f'Invalid weights {category}')
courses=json.loads((ROOT/'foco-claro/cursos.json').read_text())
if any(item.get('probabilidade_sucesso_profissional') is not None for item in courses['courses']):
    errors.append('Unexpected invented professional success probability')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(sources)} sources; {len(data["profiles"])} profiles; {len(data["science"])} evidence topics; {len(data["laws"])} legal cards; valid internal references and assets; no collection APIs.')
