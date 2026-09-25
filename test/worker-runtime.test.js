import test from 'node:test';import assert from 'node:assert/strict';import {submitTask,processBatch,workerRuntimeStatus,resetStore} from '../config/aion-worker-runtime.js';
test.beforeEach(async()=>resetStore());
test('runtime accepts ordinary work and processes it',async()=>{const task=await submitTask({text:'fix API bug and run tests'});assert.equal(task.action,'queued_for_worker');const result=await processBatch(1);assert.equal(result.length,1);assert.equal(result[0].status,'completed');});
test('runtime does not execute approval-gated work',async()=>{const task=await submitTask({text:'send payment to vendor'});assert.equal(task.action,'await_human_approval');assert.equal((await processBatch(1)).length,0);assert.equal((await workerRuntimeStatus()).awaitingApproval,1);});
