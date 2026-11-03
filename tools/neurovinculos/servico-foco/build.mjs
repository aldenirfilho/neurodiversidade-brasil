import {readFile,writeFile,mkdir,copyFile}from'node:fs/promises';
import {fileURLToPath}from'node:url';
import {resolve}from'node:path';
import {build}from'esbuild';
const root=fileURLToPath(new URL('.',import.meta.url));
const paths=['automatico.html','automatico.js','automatico.css','servico-config.js'];
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
const assets={};for(const p of paths)assets['/foco-claro/'+p]={type:types[p.split('.').at(-1)],body:await readFile(resolve(root,'../foco-claro',p),'utf8')};
// On the private service, the manual route returns to the real public manual panel.
assets['/foco-claro/automatico.html'].body=assets['/foco-claro/automatico.html'].body.replaceAll('href="PAINEL.html"','href="https://aldenirfilho.github.io/neurodiversidade-brasil/public/neurovinculos/foco-claro/PAINEL.html"');
for(const path of ['../index.html#selo','../index.html','SKILL.md','fontes.json']) {
  const url=new URL(path,'https://aldenirfilho.github.io/neurodiversidade-brasil/public/neurovinculos/foco-claro/automatico.html');
  assets['/foco-claro/automatico.html'].body=assets['/foco-claro/automatico.html'].body.replaceAll('href="'+path+'"','href="'+url.href+'"');
}
await writeFile(resolve(root,'generated-assets.mjs'),'export const ASSETS='+JSON.stringify(assets)+';\n');
await mkdir(resolve(root,'dist/server'),{recursive:true});
await build({entryPoints:[resolve(root,'worker.mjs')],outfile:resolve(root,'dist/server/index.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:false});
try{const manifest=JSON.parse(await readFile(resolve(root,'.openai/hosting.json'),'utf8'));await mkdir(resolve(root,'dist/.openai'),{recursive:true});await writeFile(resolve(root,'dist/.openai/hosting.json'),JSON.stringify(manifest,null,2)+'\n');}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Worker gerado; nenhum segredo ou arquivo enviado faz parte do pacote.');
