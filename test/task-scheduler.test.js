import test from 'node:test';
import assert from 'node:assert/strict';
import { distributeTasks, buildDepartmentWorkload, schedulerHealth } from '../config/aion-task-scheduler.js';
test('distributes work across departments and registered agents',()=>{const result=distributeTasks(Array.from({length:40},(_,i)=>({text:'safe task '+i})));assert.equal(result.length,40);assert.equal(new Set(result.map(x=>x.assignment.department)).size,20);assert.equal(result.every(x=>x.assignment.poolSize===500),true);});
test('workload represents all 10,000 registered roles',()=>{assert.equal(buildDepartmentWorkload().reduce((n,x)=>n+x.registeredAgents,0),10000);assert.equal(schedulerHealth().totalAgents,10000);});
