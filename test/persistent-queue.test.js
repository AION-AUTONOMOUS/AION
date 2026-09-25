import test from 'node:test';import assert from 'node:assert/strict';import {enqueue,claimNext,complete,queueHealth,resetQueue} from '../config/aion-persistent-queue.js';
test.beforeEach(()=>resetQueue());
test('queue claims and completes work',()=>{const x=enqueue({text:'run safe check',priority:2});assert.equal(x.status,'queued');const y=claimNext();assert.equal(y.id,x.id);complete(y.id,{ok:true});assert.equal(queueHealth().completed,1);});
