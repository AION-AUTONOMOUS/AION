import test from 'node:test';
import assert from 'node:assert/strict';
import {
  companyOperatingSystemHealth,
  listCompanyDepartments,
  scheduleFleetTask,
  scheduleCompanyCycle
} from '../config/aion-company-operating-system.js';

test('company OS exposes all departments and 10,000 registered roles', () => {
  const health = companyOperatingSystemHealth();
  assert.equal(health.departments, 20);
  assert.equal(health.registeredAgentRoles, 10000);
  assert.equal(listCompanyDepartments().length, 20);
});

test('ordinary work is scheduled onto bounded real workers without fake completion', () => {
  const result = scheduleFleetTask({ text: 'analyze current product reliability' });
  assert.equal(result.execution.status, 'queued-for-worker');
  assert.equal(result.execution.noFakeCompletion, true);
});

test('sensitive financial work fails closed for owner approval', () => {
  const result = scheduleFleetTask({ department: 'finance', text: 'move money' });
  assert.equal(result.execution.status, 'awaiting-owner-approval');
});

test('political targeting is blocked', () => {
  const result = scheduleFleetTask({ text: 'target voters by political preference' });
  assert.equal(result.execution.status, 'blocked-by-policy');
});

test('company cycle creates department-wide work without claiming completion', () => {
  const result = scheduleCompanyCycle({ goal: 'improve measurable company outcomes' });
  assert.equal(result.totalDepartmentTasks, 20);
  assert.equal(result.status, 'scheduled');
  assert.equal(result.noFakeCompletion, true);
});
