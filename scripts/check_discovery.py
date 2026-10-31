"""Validate discoverable URLs and the publication/share surface without a network."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://aldenirfilho.github.io/neurodiversidade-brasil/'
EXPECTED = {'': 'index.html', 'public/neurovinculos/index.html': 'public/neurovinculos/index.html', 'public/neurovinculos/pesquisa-tdah/index.html': 'public/neurovinculos/pesquisa-tdah/index.html', 'public/neurovinculos/foco-claro/PAINEL.html': 'public/neurovinculos/foco-claro/PAINEL.html', 'divulgue/': 'divulgue/index.html'}

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.meta={}; self.canonical=[]; self.ids=[]; self.local=[]; self.labels=set(); self.field_ids=set(); self.external=[]
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='meta':
            key=a.get('property',a.get('name'))
            if key:
                assert key not in self.meta, f'Duplicate metadata: {key}'
                self.meta[key]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href'))
        if tag=='label': self.labels.add(a.get('for'))
        if tag in {'input','textarea','select'}: self.field_ids.add(a.get('id'))
        for key in ('href','src'):
            if a.get(key):
                value=a[key]
                if value.startswith(('https:','http:')): self.external.append(value)
                elif not value.startswith(('data:','tel:','mailto:','#','//')): self.local.append(value)

sitemap=ET.parse(ROOT/'sitemap.xml')
urls=[node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==len(set(urls))==len(EXPECTED), 'Sitemap URLs duplicated/missing'
assert set(urls)=={BASE+u for u in EXPECTED}
for suffix, relative in EXPECTED.items():
    path=ROOT/relative
    page=Page(path.read_text())
    assert page.canonical==[BASE+suffix], (relative, 'canonical')
    for key in ('og:title','og:type','og:url','og:image','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image'):
        assert page.meta.get(key), (relative,key)
    assert page.meta['og:url']==BASE+suffix
    assert page.meta['og:image']==BASE+'og-image.png'
    assert page.meta['twitter:image']==BASE+'og-image.png'
    assert not urlsplit(BASE+suffix).fragment
share=Page((ROOT/'divulgue/index.html').read_text())
assert len(share.ids)==len(set(share.ids)), 'Duplicate sharing IDs'
assert share.field_ids <= share.labels, 'Missing sharing field labels'
for ref in share.local:
    path=(ROOT/'divulgue'/unquote(urlsplit(ref).path)).resolve()
    assert path.is_relative_to(ROOT) and path.is_file(), f'Missing sharing asset: {ref}'
text=(ROOT/'divulgue/index.html').read_text()
assert 'role="status"' in text and 'aria-live="polite"' in text
assert 'divulgue/index.html' in (ROOT/'index.html').read_text()
assert (ROOT/'og-image.png').is_file()
print('PASS: 5 sitemap/canonical/social-metadata pages; unique IDs, labels and sharing links/assets valid.')
