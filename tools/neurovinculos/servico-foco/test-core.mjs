import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import motor from '../foco-claro/motor.js';
import {buildResponseBody, normalizeResponse, responseSchema} from './core.mjs';
const config = JSON.parse(readFileSync(new URL('../foco-claro/rubricas.json', import.meta.url), 'utf8'));
const time = '2026-11-03T12:00:00.000Z';
const request = {query: 'Produto Exemplo, edição 2026', category: 'jogo', scope: 'Iniciar, pausar e retomar na edição desktop.', consent: true};
const url = 'https://example.com/manual';
function data(rating = 4.8) {
  return {title: 'Produto Exemplo — desktop 2026', scope: request.scope,
    sources: [{id: 'manual', url, title: 'Manual oficial — exemplo sintético', locator: 'Seções iniciar, pausar e sair', primary: true}],
    ratings: Object.fromEntries(config.axes.map(axis => [axis.id, {rating, evidence: `Característica documentada para ${axis.id}.`, basis: 'documentacao_primaria', source_ids: ['manual']}])),
    gates: Object.fromEntries(config.gates.map(gate => [gate, {status: 'verificado', evidence: `Condição afirmativamente documentada no escopo: ${gate}.`, source_ids: ['manual']}])), limitations: ['Fixture sintética de teste; não é avaliação real.']};
}
function provider(raw = data(), {cited = true, located = true} = {}) {
  return {status: 'completed', output: [{type: 'web_search_call', status: 'completed', action: {type: 'search', sources: located ? [{url}] : []}},
    {type: 'message', content: [{type: 'output_text', text: JSON.stringify(raw), annotations: cited ? [{type: 'url_citation', url}] : []}]}], usage: {input_tokens: 500, output_tokens: 300, total_tokens: 800}};
}
const run = (raw, options, input = request) => normalizeResponse(provider(raw, options), input, config, motor.evaluate, time);

test('request uses bounded search, strict schema and no provider storage', () => {
  const body = buildResponseBody(request, config, {model: 'gpt-5.4-mini', maxOutputTokens: 5000});
  assert.equal(body.store, false); assert.equal(body.max_tool_calls, 1); assert.equal(body.max_output_tokens, 5000);
  assert.equal(body.tools[0].search_context_size, 'low'); assert.equal(body.tool_choice, 'required');
  assert.deepEqual(body.include, ['web_search_call.action.sources']);
  assert.equal(body.text.format.type, 'json_schema'); assert.equal(body.text.format.strict, true);
  assert.equal(responseSchema(config, 'jogo').properties.ratings.required.length, 8);
  assert.ok(!Object.hasOwn(body.text.format.schema.properties, 'seal'));
});

test('PDF uses visual file input, never web search', () => {
  const input = {...request, category: 'pdf', pdf: {name: 'amostra.pdf', data_base64: 'JVBERi0xLjQ=', pages_count: 3}};
  const body = buildResponseBody(input, config, {model: 'gpt-5.4-mini'});
  assert.equal(body.tools, undefined); assert.equal(body.include, undefined);
  const file = body.input[0].content[1];
  assert.equal(file.type, 'input_file'); assert.equal(file.detail, 'low'); assert.equal(file.filename, 'amostra.pdf');
  assert.equal(file.file_data, 'data:application/pdf;base64,JVBERi0xLjQ=');
});

test('consent, category, output cap and PDF page bounds are validated before provider request', () => {
  const options = {model: 'gpt-5.4-mini'};
  assert.throws(() => buildResponseBody({...request, consent: false}, config, options), /Confirme/);
  assert.throws(() => buildResponseBody({...request, category: 'inexistente'}, config, options), /Categoria/);
  assert.throws(() => buildResponseBody(request, config, {...options, maxOutputTokens: 100000}), /saída/);
  assert.throws(() => buildResponseBody({...request, pdf: {name: 'x.pdf', data_base64: 'abc', pages_count: 100}}, config, options), /PDF inválido/);
});

test('complete attributed primary evidence is calculated by the canonical engine', () => {
  const result = run(data());
  assert.equal(result.report.score, 96); assert.equal(result.report.seal, 'OURO'); assert.equal(result.report.confidence, 'MODERADA');
  assert.equal(result.report.coverage_percent, 100); assert.equal(result.sources[0].access_status, 'citado_pelo_modelo');
  assert.equal(result.sources[0].recorded_at, time); assert.deepEqual(result.usage, {input_tokens: 500, output_tokens: 300, total_tokens: 800, web_search_calls: 1});
});

test('the exact 70 boundary never receives bronze', () => {
  const result = run(data(3.5)); assert.equal(result.report.score, 70); assert.equal(result.report.seal, 'SEM_SELO');
});

test('invented URLs cannot sustain ratings or gates', () => {
  const raw = data(); raw.sources[0].url = 'https://invented.example.org/proof';
  const result = run(raw);
  assert.equal(result.sources.length, 0); assert.equal(result.report.score, null); assert.equal(result.report.seal, null);
  assert.equal(result.report.coverage_percent, 0); assert.equal(result.report.unresolved_gates.length, 3);
});

test('located-only sources remain inference and cannot sustain verified gates', () => {
  const result = run(data(), {cited: false, located: true});
  assert.equal(result.sources[0].access_status, 'localizado_na_busca');
  assert.equal(result.report.inferred_criteria.length, 8); assert.equal(result.report.seal, null);
  assert.equal(result.report.unresolved_gates.length, 3);
});

test('secondary or explicitly inferred sources are never upgraded to primary observations', () => {
  const secondary = data(); secondary.sources[0].primary = false;
  const result = run(secondary); assert.equal(result.report.inferred_criteria.length, 8); assert.equal(result.report.seal, null);
  const inferred = data(); inferred.ratings.fluxo.basis = 'inferencia';
  const result2 = run(inferred); assert.deepEqual(result2.report.inferred_criteria, ['fluxo']); assert.equal(result2.report.seal, null);
  const claimedPlay = data(); claimedPlay.ratings.fluxo.basis = 'observacao_direta';
  assert.equal(run(claimedPlay).assessment.ratings.fluxo.basis, 'documentacao_primaria');
});

test('missing gate evidence and references leave the seal pending', () => {
  const raw = data(); raw.gates.seguranca_essencial.evidence = ''; raw.gates.autonomia_sem_coercao.source_ids = [];
  const result = run(raw); assert.equal(result.report.seal, null); assert.equal(result.report.unresolved_gates.length, 2);
  assert.equal(result.report.score, 96);
});

test('a sourced critical failure blocks a complete high score', () => {
  const raw = data(); raw.gates.seguranca_essencial.status = 'falha';
  const result = run(raw); assert.equal(result.report.seal, null); assert.equal(result.report.status, 'SEM_SELO_IMPEDIMENTO_CRITICO');
});

test('unknown source IDs and duplicate IDs cannot be silently ignored', () => {
  const raw = data(); raw.ratings.fluxo.source_ids = ['manual', 'missing'];
  assert.equal(run(raw).assessment.ratings.fluxo, null);
  const duplicate = data(); duplicate.sources.push({...duplicate.sources[0]});
  const result = run(duplicate); assert.equal(result.sources.length, 0); assert.equal(result.report.seal, null);
});

test('a PDF is tied to the explicit upload and valid referenced pages', () => {
  const input = {...request, category: 'pdf', pdf: {name: 'documento-enviado.pdf', data_base64: 'JVBERi0xLjQ=', pages_count: 3}};
  const raw = data(); raw.sources = [{id: 'arquivo', url: null, title: 'Título declarado', locator: 'páginas 1–3; texto e apresentação visual', primary: true}];
  for (const entry of Object.values(raw.ratings)) {entry.source_ids = ['arquivo']; entry.basis = 'observacao_direta';}
  for (const entry of Object.values(raw.gates)) entry.source_ids = ['arquivo'];
  const result = run(raw, {}, input); assert.equal(result.report.seal, 'OURO'); assert.equal(result.report.confidence, 'ALTA_NO_ESCOPO_OBSERVADO');
  assert.equal(result.sources[0].url, null); assert.equal(result.sources[0].title, 'documento-enviado.pdf');
  raw.sources[0].locator = 'páginas 1–4; texto e apresentação visual';
  assert.equal(run(raw, {}, input).report.coverage_percent, 0);
  raw.sources[0].locator = 'páginas 3–1; texto e apresentação visual';
  assert.equal(run(raw, {}, input).report.coverage_percent, 0);
});

test('a URL is not accepted as evidence of a private PDF upload', () => {
  const input = {...request, category: 'pdf', pdf: {name: 'x.pdf', data_base64: 'JVBERi0xLjQ=', pages_count: 2}};
  const result = run(data(), {}, input); assert.equal(result.sources.length, 0); assert.equal(result.report.seal, null);
});

test('executable, credentialed, non-HTTPS and local URLs are rejected even if cited', () => {
  for (const invalid of ['javascript:alert(1)', 'http://example.com/a', 'https://user:secret@example.com/a', 'https://127.0.0.1/a', 'https://localhost/a', 'https://host.local/a']) {
    const raw = data(); raw.sources[0].url = invalid;
    const p = provider(raw); p.output[1].content[0].annotations = [{type: 'url_citation', url: invalid}];
    assert.equal(normalizeResponse(p, request, config, motor.evaluate, time).sources.length, 0);
  }
});

test('incomplete, malformed or excessive provider results do not produce a rating', () => {
  assert.throws(() => normalizeResponse({...provider(), status: 'incomplete'}, request, config, motor.evaluate, time), /não foi concluída/);
  const malformed = provider(); malformed.output[1].content[0].text = 'not JSON';
  assert.throws(() => normalizeResponse(malformed, request, config, motor.evaluate, time), /inválida/);
  const large = provider(); large.output[1].content[0].text = 'x'.repeat(65537);
  assert.throws(() => normalizeResponse(large, request, config, motor.evaluate, time), /excessiva/);
});

test('an absent criterion stays unknown and does not become a zero or complete seal', () => {
  const raw = data(); raw.ratings.fluxo.rating = null;
  const result = run(raw); assert.equal(result.report.score, null); assert.equal(result.report.coverage_percent, 80);
  assert.equal(result.report.seal, null); assert.deepEqual(result.report.missing_criteria, ['fluxo']);
});

test('unidentified object or scope leaves the corresponding gate and evidence status aligned', () => {
  const raw = data(); raw.scope = '';
  const result = run(raw); assert.equal(result.report.seal, null);
  assert.equal(result.assessment.gates.objeto_e_escopo_identificados, 'desconhecido');
  assert.equal(result.assessment.gate_evidence.objeto_e_escopo_identificados.status, 'desconhecido');
});

test('PDF or book by name or link cannot receive a seal without page images', () => {
  for (const category of ['pdf', 'livro']) {
    for (const query of ['Obra Exemplo — edição 2026', 'https://example.com/manual.pdf']) {
      const input = {...request, category, query};
      const result = run(data(), {}, input);
      assert.equal(result.assessment.ratings.apresentacao, null);
      assert.equal(result.report.score, null);
      assert.equal(result.report.coverage_percent, 85);
      assert.equal(result.report.seal, null);
      assert.ok(result.report.missing_criteria.includes('apresentacao'));
      assert.ok(result.limitations.some(limit => limit.startsWith('Inspeção visual pendente: envie PDF autorizado')));
      const body = buildResponseBody(input, config, {model: 'gpt-5.4-mini'});
      assert.match(body.instructions, /apresentacao deve ter rating=null/);
    }
  }
});

test('file-only PDF requests are supported without a separate name', () => {
  const input = {query: '', scope: '', category: 'pdf', consent: true, pdf: {name: 'amostra.pdf', data_base64: 'JVBERi0xLjQ=', pages_count: 3}};
  const body = buildResponseBody(input, config, {model: 'gpt-5.4-mini'});
  assert.equal(JSON.parse(body.input[0].content[0].text).query, 'PDF enviado');
  assert.equal(body.input[0].content[1].type, 'input_file');
});
