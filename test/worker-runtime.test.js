import test from 'node:test';
import assert from 'node:assert/strict';
import { submitTask, processBatch, workerRuntimeStatus, setActionExecutor, resetStore } from '../config/aion-worker-runtime.js';

test.beforeEach(async()=>{await resetStore();setActionExecutor(async task=>({type:'test-action',taskId:task.id,ok:true}));});
test('runtime executes a registered action before completing',async()=>{const task=await submitTask({text:'fix API bug and run tests'});assert.equal(task.action,'queued_for_worker');const result=await processBatch(1);assert.equal(result.length,1);assert.equal(result[0].status,'completed');assert.equal(result[0].result.type,'test-action');});
test('runtime records action failure instead of fake completion',async()=>{setActionExecutor(async()=>{throw new Error('adapter unavailable');});const task=await submitTask({text:'analyze release'});const result=await processBatch(1);assert.equal(result[0].status,'failed');assert.equal(result[0].error,'adapter unavailable');});
test('runtime does not execute approval-gated work',async()=>{const task=await submitTask({text:'send payment to vendor'});assert.equal(task.action,'await_human_approval');assert.equal((await processBatch(1)).length,0);assert.equal((await workerRuntimeStatus()).awaitingApproval,1);});
