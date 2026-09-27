import {
  companyOperatingSystemHealth,
  listCompanyDepartments,
  scheduleCompanyCycle,
  scheduleFleetTask
} from '../config/aion-company-operating-system.js';

export default async function companyOsHandler(req, res) {
  const path = String(req.query?.path || '').replace(/^\//, '');
  const method = String(req.method || 'GET').toUpperCase();

  if (method === 'GET' && (path === 'health' || !path)) {
    return res.status(200).json(companyOperatingSystemHealth());
  }
  if (method === 'GET' && path === 'departments') {
    return res.status(200).json({ departments: listCompanyDepartments() });
  }
  if (method === 'POST' && path === 'schedule') {
    return res.status(200).json(scheduleFleetTask(req.body || {}));
  }
  if (method === 'POST' && path === 'cycle') {
    return res.status(200).json(scheduleCompanyCycle(req.body || {}));
  }
  return res.status(404).json({ error: 'not_found' });
}
