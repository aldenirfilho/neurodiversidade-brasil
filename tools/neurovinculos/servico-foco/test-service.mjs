import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {PDFDocument, PDFName} from 'pdf-lib';
import {LIMITS, ServiceError, validateRequest, publicURL, reserve, quotaStatus, dayAt} from './limits.mjs';
import {handle} from './worker.mjs';

const config = JSON.parse(readFileSync(new URL('../foco-claro/rubricas.json', import.meta.url), 'utf8'));
const migration = readFileSync(new URL('./drizzle/0000_foco_quota.sql', import.meta.url), 'utf8');
const start = Date.parse('2026-11-03T15:00:00.000Z');
const input = {query: 'Exemplo sintético, edição 2026', scope: 'Iniciar e retomar, sem teste de uso real.', category: 'jogo', consent: true};
const origin = 'https://foco.example.com';

function database(path = ':memory:', initialize = true) {
  const sqlite = new DatabaseSync(path);
  if (initialize) sqlite.exec(migration);
  return {sqlite, close: () => sqlite.close(), prepare(sql) {
    return {bind(...values) {return {async first() {return sqlite.prepare(sql).get(...values) ?? null;}};}};
  }};
}
function apiRequest(body = {...input, request_id: randomUUID()}, options = {}) {
  const headers = {'content-type': 'application/json', 'oai-authenticated-user-id': 'synthetic-owner', origin, ...options.headers};
  for (const [key, value] of Object.entries(headers)) if (value === null) delete headers[key];
  const method = options.method || 'POST';
  return new Request(origin + (options.path || '/api/foco/analisar'), {method, headers,
    ...(!['GET', 'HEAD'].includes(method) ? {body: options.raw ?? JSON.stringify(body)} : {})});
}
const environment = DB => ({DB, FOCO_ENABLED: 'true', OPENAI_API_KEY: 'synthetic-key-never-used-on-network'});
const status = async (DB, when = start) => quotaStatus(DB, when);
const isUsageLimit = error => error instanceof ServiceError && error.status === 429 && error.code === 'USAGE_LIMIT';
const isBadInput = error => error instanceof ServiceError && error.status === 400;

function providerFixture(rating = 4.8) {
  const url = 'https://example.com/manual';
  const raw = {title: 'Exemplo sintético — edição 2026', scope: input.scope,
    ratings: Object.fromEntries(config.axes.map(({id}) => [id, {rating, evidence: 'Característica documentada nesta fixture sintética.', basis: 'documentacao_primaria', source_ids: ['manual']}])),
    gates: Object.fromEntries(config.gates.map(id => [id, {status: 'verificado', evidence: 'Condição afirmativamente documentada apenas nesta fixture.', source_ids: ['manual']}])),
    sources: [{id: 'manual', title: 'Manual sintético', url, locator: 'Seções iniciar, pausar e retomar', primary: true}], limitations: ['Fixture sintética, não é avaliação real.']};
  return {status: 'completed', output: [{type: 'web_search_call', status: 'completed', action: {type: 'search', sources: [{url}]}},
    {type: 'message', content: [{type: 'output_text', text: JSON.stringify(raw), annotations: [{type: 'url_citation', url}]}]}],
    usage: {input_tokens: 500, output_tokens: 300, total_tokens: 800}};
}
async function pdfPayload(pages, alter) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages; i++) pdf.addPage([300, 300]);
  if (alter) alter(pdf);
  return {name: 'nome-privado-nao-deve-ser-transmitido.pdf', data_base64: Buffer.from(await pdf.save({useObjectStreams: true})).toString('base64'), pages_count: 1};
}

test('request validation accepts only consented, bounded and identified inputs', async () => {
  assert.deepEqual(await validateRequest({...input, query: '  Nome  ', scope: '  Edição  '}, config), {...input, query: 'Nome', scope: 'Edição'});
  for (const invalid of [null, [], {...input, consent: false}, {...input, category: 'unknown'}, {...input, query: ''},
    {...input, query: 'x'.repeat(1201)}, {...input, scope: 'x'.repeat(1201)}, {...input, query: 'http://example.com'}]) {
    await assert.rejects(validateRequest(invalid, config), isBadInput);
  }
});

test('public URL policy rejects private locators, credentials and secret query parameters', () => {
  assert.equal(publicURL('https://example.com/manual#start'), 'https://example.com/manual#start');
  for (const url of ['http://example.com', 'https://user:pass@example.com', 'https://example.com:8443/a',
    'https://localhost/a', 'https://host.local/a', 'https://host.internal/a', 'https://127.0.0.1/a',
    'https://2130706433/a', 'https://[::1]/a', 'https://example.com/?api_key=private', 'https://example.com/?token=private']) {
    assert.throws(() => publicURL(url), isBadInput, url);
  }
});

test('real compressed PDF parser accepts 12 pages, rejects 13, and ignores client page claims', async () => {
  const accepted = await validateRequest({...input, category: 'pdf', pdf: await pdfPayload(12)}, config);
  assert.equal(accepted.pdf.pages_count, 12);
  assert.equal(accepted.pdf.name, 'documento.pdf');
  assert.ok(!JSON.stringify(accepted).includes('nome-privado'));
  await assert.rejects(validateRequest({...input, category: 'pdf', pdf: await pdfPayload(13)}, config), /até 12 páginas/);
  await assert.rejects(validateRequest({...input, pdf: await pdfPayload(1)}, config), /Selecione PDF/);
});

test('PDF validation rejects oversized, malformed and active files before any provider access', async () => {
  const prefix = Buffer.from('%PDF-1.7\n');
  const huge = Buffer.concat([prefix, Buffer.alloc(LIMITS.maxPdfBytes)]).toString('base64');
  for (const data_base64 of ['not-base64!', Buffer.from('not a PDF').toString('base64'), prefix.toString('base64'), huge]) {
    await assert.rejects(validateRequest({...input, category: 'pdf', pdf: {data_base64}}, config), isBadInput);
  }
  const active = await pdfPayload(1, pdf => {
    const action = pdf.context.obj({S: PDFName.of('JavaScript'), JS: pdf.context.obj('alert(1)')});
    pdf.catalog.set(PDFName.of('OpenAction'), pdf.context.register(action));
  });
  await assert.rejects(validateRequest({...input, category: 'pdf', pdf: active}, config), /código|ação/);
});

test('quota date resets at Fortaleza midnight, not UTC midnight', () => {
  assert.equal(dayAt(Date.parse('2026-11-04T02:59:59.000Z')), '2026-11-03');
  assert.equal(dayAt(Date.parse('2026-11-04T03:00:00.000Z')), '2026-11-04');
});

test('SQLite reservation is atomic for concurrent callers and enforces the three-per-day default', async () => {
  const db = database();
  try {
    const concurrent = await Promise.allSettled(Array.from({length: 10}, () => reserve(db, randomUUID(), start)));
    assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(concurrent.filter(x => x.status === 'rejected' && isUsageLimit(x.reason)).length, 9);
    await reserve(db, randomUUID(), start + LIMITS.intervalMs);
    await reserve(db, randomUUID(), start + LIMITS.intervalMs * 2);
    assert.equal(LIMITS.daily, 3);
    await assert.rejects(reserve(db, randomUUID(), start + LIMITS.intervalMs * 3), isUsageLimit);
    assert.deepEqual(await status(db), {used_today: 3, remaining_today: 0, daily_limit: 3});
  } finally {db.close();}
});

test('ten interleaved reservations cannot exceed the daily SQLite count', async () => {
  const db = database();
  try {
    const pending = Array.from({length: 10}, (_, n) => reserve(db, randomUUID(), start + n * LIMITS.intervalMs));
    const results = await Promise.allSettled(pending);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, LIMITS.daily);
    assert.equal(results.filter(result => result.status === 'rejected' && isUsageLimit(result.reason)).length, 10 - LIMITS.daily);
    assert.equal((await status(db)).used_today, LIMITS.daily);
  } finally {db.close();}
});

test('request IDs are idempotent, minute interval is enforced, and no record is refunded', async () => {
  const db = database(); const id = randomUUID();
  try {
    await reserve(db, id, start);
    await assert.rejects(reserve(db, id, start + LIMITS.intervalMs), isUsageLimit);
    await assert.rejects(reserve(db, randomUUID(), start + LIMITS.intervalMs - 1), isUsageLimit);
    assert.equal((await status(db)).used_today, 1);
    await reserve(db, randomUUID(), start + LIMITS.intervalMs);
    assert.equal((await status(db)).used_today, 2);
    await assert.rejects(reserve(db, 'not-a-uuid', start + LIMITS.intervalMs * 2), isBadInput);
    assert.equal((await status(db)).used_today, 2);
  } finally {db.close();}
});

test('real SQLite quota survives a server restart and permits a new Fortaleza day', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'foco-quota-test-')); const path = join(dir, 'quota.sqlite');
  let db = database(path);
  try {
    for (let n = 0; n < LIMITS.daily; n++) await reserve(db, randomUUID(), start + n * LIMITS.intervalMs);
    db.close(); db = database(path, false);
    assert.equal((await status(db)).remaining_today, 0);
    await assert.rejects(reserve(db, randomUUID(), start + LIMITS.intervalMs * 4), isUsageLimit);
    const tomorrow = start + 86400000;
    assert.equal((await status(db, tomorrow)).used_today, 0);
    await reserve(db, randomUUID(), tomorrow);
    assert.equal((await status(db, tomorrow)).used_today, 1);
  } finally {db.close(); rmSync(dir, {recursive: true, force: true});}
});

test('absent or broken quota database fails closed', async () => {
  const broken = {prepare() {throw Error('synthetic database failure');}};
  for (const db of [undefined, broken]) {
    await assert.rejects(quotaStatus(db, start), e => e.code === 'QUOTA_UNAVAILABLE');
    await assert.rejects(reserve(db, randomUUID(), start), e => e.code === 'QUOTA_UNAVAILABLE');
  }
});

test('auth, origin, key, database and input failures never contact the provider', async () => {
  const db = database(); let calls = 0;
  const providerFetch = async () => {calls++; throw Error('Must never be called');};
  const baseEnv = environment(db);
  const cases = [
    {request: apiRequest(undefined, {headers: {'oai-authenticated-user-id': null}}), env: baseEnv, expected: 401},
    {request: apiRequest(undefined, {headers: {origin: 'https://other.example.com'}}), env: baseEnv, expected: 403},
    {request: apiRequest(), env: {...baseEnv, OPENAI_API_KEY: ''}, expected: 503},
    {request: apiRequest(), env: {...baseEnv, DB: undefined}, expected: 503},
    {request: apiRequest(), env: {...baseEnv, DB: {prepare() {throw Error('synthetic quota failure');}}}, expected: 503},
    {request: apiRequest(), env: {...baseEnv, FOCO_ENABLED: 'false'}, expected: 503},
    {request: apiRequest({...input, consent: false, request_id: randomUUID()}), env: baseEnv, expected: 400},
    {request: apiRequest({...input, category: 'unknown', request_id: randomUUID()}), env: baseEnv, expected: 400},
    {request: apiRequest({...input, query: 'x'.repeat(1201), request_id: randomUUID()}), env: baseEnv, expected: 400},
    {request: apiRequest(undefined, {raw: 'not JSON'}), env: baseEnv, expected: 400},
    {request: apiRequest(undefined, {headers: {'content-type': 'text/plain'}}), env: baseEnv, expected: 415},
    {request: apiRequest(undefined, {raw: 'x'.repeat(LIMITS.maxBodyBytes + 1)}), env: baseEnv, expected: 413},
    {request: apiRequest({...input, request_id: 'invalid'}), env: baseEnv, expected: 400},
  ];
  try {
    for (const {request, env, expected} of cases) {
      const response = await handle(request, env, {providerFetch, now: () => start});
      assert.equal(response.status, expected, await response.clone().text());
    }
    assert.equal(calls, 0); assert.equal((await status(db)).used_today, 0);
  } finally {db.close();}
});

test('provider HTTP failure or network timeout gets exactly one call and keeps the reserved quota', async () => {
  for (const kind of ['http', 'timeout']) {
    const db = database(); let calls = 0;
    const body = {...input, request_id: randomUUID()};
    const providerFetch = async () => {
      calls++;
      if (kind === 'timeout') throw new DOMException('synthetic timeout with upstream secret', 'AbortError');
      return new Response('synthetic upstream secret', {status: 429});
    };
    try {
      const result = await handle(apiRequest(body), environment(db), {providerFetch, now: () => start});
      assert.equal(result.status, 502); const message = await result.text();
      assert.ok(!message.includes('upstream secret')); assert.ok(!message.includes(environment(db).OPENAI_API_KEY));
      assert.equal(calls, 1); assert.equal((await status(db)).used_today, 1);
      const repeated = await handle(apiRequest(body), environment(db), {providerFetch, now: () => start + LIMITS.intervalMs});
      assert.equal(repeated.status, 429); assert.equal(calls, 1); assert.equal((await status(db)).used_today, 1);
    } finally {db.close();}
  }
});

test('provider errors are safely classified without exposing raw messages or arbitrary parameters', async () => {
  const marker='synthetic-provider-secret-never-display';
  const cases=[
    {status:401,code:'invalid_api_key',expected:'API_AUTH_FAILED'},
    {status:429,code:'insufficient_quota',expected:'API_QUOTA_EXHAUSTED'},
    {status:429,code:'rate_limit_exceeded',expected:'API_RATE_LIMITED'},
    {status:429,code:marker,expected:'PROVIDER_FAILED'},
    {status:403,code:'permission_denied',expected:'API_MODEL_ACCESS'},
    {status:404,code:'model_not_found',expected:'API_MODEL_ACCESS'},
    {status:400,code:'invalid_json_schema',param:'text.format.schema',expected:'API_REQUEST_REJECTED',safeParam:true},
    {status:400,code:'unsupported_parameter',param:'tools',expected:'API_REQUEST_REJECTED',safeParam:true},
    {status:400,code:marker,param:'model;'+marker,expected:'API_REQUEST_REJECTED'},
    {status:503,code:marker,param:marker,expected:'PROVIDER_FAILED'},
  ];
  for(const item of cases) {
    const db=database();let calls=0;
    try {
      const response=await handle(apiRequest(),environment(db),{now:()=>start,providerFetch:async()=>{
        calls++;return Response.json({error:{code:item.code,param:item.param,message:marker,request_body:{key:marker}},secret:marker},{status:item.status});
      }});
      assert.equal(response.status,502);const raw=await response.text();const result=JSON.parse(raw);
      assert.equal(result.code,item.expected);assert.match(result.error,/cota foi reservada/);
      assert.equal(result.provider_http_status,item.status);assert.match(result.error,new RegExp('HTTP '+item.status));
      assert.ok(!raw.includes(marker));assert.ok(!raw.includes(environment(db).OPENAI_API_KEY));
      assert.equal(result.report,undefined);assert.equal(calls,1);assert.equal((await status(db)).used_today,1);
      if(item.safeParam)assert.ok(result.error.includes('Parâmetro: '+item.param+'.'));
      else assert.ok(!result.error.includes('Parâmetro:'));
      if(item.code==='invalid_json_schema')assert.match(result.error,/esquema JSON/);
    }finally{db.close();}
  }
});

test('connection diagnostic makes only a fixed model GET and never consumes analysis quota', async () => {
  const db=database();let calls=0;
  try {
    await reserve(db,randomUUID(),start);
    const response=await handle(apiRequest(undefined,{method:'GET',path:'/api/foco/diagnostico?url=https://attacker.example.com'}),environment(db),{
      now:()=>start,providerFetch:async(url,options)=>{
        calls++;assert.equal(url,'https://api.openai.com/v1/models/'+LIMITS.model);assert.equal(options.method,'GET');
        assert.equal(options.body,undefined);assert.ok(options.signal instanceof AbortSignal);
        assert.equal(options.headers.authorization,'Bearer '+environment(db).OPENAI_API_KEY);
        return Response.json({id:LIMITS.model,object:'model',created:1,owned_by:'synthetic-private-account'});
      }});
    assert.equal(response.status,200);const result=await response.json();
    assert.deepEqual(result,{model:LIMITS.model,provider_http_status:200,connection_ok:true,error_code:null,response_type:'json'});
    assert.equal(calls,1);assert.equal((await status(db)).used_today,1);
    assert.ok(!JSON.stringify(result).includes('synthetic-private-account'));
    assert.ok(!JSON.stringify(result).includes(environment(db).OPENAI_API_KEY));
  }finally{db.close();}
});

test('connection diagnostic preserves authentication, origin, method and secure-configuration gates', async () => {
  const db=database();let calls=0;const providerFetch=async()=>{calls++;throw Error('must not call');};
  const base={method:'GET',path:'/api/foco/diagnostico'};
  try {
    for(const {options,env,expected}of [
      {options:{...base,headers:{'oai-authenticated-user-id':null}},env:environment(db),expected:401},
      {options:{...base,headers:{origin:'https://other.example.com'}},env:environment(db),expected:403},
      {options:base,env:{...environment(db),OPENAI_API_KEY:''},expected:503},
      {options:base,env:{...environment(db),FOCO_ENABLED:'false'},expected:503},
      {options:base,env:{...environment(db),DB:undefined},expected:503},
      {options:{...base,method:'POST'},env:environment(db),expected:404},
    ]){
      const response=await handle(apiRequest(undefined,options),env,{providerFetch,now:()=>start});
      assert.equal(response.status,expected);assert.ok(!(await response.text()).includes(environment(db).OPENAI_API_KEY));
    }
    assert.equal(calls,0);assert.equal((await status(db)).used_today,0);
  }finally{db.close();}
});

test('connection diagnostic returns only bounded redacted infrastructure metadata', async () => {
  const marker='synthetic-diagnostic-secret-never-display';
  const cases=[
    {status:401,body:JSON.stringify({error:{code:'invalid_api_key',message:marker},secret:marker}),type:'application/json',code:'invalid_api_key',kind:'json'},
    {status:429,body:JSON.stringify({error:{code:marker,message:marker}}),type:'application/json',code:'UNCLASSIFIED',kind:'json'},
    {status:403,body:'<html>'+marker+'</html>',type:'text/html',code:'UNCLASSIFIED',kind:'html'},
    {status:503,body:marker,type:'text/plain',code:'UNCLASSIFIED',kind:'other'},
    {status:200,body:JSON.stringify({id:'other-model',secret:marker}),type:'application/json',code:'UNCLASSIFIED',kind:'json'},
    {status:401,body:JSON.stringify({error:{code:'invalid_api_key',message:marker.repeat(1000)}}),type:'application/json',code:'UNCLASSIFIED',kind:'json'},
  ];
  for(const item of cases){
    const db=database();let calls=0;
    try {
      const response=await handle(apiRequest(undefined,{method:'GET',path:'/api/foco/diagnostico'}),environment(db),{
        now:()=>start,providerFetch:async()=>{calls++;return new Response(item.body,{status:item.status,headers:{'content-type':item.type}});}});
      assert.equal(response.status,502);const text=await response.text();const result=JSON.parse(text);
      assert.deepEqual(Object.keys(result),['model','provider_http_status','connection_ok','error_code','response_type']);
      assert.equal(result.provider_http_status,item.status);assert.equal(result.connection_ok,false);
      assert.equal(result.error_code,item.code);assert.equal(result.response_type,item.kind);
      assert.ok(!text.includes(marker));assert.ok(!text.includes(environment(db).OPENAI_API_KEY));
      assert.equal(calls,1);assert.equal((await status(db)).used_today,0);
    }finally{db.close();}
  }
});

test('connection diagnostic transport failures expose no error details and keep the analysis quota', async () => {
  const db=database();let calls=0;
  try {
    const response=await handle(apiRequest(undefined,{method:'GET',path:'/api/foco/diagnostico'}),environment(db),{
      now:()=>start,providerFetch:async()=>{calls++;throw new DOMException('synthetic-transport-secret','AbortError');}});
    assert.equal(response.status,502);const text=await response.text();const result=JSON.parse(text);
    assert.deepEqual(result,{model:LIMITS.model,provider_http_status:null,connection_ok:false,error_code:'UNCLASSIFIED',response_type:'other'});
    assert.ok(!text.includes('synthetic-transport-secret'));assert.equal(calls,1);assert.equal((await status(db)).used_today,0);
  }finally{db.close();}
});

test('provider error bodies are bounded at 16 KB and non-JSON errors remain safely classified', async () => {
  for(const [code,body,statusCode,expected] of [
    ['oversized',JSON.stringify({error:{code:'insufficient_quota',message:'sensitive-marker'.repeat(2000)}}),429,'PROVIDER_FAILED'],
    ['non-json','<html>synthetic-sensitive-marker</html>',503,'PROVIDER_FAILED'],
  ]) {
    const db=database();let calls=0;
    try {
      const response=await handle(apiRequest(),environment(db),{now:()=>start,providerFetch:async()=>{
        calls++;return new Response(body,{status:statusCode});
      }});
      assert.equal(response.status,502);const result=await response.json();
      assert.equal(result.code,expected,code);assert.ok(!JSON.stringify(result).includes('sensitive-marker'));
      assert.equal(calls,1);assert.equal((await status(db)).used_today,1);
    }finally{db.close();}
  }
});

test('completed fixture produces a deterministic report, visible sources and current remaining quota', async () => {
  const db = database(); let calls = 0; let sent;
  try {
    const response = await handle(apiRequest(), environment(db), {now: () => start, providerFetch: async (url, options) => {
      calls++; assert.equal(url, 'https://api.openai.com/v1/responses'); sent = JSON.parse(options.body);
      assert.equal(options.method, 'POST'); assert.ok(options.signal instanceof AbortSignal);
      return Response.json(providerFixture());
    }});
    assert.equal(response.status, 200); const result = await response.json();
    assert.equal(calls, 1); assert.equal(sent.model, LIMITS.model); assert.equal(sent.max_output_tokens, LIMITS.maxOutputTokens);
    assert.equal(sent.max_tool_calls, 1); assert.equal(sent.store, false);
    assert.equal(result.report.score, 96); assert.equal(result.report.seal, 'OURO');
    assert.equal(result.sources[0].url, 'https://example.com/manual');
    assert.equal(result.quota.remaining_today, LIMITS.daily - 1);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(!JSON.stringify(result).includes(environment(db).OPENAI_API_KEY));
  } finally {db.close();}
});

test('malformed or incomplete provider evidence consumes one reservation without emitting any seal', async () => {
  for (const fixture of [{status: 'incomplete', output: []}, {status: 'completed', output: []}]) {
    const db = database(); let calls = 0;
    try {
      const response = await handle(apiRequest(), environment(db), {now: () => start, providerFetch: async () => {calls++; return Response.json(fixture);}});
      assert.equal(response.status, 502); const result = await response.json();
      assert.equal(result.code, 'INVALID_EVIDENCE'); assert.equal(result.report, undefined); assert.equal(result.seal, undefined);
      assert.equal(calls, 1); assert.equal((await status(db)).used_today, 1);
    } finally {db.close();}
  }
});

test('oversized upstream body is rejected after one call without a report or raw provider output', async () => {
  const db = database(); let calls = 0;
  try {
    const response = await handle(apiRequest(), environment(db), {now: () => start, providerFetch: async () => {
      calls++;
      return new Response(JSON.stringify({status: 'completed', secret: 'synthetic-upstream-marker', output: 'x'.repeat(600000)}),
        {status: 200, headers: {'content-type': 'application/json'}});
    }});
    assert.equal(response.status, 502); const body = await response.text();
    assert.ok(!body.includes('synthetic-upstream-marker')); assert.ok(!body.includes('"report"'));
    assert.equal(calls, 1); assert.equal((await status(db)).used_today, 1);
  } finally {db.close();}
});

test('status uses real persisted quota and disabled state without any provider call', async () => {
  const db = database(); let calls = 0;
  try {
    await reserve(db, randomUUID(), start);
    const response = await handle(apiRequest(undefined, {method: 'GET', path: '/api/foco/status'}), {...environment(db), OPENAI_API_KEY: ''},
      {now: () => start, providerFetch: async () => {calls++; throw Error('must not call');}});
    assert.equal(response.status, 200); const result = await response.json();
    assert.equal(result.enabled, false); assert.equal(result.used_today, 1); assert.equal(result.remaining_today, 2);
    assert.equal(result.daily_limit, 3); assert.equal(result.max_pdf_pages, 12); assert.equal(calls, 0);
  } finally {db.close();}
});

test('private frontend assets are available with protective headers and same-origin configuration', async () => {
  const root = await handle(new Request(origin + '/'), {});
  assert.equal(root.status,302); assert.equal(root.headers.get('location'),'/foco-claro/automatico.html');
  const page = await handle(new Request(origin + '/foco-claro/automatico.html'), {});
  assert.equal(page.status, 200); assert.match(page.headers.get('content-type'), /text\/html/);
  assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
  const configResponse = await handle(new Request(origin + '/foco-claro/servico-config.js'), {});
  assert.equal(configResponse.status, 200); assert.match(await configResponse.text(), /enabled:true/);
  const missing = await handle(new Request(origin + '/.env.local'), {}); assert.equal(missing.status, 404);
});
