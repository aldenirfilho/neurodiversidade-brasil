import {createRequire}from'node:module';
import{mkdir,readFile,writeFile}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import{resolve}from'node:path';
const require=createRequire(import.meta.url),root=fileURLToPath(new URL('.',import.meta.url));
let esbuild;try{esbuild=require('esbuild');}catch{try{esbuild=require('../servico-foco/node_modules/esbuild');}catch{throw Error('Instale as dependências de build do serviço FOCO CLARO ou forneça esbuild neste projeto.');}}
await mkdir(resolve(root,'dist/server'),{recursive:true});
await esbuild.build({entryPoints:[resolve(root,'runtime.mjs')],outfile:resolve(root,'dist/server/index.js'),bundle:true,format:'esm',platform:'browser',target:'es2022'});
try{const manifest=JSON.parse(await readFile(resolve(root,'.openai/hosting.json'),'utf8'));await mkdir(resolve(root,'dist/.openai'),{recursive:true});await writeFile(resolve(root,'dist/.openai/hosting.json'),JSON.stringify(manifest,null,2)+'\n');}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Worker de comércio gerado com checkout desativado por padrão; sem chaves ou cobrança.');
