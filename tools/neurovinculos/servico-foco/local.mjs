import http from 'node:http';
import {DatabaseSync}from'node:sqlite';
import {readFileSync,mkdirSync}from'node:fs';
import {resolve}from'node:path';
import worker from './dist/server/index.js';
const root=import.meta.dirname;
mkdirSync(resolve(root,'.runtime'),{recursive:true,mode:0o700});
const sqlite=new DatabaseSync(resolve(root,'.runtime/quota.sqlite'));
sqlite.exec(readFileSync(resolve(root,'drizzle/0000_foco_quota.sql'),'utf8').replace('CREATE TABLE ','CREATE TABLE IF NOT EXISTS ').replace('CREATE INDEX ','CREATE INDEX IF NOT EXISTS '));
const DB={prepare(sql){return{bind(...args){return{async first(){return sqlite.prepare(sql).get(...args)||null;}};}};}};
const port=Number(process.env.PORT||4193);
const server=http.createServer(async(req,res)=>{
  try{
    if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403);res.end('Host não autorizado.');return;}
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2800000){res.writeHead(413);res.end('Pedido acima do limite.');return;}chunks.push(chunk);}
    const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-owner');
    const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await worker.fetch(request,{DB,OPENAI_API_KEY:process.env.OPENAI_API_KEY,FOCO_ENABLED:process.env.FOCO_ENABLED});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(503);res.end('Serviço indisponível.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/ — API ${process.env.FOCO_ENABLED==='true'&&process.env.OPENAI_API_KEY?'configurada':'desativada; sem chamadas pagas'}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{sqlite.close();process.exit(0);}));
