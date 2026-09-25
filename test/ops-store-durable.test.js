import test from 'node:test';import assert from 'node:assert/strict';import {createTask,getTask,updateTask,resetStore,opsStorageHealth} from '../config/aion-ops-store.js';
test.beforeEach(async()=>resetStore());
test('task store works locally and exposes storage mode',async()=>{const t=await createTask({text:'test durable task',priority:90});assert.equal((await getTask(t.id)).text,'test durable task');await updateTask(t.id,{status:'ready'});assert.equal((await getTask(t.id)).status,'ready');assert.ok(['memory-fallback','upstash-redis'].includes(opsStorageHealth().mode));});
