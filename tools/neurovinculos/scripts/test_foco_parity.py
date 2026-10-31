"""Check both implementations against the same behavioral cases."""
from pathlib import Path
import copy
import importlib.util
import json
import subprocess

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('foco_motor', ROOT/'foco-claro/motor.py')
motor=importlib.util.module_from_spec(spec)
spec.loader.exec_module(motor)
base=json.loads((ROOT/'foco-claro/exemplo_ficticio.json').read_text())
cases=[]
for category in motor.CONFIG['categories']:
    for grade in [0,3.5,3.6,4,4.1,4.5,4.6,5]:
        item=copy.deepcopy(base); item['category']=category
        for row in item['ratings'].values(): row['rating']=grade
        cases.append(item)
for kind in ['missing','inference','failed','unknown','bad-gate','extra','precision','bad-source','bad-title','bad-sample']:
    item=copy.deepcopy(base)
    if kind=='missing': del item['ratings']['fluxo']
    if kind=='inference': item['ratings']['fluxo']['basis']='inferencia'
    if kind=='failed': item['gates']['autonomia_sem_coercao']='falha'
    if kind=='unknown': item['gates']={}
    if kind=='bad-gate': item['gates']=None
    if kind=='extra': item['ratings']['dopamina']={'rating':5}
    if kind=='precision': item['ratings']['fluxo']['rating']=4.6000000009
    if kind=='bad-source': item['ratings']['fluxo']['source']={}
    if kind=='bad-title': item['title']=42
    if kind=='bad-sample': item['sample']='false'
    cases.append(item)
js='''const fs=require('fs');const api=require('./foco-claro/motor.js');const cfg=require('./foco-claro/rubricas.json');
let input=fs.readFileSync(0,'utf8');process.stdout.write(JSON.stringify(JSON.parse(input).map(d=>{try{return api.evaluate(cfg,d)}catch(e){return {error:true}}})));'''
results=json.loads(subprocess.run(['node','-e',js],cwd=ROOT,input=json.dumps(cases),capture_output=True,text=True,check=True).stdout)
for index,(item,result) in enumerate(zip(cases,results)):
    try: expected=motor.evaluate(item)
    except (ValueError,TypeError): expected={'error':True}
    fields=['error'] if 'error' in expected else ['score','seal','status','coverage_percent','missing_data_bounds','confidence','inferred_criteria']
    for field in fields:
        assert expected.get(field)==result.get(field), (index,field,expected.get(field),result.get(field))
print(f'PASS: Python/JavaScript agree on {len(cases)} shared cases, including all media and invalid inputs.')
