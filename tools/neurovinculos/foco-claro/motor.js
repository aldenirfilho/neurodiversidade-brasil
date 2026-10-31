'use strict';
// Same rubric as motor.py. Integer tenths keep boundary checks exact.
(function (root) {
  function rating(value, key) {
    if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) {
      throw Error(key + ': informe nota de 0 a 5.');
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 5 || n !== Math.round(n * 10) / 10) {
      throw Error(key + ': use nota de 0 a 5, com até uma casa decimal.');
    }
    return Math.round(n * 10);
  }
  function classification(numerator, denominator = 1) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0 || numerator < 0 || numerator > 100 * denominator) throw Error('Nota inválida.');
    return numerator > 90 * denominator ? 'OURO' : numerator > 80 * denominator ? 'PRATA' : numerator > 70 * denominator ? 'BRONZE' : 'SEM_SELO';
  }
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function validateInput(config, data, allowBlank = false) {
    if (!object(data)) throw Error('A avaliação deve ser um objeto JSON.');
    for (const key of ['title', 'scope']) {
      if (typeof data[key] !== 'string' || (!allowBlank && !data[key].trim())) throw Error('Preencha nome e escopo antes de calcular.');
    }
    if (typeof data.category !== 'string' || !Object.hasOwn(config.categories, data.category)) throw Error('Categoria inválida.');
    if (!object(data.ratings)) throw Error('Estrutura de critérios inválida.');
    if (data.sample !== undefined && typeof data.sample !== 'boolean') throw Error('sample deve ser true ou false.');
    const weights = config.categories[data.category].weights;
    for (const [key, entry] of Object.entries(data.ratings)) {
      if (!Object.hasOwn(weights, key)) throw Error('Critério desconhecido: ' + key);
      if (entry === null) continue;
      if (!object(entry)) throw Error(key + ': cada critério deve ser um objeto.');
      if (entry.rating === null || entry.rating === undefined) continue;
      rating(entry.rating, key);
      for (const field of ['evidence', 'source']) {
        if (typeof entry[field] !== 'string' || !entry[field].trim()) throw Error(key + ': nota sem ' + field + '.');
      }
      if (!config.bases.includes(entry.basis)) throw Error(key + ': base inválida.');
    }
    const gates = data.gates === undefined ? {} : data.gates;
    if (!object(gates)) throw Error('Condições essenciais inválidas.');
    for (const [key, value] of Object.entries(gates)) {
      if (!config.gates.includes(key) || !['verificado', 'falha', 'desconhecido'].includes(value)) throw Error('Condição essencial inválida: ' + key);
    }
    return data;
  }
  function evaluate(config, data) {
    validateInput(config, data);
    const weights = config.categories[data.category].weights;
    let total = 0, coverage = 0;
    const details = [], missing = [], inferred = [], bases = [];
    for (const [key, weight] of Object.entries(weights)) {
      const entry = data.ratings[key];
      if (!entry || entry.rating === null || entry.rating === undefined) {
        missing.push(key); details.push({criterion:key, weight, rating:null, contribution:null, status:'nao_verificado'}); continue;
      }
      const units = rating(entry.rating, key);
      total += weight * units; coverage += weight; bases.push(entry.basis);
      if (entry.basis === 'inferencia') inferred.push(key);
      details.push({criterion:key, weight, rating:units / 10, contribution:weight * units / 50, evidence:entry.evidence, source:entry.source, basis:entry.basis});
    }
    const failed = config.gates.filter(g => data.gates?.[g] === 'falha');
    const unresolved = config.gates.filter(g => !data.gates?.[g] || data.gates[g] === 'desconhecido');
    const eligible = coverage === 100 && !failed.length && !unresolved.length && !inferred.length;
    const seal = eligible ? classification(total, 50) : null;
    const status = failed.length ? 'SEM_SELO_IMPEDIMENTO_CRITICO' : !eligible ? 'PENDENTE_EVIDENCIAS_OU_VERIFICACAO' : seal === 'SEM_SELO' ? 'AVALIADO_SEM_SELO' : 'SELO_EDITORIAL_EXPERIMENTAL';
    const confidence = !coverage ? 'NAO_AVALIAVEL' : inferred.length || coverage < 100 || unresolved.length ? 'BAIXA' : bases.every(b => b === 'observacao_direta') ? 'ALTA_NO_ESCOPO_OBSERVADO' : 'MODERADA';
    return {
      method:config.name, version:config.version, title:data.title, category:data.category, scope:data.scope,
      assessment_date:data.date || new Date().toISOString().slice(0, 10), sample:data.sample ?? false,
      status, seal, score:coverage === 100 ? total / 50 : null,
      observed_only_score:coverage ? total * 2 / coverage : null,
      candidate_if_missing_data_confirmed:coverage ? classification(total * 2, coverage) : null,
      coverage_percent:coverage, missing_data_bounds:[total / 50, (total + (100 - coverage) * 50) / 50],
      bounds_meaning:'Extremos aritméticos dos critérios ausentes; não intervalo estatístico de confiança.',
      confidence, missing_criteria:missing, inferred_criteria:inferred, failed_gates:failed, unresolved_gates:unresolved,
      personal_affinity:data.personal_affinity || 'não avaliada', details,
      notice:(data.sample ? 'DEMONSTRAÇÃO FICTÍCIA. ' : '') + 'Selo editorial experimental no escopo descrito; não certifica eficácia clínica, conformidade WCAG, segurança integral ou adequação universal ao TDAH. Notas não medem dopamina, atenção futura ou probabilidade de sucesso.'
    };
  }
  function courseIndex(config, ratings) {
    if (!object(ratings) || Object.keys(ratings).some(k => !Object.hasOwn(config.course_weights, k))) throw Error('Critérios de curso inválidos.');
    const missing = [], units = {};
    for (const key of Object.keys(config.course_weights)) {
      if (ratings[key] === null || ratings[key] === undefined || ratings[key] === '') missing.push(key);
      else units[key] = rating(ratings[key], key);
    }
    return {compatibility_index:missing.length ? null : Object.entries(config.course_weights).reduce((sum,[key,weight]) => sum + weight * units[key],0) / 50,
      missing, success_probability:null, notice:'Índice heurístico de compatibilidade; não é chance de sucesso profissional.'};
  }
  const api = {rating, classification, validateInput, evaluate, courseIndex};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FocoMotor = api;
})(typeof window === 'undefined' ? globalThis : window);
