"""Tests validate calculations and safeguards, not clinical validity."""
import copy
import json
import unittest
from decimal import Decimal
from pathlib import Path
from motor import CONFIG, classification, course_index, evaluate, main, to_markdown

BASE = json.loads((Path(__file__).resolve().parent / 'exemplo_ficticio.json').read_text(encoding='utf-8'))

class MotorTests(unittest.TestCase):
    def test_boundaries(self):
        for score, expected in [('0','SEM_SELO'),('70','SEM_SELO'),('70.00001','BRONZE'),
                                ('80','BRONZE'),('80.00001','PRATA'),('90','PRATA'),
                                ('90.00001','OURO'),('100','OURO')]:
            with self.subTest(score=score):
                self.assertEqual(classification(score), expected)

    def test_invalid_numbers(self):
        for score in [-1,101,float('nan'),float('inf'),True,None,{},'abc']:
            with self.subTest(score=score), self.assertRaises(ValueError):
                classification(score)

    def test_weights(self):
        for spec in CONFIG['categories'].values():
            self.assertEqual(sum(spec['weights'].values()),100)
        self.assertEqual(sum(CONFIG['course_weights'].values()),100)

    def test_complete_fictional(self):
        result = evaluate(BASE)
        self.assertEqual(result['score'],92)
        self.assertEqual(result['seal'],'OURO')
        self.assertTrue(result['sample'])
        self.assertEqual(result['coverage_percent'],100)

    def test_all_categories(self):
        for category in CONFIG['categories']:
            obj=copy.deepcopy(BASE); obj['category']=category
            with self.subTest(category=category):
                self.assertEqual(evaluate(obj)['score'],92)

    def test_category_weights_apply_to_documented_zero_ratings(self):
        expected={'jogo':35,'livro':25,'pdf':25,'filme':35,'serie':35,
                  'programa_tv':35,'site':30,'app':30,'software':30,'produto':30}
        for category, score in expected.items():
            obj=copy.deepcopy(BASE); obj['category']=category
            for key,row in obj['ratings'].items():
                row['rating']=5 if key in ['clareza','fluxo'] else 0
            with self.subTest(category=category):
                result=evaluate(obj)
                self.assertEqual(result['score'],score)
                self.assertEqual(result['coverage_percent'],100)
                self.assertEqual(result['seal'],'SEM_SELO')

    def test_exact_grade_from_components(self):
        for rating, expected in [('3.5','SEM_SELO'),('4','BRONZE'),('4.5','PRATA')]:
            obj=copy.deepcopy(BASE)
            for row in obj['ratings'].values(): row['rating']=rating
            self.assertEqual(evaluate(obj)['seal'],expected)

    def test_component_precision_matches_browser_contract(self):
        for value in [4.65, '4.600000000000000000000000000001', Decimal('0.01')]:
            obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['rating']=value
            with self.subTest(value=value), self.assertRaises(ValueError): evaluate(obj)
        for value in [4.6, '4.60', Decimal('4.600')]:
            obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['rating']=value
            with self.subTest(value=value): self.assertEqual(evaluate(obj)['score'],92)

    def test_course_precision_matches_browser_contract(self):
        obj={k:4 for k in CONFIG['course_weights']}; obj['interesse']=4.65
        with self.assertRaises(ValueError): course_index(obj)

    def test_inference_cannot_issue_seal_in_any_category(self):
        for category in CONFIG['categories']:
            obj=copy.deepcopy(BASE); obj['category']=category
            obj['ratings']['fluxo']['basis']='inferencia'
            with self.subTest(category=category):
                result=evaluate(obj)
                self.assertEqual(result['score'],92)
                self.assertIsNone(result['seal'])
                self.assertEqual(result['status'],'PENDENTE_EVIDENCIAS_OU_VERIFICACAO')
                self.assertEqual(result['confidence'],'BAIXA')
                self.assertEqual(result['inferred_criteria'],['fluxo'])
                self.assertIn('nenhum selo emitido',to_markdown(result))

    def test_documented_report_preserves_basis_and_affinity(self):
        obj=copy.deepcopy(BASE); obj['personal_affinity']='baixa — relato do usuário'
        for row in obj['ratings'].values(): row['basis']='relato_usuario'
        result=evaluate(obj)
        self.assertEqual(result['score'],92)
        self.assertEqual(result['seal'],'OURO')
        self.assertEqual(result['confidence'],'MODERADA')
        self.assertEqual(result['personal_affinity'],obj['personal_affinity'])
        self.assertEqual(result['inferred_criteria'],[])

    def test_missing_not_silently_approved(self):
        obj=copy.deepcopy(BASE); del obj['ratings']['fluxo']
        result=evaluate(obj)
        self.assertIsNone(result['seal'])
        self.assertIsNone(result['score'])
        self.assertEqual(result['coverage_percent'],85)
        self.assertAlmostEqual(result['observed_only_score'],92)
        self.assertEqual(result['missing_data_bounds'],[78.2,93.2])

    def test_single_documented_criterion_is_not_full_approval(self):
        obj=copy.deepcopy(BASE)
        obj['ratings']={'clareza':copy.deepcopy(obj['ratings']['clareza'])}
        obj['ratings']['clareza']['rating']=5
        result=evaluate(obj)
        self.assertEqual(result['coverage_percent'],15)
        self.assertEqual(result['observed_only_score'],100)
        self.assertEqual(result['missing_data_bounds'],[15,100])
        self.assertIsNone(result['score'])
        self.assertIsNone(result['seal'])

    def test_no_evidence_rejected(self):
        obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['evidence']=''
        with self.assertRaises(ValueError): evaluate(obj)

    def test_no_source_rejected(self):
        obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['source']=''
        with self.assertRaises(ValueError): evaluate(obj)

    def test_critical_failure(self):
        obj=copy.deepcopy(BASE); obj['gates']['autonomia_sem_coercao']='falha'
        result=evaluate(obj)
        self.assertIsNone(result['seal'])
        self.assertEqual(result['status'],'SEM_SELO_IMPEDIMENTO_CRITICO')

    def test_unknown_gate(self):
        obj=copy.deepcopy(BASE); obj['gates']={}
        result=evaluate(obj)
        self.assertIsNone(result['seal'])
        self.assertEqual(len(result['unresolved_gates']),3)

    def test_gate_failures_and_unknowns_block_each_condition(self):
        for gate in CONFIG['gates']:
            for state in ['falha','desconhecido',None]:
                obj=copy.deepcopy(BASE)
                if state is None: del obj['gates'][gate]
                else: obj['gates'][gate]=state
                with self.subTest(gate=gate,state=state):
                    result=evaluate(obj)
                    self.assertIsNone(result['seal'])
                    self.assertEqual(result['score'],92)

    def test_invalid_gate_structure_rejected(self):
        for gates in [None, [], {'dopamina':'verificado'}, {'seguranca_essencial':True}]:
            obj=copy.deepcopy(BASE); obj['gates']=gates
            with self.subTest(gates=gates), self.assertRaises(ValueError): evaluate(obj)

    def test_rating_values_and_evidence_types_rejected(self):
        for value in [True,'', ' ', float('nan'), float('inf'), -0.1, 5.1, []]:
            obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['rating']=value
            with self.subTest(value=value), self.assertRaises(ValueError): evaluate(obj)
        for field in ['evidence','source']:
            for value in [None, {}, [], True, 123, '   ']:
                obj=copy.deepcopy(BASE); obj['ratings']['fluxo'][field]=value
                with self.subTest(field=field,value=value), self.assertRaises(ValueError): evaluate(obj)

    def test_invalid_basis_rejected(self):
        obj=copy.deepcopy(BASE); obj['ratings']['fluxo']['basis']='popularidade'
        with self.assertRaises(ValueError): evaluate(obj)

    def test_empty_scores(self):
        obj=copy.deepcopy(BASE); obj['ratings']={}
        result=evaluate(obj)
        self.assertIsNone(result['observed_only_score'])
        self.assertEqual(result['missing_data_bounds'],[0,100])

    def test_unknown_criterion(self):
        obj=copy.deepcopy(BASE); obj['ratings']['dopamina']={}
        with self.assertRaises(ValueError): evaluate(obj)

    def test_course_no_probability(self):
        result=course_index({k:4 for k in CONFIG['course_weights']})
        self.assertEqual(result['compatibility_index'],80)
        self.assertIsNone(result['success_probability'])

    def test_course_incomplete(self):
        result=course_index({'interesse':5})
        self.assertIsNone(result['compatibility_index'])
        self.assertEqual(len(result['missing']),5)

    def test_unknown_course_criterion(self):
        with self.assertRaises(ValueError): course_index({'severidade_tdah':5})

    def test_affinity_cannot_force_seal(self):
        obj=copy.deepcopy(BASE); obj['personal_affinity']='referência de ouro'; obj['ratings']={}
        self.assertIsNone(evaluate(obj)['seal'])

    def test_real_title_not_hardcoded(self):
        for title in ['Devil May Cry 5','Ninja Gaiden','Onimusha']:
            obj=copy.deepcopy(BASE); obj['title']=title
            self.assertEqual(evaluate(obj)['score'],92)

    def test_bad_category(self):
        obj=copy.deepcopy(BASE); obj['category']='programa'
        with self.assertRaises(ValueError): evaluate(obj)

    def test_no_input_overwrite(self):
        self.assertEqual(main(['exemplo_ficticio.json','--output','exemplo_ficticio.json']),2)

if __name__=='__main__': unittest.main()
