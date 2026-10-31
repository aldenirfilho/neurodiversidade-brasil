"""Integrate reviewed public modules into the identified DiversaMente repository."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
from public_inventory import PUBLIC, SOURCE

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--repository', required=True, type=Path)
args = parser.parse_args()
repo = args.repository.resolve()
baseline = json.loads((ROOT / 'integracao/baseline-diversamente-20261028.json').read_text())
index = repo / 'index.html'
if hashlib.sha256(index.read_bytes()).hexdigest() != baseline['files']['index.html']:
    raise SystemExit('A revista difere da base conferida. Rever alterações antes de integrar; não sobrescrever.')
for relative in SOURCE:
    target = repo / 'tools/neurovinculos' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / relative, target)
for relative in PUBLIC + ['manifesto-publico.json']:
    target = repo / 'public/neurovinculos' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / 'dist' / relative, target)

text = index.read_text()
needle = '  <a href="#c-saude">Saúde</a>'
assert text.count(needle) == 1
text = text.replace(needle, needle + '\n  <a href="public/neurovinculos/pesquisa-tdah/index.html">Guia TDAH</a>\n  <a href="public/neurovinculos/foco-claro/PAINEL.html">Selo TDAH</a>')
marker = '  <div class="block">\n    <h2>Para começar</h2>'
assert text.count(marker) == 1
promo = '''  <!-- Integração NeuroVínculos 1.3: conteúdo anterior preservado. -->
  <div class="promo block">
    <div><h2>Guia de cuidado e pesquisa em TDAH</h2><p>Brasil, referências internacionais e como examinar estudos. Um agente e uma habilidade para transformar dúvidas em pesquisas com fontes e limites claros.</p></div>
    <a class="btn" href="#guia-pesquisa">Explorar os recursos</a>
  </div>

'''
text = text.replace(marker, promo + marker)
marker = '<section class="view" id="categoria">'
assert text.count(marker) == 1
hub = '''<article class="view art" id="guia-pesquisa" data-cat="saude" data-min="2"><div class="wrap narrow">
<p class="crumb"><a href="#inicio">Início</a> › <a href="#c-saude">Saúde</a></p>
<h1>Guia TDAH: cuidado, pesquisa e próximos passos</h1>
<p class="dek">DiversaMente e NeuroVínculos reunidos: guia Brasil/mundo, fontes oficiais e ferramentas para escolher e investigar com clareza.</p>
<p class="meta">Integração de recursos em 28/10/2026 · Datas dos demais artigos preservadas.</p>
<div class="key"><h2>Em resumo</h2><ul><li>O guia usa 12 referências oficiais e diferencia população, país e situação regulatória.</li><li>A habilidade de pesquisa separa diretrizes, estudos publicados, protocolos registrados e hipóteses.</li><li>O FOCO CLARO avalia materiais e interfaces com evidências; seu selo não certifica tratamentos.</li></ul></div>
<h2>Escolha o recurso para agora</h2>
<ul class="list"><li><a href="public/neurovinculos/pesquisa-tdah/index.html">Guia de cuidado e pesquisa em TDAH</a><span>Avaliação, apoios, acompanhamento, SUS, viagens, referências internacionais e tecnologias em saúde. Conteúdo educativo, sem doses ou prescrição pessoal.</span></li><li><a href="public/neurovinculos/pesquisa-tdah/index.html#pedido">Preparar um pedido para o agente</a><span>Use /TDAH, /PESQUISAR-TDAH, /ESTUDOS-TDAH, /GUIA-TDAH ou /INOVAR-TDAH no assistente com a habilidade do pacote. A página organiza o pedido; a IA pesquisa no assistente.</span></li><li><a href="public/neurovinculos/foco-claro/PAINEL.html">Avaliador Selo TDAH Friendly — FOCO CLARO</a><span>Produtos, sites, livros, PDFs, filmes, séries, programas, aplicativos, software e jogos. Nota editorial, afinidade pessoal e eficácia clínica permanecem diferentes.</span></li><li><a href="public/neurovinculos/index.html">Portal NeuroVínculos</a><span>Perfis, ciência, direitos e acolhimento. Base anterior de ciência e direitos:09/10/2026; guia novo:28/10/2026.</span></li></ul>
<div class="do"><h2>Faça agora</h2><p>Escolha uma dúvida e abra o recurso correspondente. Use uma pergunta geral, sem dados identificáveis de terceiros.</p></div>
<p class="src">Fontes do novo guia: <a href="public/neurovinculos/pesquisa-tdah/fontes.json">catálogo datado</a> e <a href="public/neurovinculos/pesquisa-tdah/GUIA_TDAH.md">guia com referências</a>. Os pesos do selo estão na <a href="public/neurovinculos/foco-claro/rubricas.json">rubrica FOCO CLARO</a>.</p>
<a class="back" href="#inicio">← Voltar ao início</a>
</div></article>

'''
text = text.replace(marker, hub + marker)
footer_marker = '<h2>Responsável técnico</h2>'
assert text.count(footer_marker) == 1
text = text.replace(footer_marker, '<p><a href="#guia-pesquisa">Guia e pesquisa TDAH</a> · <a href="public/neurovinculos/foco-claro/PAINEL.html">FOCO CLARO</a></p><p>Integração de recursos:28/10/2026. Datas dos demais conteúdos preservadas.</p>' + footer_marker)
index.write_text(text)

readme = repo / 'README.md'
readme.write_text(readme.read_text() + '''

## Integração DiversaMente + NeuroVínculos — 28/10/2026

Os 37 artigos editoriais e as duas ferramentas anteriores foram preservados integralmente. A revista ganhou um hub pesquisável e links no menu para o guia de cuidado/pesquisa e o avaliador FOCO CLARO. A marca DiversaMente, o roteador e os dados locais existentes foram mantidos.

- Guia: `public/neurovinculos/pesquisa-tdah/index.html` —12 referências oficiais selecionadas, infância e adultos, Brasil e referências internacionais, situação regulatória e limites das inovações.
- Avaliador: `public/neurovinculos/foco-claro/PAINEL.html` —10 tipos de conteúdo, critérios documentados, cobertura e condições essenciais; pesos anteriores preservados.
- Portal: `public/neurovinculos/index.html` — fonte em `tools/neurovinculos`.
- Nova habilidade: `tools/neurovinculos/skills/tdah-pesquisa-inovacao/SKILL.md`; agente e protocolo em `tools/neurovinculos/pesquisa-tdah`.
- Fonte e reprodução: `cd tools/neurovinculos`, `npm run check` e `npm run build`. Depois, compare `dist` com `../../public/neurovinculos`.
- Verificação da fusão: `python3 tools/neurovinculos/scripts/check_integration.py --repository .`.

Os comandos da nova habilidade são `/TDAH`, `/PESQUISAR-TDAH`, `/ESTUDOS-TDAH`, `/GUIA-TDAH` e `/INOVAR-TDAH`. A pesquisa por IA é feita no assistente; o site prepara pedidos e apresenta os guias. A presença dos arquivos não instala habilidades globalmente.

Datas: o guia novo foi consultado em 28/10/2026. Isso não revalida automaticamente as leis, finanças ou os demais artigos com datas anteriores. Registro de ensaio não demonstra eficácia; recomendação estrangeira, autorização sanitária e acesso local são verificados separadamente. O selo editorial não certifica tratamentos.

Publicação deve ser verificada separadamente do merge. O endereço Pages mencionado acima constava no README original; a conferência de 28/10/2026 encontrou HTTP404 e Pages inativo. Não afirmar implantação a partir de código salvo. Para hospedagem na raiz pelo GitHub Pages: Settings→Pages→Deploy from a branch→main→/(root).
''')
print('Magazine integration prepared; original content retained.')
