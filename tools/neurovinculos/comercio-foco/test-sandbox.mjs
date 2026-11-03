import test from'node:test';
import assert from'node:assert/strict';
import{mkdtempSync,writeFileSync,rmSync}from'node:fs';
import{tmpdir}from'node:os';
import{join}from'node:path';
import{startSandboxHarness}from'./local-sandbox.mjs';
test('local harness refuses execution before reading any credential file without explicit test-only marker',async()=>{
  await assert.rejects(startSandboxHarness({FOCO_STRIPE_TEST_ONLY:'false',FOCO_STRIPE_SANDBOX_CONFIG:'/not-accessed'}),e=>e.code==='QA_SETUP_REQUIRED'&&e.message.includes('TEST_ONLY'));
});
test('local harness rejects a synthetic live-prefixed key before loading SDK or performing any API operation',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'foco-commerce-guard-')),file=join(dir,'synthetic.json');
  try{
    writeFileSync(file,JSON.stringify({secret_key:'rk_live_synthetic_fixture_not_a_real_key',account_id:'acct_fixture'}),{mode:0o600});
    await assert.rejects(startSandboxHarness({FOCO_STRIPE_TEST_ONLY:'true',FOCO_STRIPE_SANDBOX_CONFIG:file,FOCO_STRIPE_SDK_MODULE:'/must-not-be-loaded'}),e=>e.code==='QA_SETUP_REQUIRED'&&e.message.includes('TESTE'));
  }finally{rmSync(dir,{recursive:true,force:true});}
});
