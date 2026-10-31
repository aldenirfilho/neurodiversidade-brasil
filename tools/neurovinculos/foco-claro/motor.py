#!/usr/bin/env python3
"""FOCO CLARO: calculate an experimental editorial score from documented ratings.

No network access, telemetry, title lookup, PDF parsing or clinical prediction.
Python 3.10+; standard library only. See README.md and SKILL.md.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
CONFIG = json.loads((HERE / 'rubricas.json').read_text(encoding='utf-8'))
D = Decimal


def number(value: Any, name: str, maximum: int = 5) -> Decimal:
    """Validate a finite number without silently accepting booleans."""
    if isinstance(value, bool) or not isinstance(value, (int, float, str, Decimal)):
        raise ValueError(f'{name}: informe um número de 0 a {maximum}.')
    try:
        result = D(str(value))
    except InvalidOperation as exc:
        raise ValueError(f'{name}: número inválido.') from exc
    if not result.is_finite() or not D(0) <= result <= D(maximum):
        raise ValueError(f'{name}: valor fora de 0–{maximum} ou não finito.')
    return result


def classification(score: Decimal | int | float | str) -> str:
    """Strict lower boundaries: 70 fails, 80 bronze, 90 silver."""
    value = number(score, 'nota', maximum=100)
    if value > 90:
        return 'OURO'
    if value > 80:
        return 'PRATA'
    if value > 70:
        return 'BRONZE'
    return 'SEM_SELO'


def rating_number(value: Any, name: str) -> Decimal:
    """Use the same 0–5, one-decimal rating contract as the browser panel.

    Classification still accepts arbitrary precision for exact boundary checks;
    component ratings do not silently round a more precise input.
    """
    result = number(value, name)
    if result != result.quantize(D('0.1')):
        raise ValueError(f'{name}: use nota de 0 a 5, com até uma casa decimal.')
    return result


def plain(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def evaluate(data: dict[str, Any]) -> dict[str, Any]:
    """Return score, missing-data bounds, confidence, and actual seal eligibility.

    A score requires explicit evidence and a source for every rated dimension.
    All dimensions must have a documented, non-inferred basis and all three
    safeguards must be verified to issue a seal. Inferences remain a triage.
    Missing data are not scored as zero or silently removed from a final grade.
    """
    if not isinstance(data, dict):
        raise ValueError('A avaliação deve ser um objeto JSON.')
    for name in ('title', 'category', 'scope'):
        if not isinstance(data.get(name), str) or not data[name].strip():
            raise ValueError(f'Campo obrigatório ausente: {name}.')
    category = data['category']
    if category not in CONFIG['categories']:
        raise ValueError('Categoria inválida. Use: ' + ', '.join(CONFIG['categories']))
    if not isinstance(data.get('ratings'), dict):
        raise ValueError('ratings deve ser um objeto de critérios.')
    if not isinstance(data.get('sample', False), bool):
        raise ValueError('sample deve ser true ou false.')
    weights = CONFIG['categories'][category]['weights']
    unknown = set(data['ratings']) - set(weights)
    if unknown:
        raise ValueError('Critérios desconhecidos: ' + ', '.join(sorted(unknown)))
    gates = data.get('gates', {})
    if not isinstance(gates, dict) or set(gates) - set(CONFIG['gates']):
        raise ValueError('Objeto gates inválido ou contém critérios desconhecidos.')
    if any(v not in ('verificado', 'falha', 'desconhecido') for v in gates.values()):
        raise ValueError('Cada trava deve ser verificado, falha ou desconhecido.')

    contribution = D(0)
    coverage = D(0)
    details: list[dict[str, Any]] = []
    bases: list[str] = []
    missing: list[str] = []
    with localcontext() as ctx:
        ctx.prec = 50
        for key, weight in weights.items():
            entry = data['ratings'].get(key)
            if entry is None or (isinstance(entry, dict) and entry.get('rating') is None):
                missing.append(key)
                details.append({'criterion': key, 'weight': weight, 'rating': None,
                                'contribution': None, 'status': 'nao_verificado'})
                continue
            if not isinstance(entry, dict):
                raise ValueError(f'{key}: cada critério deve ser um objeto.')
            value = rating_number(entry.get('rating'), key)
            for required in ('evidence', 'source'):
                if not isinstance(entry.get(required), str) or not entry[required].strip():
                    raise ValueError(f'{key}: nota sem {required}; registre a evidência ou deixe null.')
            basis = entry.get('basis')
            if basis not in CONFIG['bases']:
                raise ValueError(f'{key}: basis inválido.')
            part = D(weight) * value / 5
            contribution += part
            coverage += weight
            bases.append(basis)
            details.append({'criterion': key, 'weight': weight, 'rating': plain(value),
                            'contribution': plain(part), 'evidence': entry['evidence'],
                            'source': entry['source'], 'basis': basis})
        observed_score = contribution * 100 / coverage if coverage else None
        lower, upper = contribution, contribution + (100 - coverage)

    failed = [g for g in CONFIG['gates'] if gates.get(g) == 'falha']
    unresolved = [g for g in CONFIG['gates'] if gates.get(g, 'desconhecido') == 'desconhecido']
    inferred = [row['criterion'] for row in details if row.get('basis') == 'inferencia']
    eligible = coverage == 100 and not failed and not unresolved and not inferred
    raw_score = contribution if coverage == 100 else None
    candidate = classification(observed_score) if observed_score is not None else None
    seal = classification(raw_score) if eligible and raw_score is not None else None
    if failed:
        status = 'SEM_SELO_IMPEDIMENTO_CRITICO'
    elif not eligible:
        status = 'PENDENTE_EVIDENCIAS_OU_VERIFICACAO'
    elif seal == 'SEM_SELO':
        status = 'AVALIADO_SEM_SELO'
    else:
        status = 'SELO_EDITORIAL_EXPERIMENTAL'
    if not coverage:
        confidence = 'NAO_AVALIAVEL'
    elif 'inferencia' in bases or coverage < 100 or unresolved:
        confidence = 'BAIXA'
    elif all(b == 'observacao_direta' for b in bases):
        confidence = 'ALTA_NO_ESCOPO_OBSERVADO'
    else:
        confidence = 'MODERADA'
    return {
        'method': CONFIG['name'], 'version': CONFIG['version'],
        'title': data['title'], 'category': category, 'scope': data['scope'],
        'assessment_date': data.get('date') or date.today().isoformat(),
        'sample': data.get('sample', False),
        'status': status, 'seal': seal, 'score': plain(raw_score),
        'observed_only_score': plain(observed_score),
        'candidate_if_missing_data_confirmed': candidate,
        'coverage_percent': plain(coverage),
        'missing_data_bounds': [plain(lower), plain(upper)],
        'bounds_meaning': 'Extremos aritméticos dos critérios ausentes; não intervalo estatístico de confiança.',
        'confidence': confidence, 'missing_criteria': missing,
        'failed_gates': failed, 'unresolved_gates': unresolved,
        'inferred_criteria': inferred,
        'personal_affinity': data.get('personal_affinity', 'não avaliada'),
        'details': details,
        'notice': ('DEMONSTRAÇÃO FICTÍCIA. ' if data.get('sample') else '') +
                  'Selo editorial experimental no escopo descrito; não certifica eficácia clínica, '
                  'conformidade WCAG, segurança integral ou adequação universal ao TDAH. '
                  'Notas não medem dopamina, atenção futura ou probabilidade de sucesso.',
    }


def course_index(ratings: dict[str, Any]) -> dict[str, Any]:
    """A transparent preference/support index, never a probability of career success."""
    weights = CONFIG['course_weights']
    if not isinstance(ratings, dict) or set(ratings) - set(weights):
        raise ValueError('Critérios de curso inválidos.')
    missing = [k for k in weights if ratings.get(k) is None]
    values = {k: rating_number(v, k) for k, v in ratings.items() if v is not None}
    if missing:
        return {'compatibility_index': None, 'missing': missing,
                'success_probability': None,
                'notice': 'A preencher; não imputar dados pessoais ausentes.'}
    total = sum((D(weights[k]) * values[k] / 5 for k in weights), D(0))
    return {'compatibility_index': plain(total), 'missing': [],
            'success_probability': None,
            'notice': 'Índice heurístico de compatibilidade; não é porcentagem de chance de sucesso profissional.'}


def to_markdown(report: dict[str, Any]) -> str:
    def safe(value: Any) -> str:
        return str(value).replace('|', '\\|').replace('\n', ' ')
    title = safe(report['title'])
    score = 'pendente' if report['score'] is None else f"{report['score']:g}/100"
    out = [f'# FOCO CLARO — {title}', '', f"**Resultado:** {report['seal'] or 'SEM SELO EMITIDO'}",
           f"**Nota:** {score} | **Cobertura:** {report['coverage_percent']:g}%",
           f"**Confiança:** {report['confidence']}", f"**Escopo:** {report['scope']}",
           f"**Afinidade declarada:** {report['personal_affinity']}", '', report['notice'], '',
           '| Critério | Peso | Nota / 5 | Pontos | Evidência e fonte |',
           '|---|---:|---:|---:|---|']
    for row in report['details']:
        out.append('| ' + ' | '.join(safe(x) for x in [row['criterion'], row['weight'],
                   row.get('rating') if row.get('rating') is not None else 'não verificado',
                   row.get('contribution') if row.get('contribution') is not None else '—',
                   row.get('evidence', '') + ' ' + row.get('source', '')]) + ' |')
    if report['missing_criteria']:
        out.extend(['', '**Critérios ausentes:** ' + ', '.join(report['missing_criteria']),
                    f"**Limites aritméticos por dados ausentes:** {report['missing_data_bounds']} / 100."])
    if report['failed_gates'] or report['unresolved_gates']:
        out.extend(['', '**Travas com falha:** ' + (', '.join(report['failed_gates']) or 'nenhuma'),
                    '**Travas pendentes:** ' + (', '.join(report['unresolved_gates']) or 'nenhuma')])
    if report.get('inferred_criteria'):
        out.extend(['', '**Critérios baseados em inferência:** ' + ', '.join(report['inferred_criteria']),
                    'Triagem pendente de evidência documentada; nenhum selo emitido.'])
    return '\n'.join(out) + '\n'


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='Avaliação JSON documentada ou formulário de curso.')
    parser.add_argument('--output', type=Path, help='Arquivo JSON de resultado; padrão: saída de texto.')
    parser.add_argument('--markdown', type=Path, help='Também gerar relatório Markdown para uma avaliação.')
    parser.add_argument('--course', action='store_true', help='Calcular índice de compatibilidade de curso.')
    args = parser.parse_args(argv)
    try:
        input_path = args.input.resolve()
        for target in (args.output, args.markdown):
            if target and target.resolve() == input_path:
                raise ValueError('O arquivo de saída não pode sobrescrever a entrada.')
        if args.output and args.markdown and args.output.resolve() == args.markdown.resolve():
            raise ValueError('Use caminhos distintos para JSON e Markdown.')
        if args.course and args.markdown:
            raise ValueError('--markdown não está disponível para --course.')
        data = json.loads(args.input.read_text(encoding='utf-8'))
        report = course_index(data.get('ratings', data)) if args.course else evaluate(data)
        result = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False)
        if args.output:
            args.output.write_text(result + '\n', encoding='utf-8')
        else:
            print(result)
        if args.markdown:
            args.markdown.write_text(to_markdown(report), encoding='utf-8')
    except (OSError, ValueError, TypeError, AttributeError, json.JSONDecodeError) as exc:
        print(f'Erro: {exc}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
