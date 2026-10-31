"""Validate research provenance, date scope, portable skill links and published guide assets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import date
import json
import re
import subprocess
from public_inventory import PUBLIC

ROOT = Path(__file__).resolve().parent.parent
research = ROOT / 'pesquisa-tdah'
catalog = json.loads((research / 'fontes.json').read_text())
errors = []
sources = {s['id']: s for s in catalog['sources']}
if len(sources) != len(catalog['sources']):
    errors.append('Duplicate research source ID')
cutoff = date.fromisoformat(catalog['cutoff'])
if catalog['reviewed'] > catalog['cutoff']:
    errors.append('Review exceeds research cutoff')
for source in sources.values():
    if urlparse(source['url']).scheme != 'https':
        errors.append(f'Non-HTTPS source: {source["id"]}')
    for field in ('published', 'updated', 'checked'):
        value = source.get(field)
        if value and re.fullmatch(r'\d{4}-\d{2}-\d{2}', value) and date.fromisoformat(value) > cutoff:
            errors.append(f'Future source date: {source["id"]} {field}')
    if source.get('checked') != catalog['reviewed']:
        errors.append(f'Unmatched verification date: {source["id"]}')
for collection in ('claims', 'web_cards'):
    for item in catalog[collection]:
        if not item.get('source_ids'):
            errors.append(f'Missing provenance: {collection}/{item["id"]}')
        for ref in item.get('source_ids', []):
            if ref not in sources:
                errors.append(f'Unknown source: {ref}')

class GuideParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.assets = [], [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a' and attrs.get('href', '').startswith('#'):
            self.links.append(attrs['href'][1:])
        for key in ('src', 'href'):
            val = attrs.get(key, '')
            if val and not val.startswith(('#', 'http', 'tel:', 'mailto:')):
                self.assets.append(val.split('#')[0])
        if attrs.get('target') == '_blank' and 'noopener' not in attrs.get('rel', ''):
            errors.append('Guide new-tab link missing noopener')
doc = GuideParser()
doc.feed((research / 'index.html').read_text())
if len(doc.ids) != len(set(doc.ids)):
    errors.append('Duplicate guide HTML id')
available = set(doc.ids) | {'fonte-' + ref for ref in sources}
for link in doc.links:
    if link not in available:
        errors.append(f'Missing guide anchor {link}')
for asset in doc.assets:
    target = (research / asset).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file() or str(target.relative_to(ROOT)) not in PUBLIC:
        errors.append(f'Guide asset unavailable in publication: {asset}')
for entry in [ROOT/'skills/tdah-pesquisa-inovacao/SKILL.md', research/'AGENTE.md', research/'PROTOCOLO_PESQUISA.md']:
    for value in re.findall(r'\]\(([^)]+)\)', entry.read_text()):
        if not value.startswith(('http', '#')):
            target = (entry.parent / value.split('#')[0]).resolve()
            if not target.is_relative_to(ROOT) or not target.is_file():
                errors.append(f'Broken portable reference {entry.name}: {value}')
generated = subprocess.run(['node', '-e', "global.window={};require('./pesquisa-tdah/dados.js');process.stdout.write(JSON.stringify(window.TDAH_RESEARCH));"], cwd=ROOT, capture_output=True, check=True, text=True)
if json.loads(generated.stdout) != catalog:
    errors.append('Browser catalog differs from canonical JSON')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(sources)} research sources; dated provenance; guide assets and portable skill references.')
