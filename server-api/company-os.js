import {
  companyOperatingSystemHealth,
  listCompanyDepartments,
  scheduleCompanyCycle,
  scheduleFleetTask
} from '../config/aion-company-operating-system.js';

export async function handleCompanyOs(request) {
  const url = new URL(request.url || 'http://localhost');
  const method = String(request.method || 'GET').toUpperCase();

  if (method === 'GET' && url.pathname.endsWith('/health')) {
    return Response.json(companyOperatingSystemHealth());
  }

  if (method === 'GET' && url.pathname.endsWith('/departments')) {
    return Response.json({ departments: listCompanyDepartments() });
  }

  if (method === 'POST' && url.pathname.endsWith('/schedule')) {
    const body = await request.json();
    return Response.json(scheduleFleetTask(body));
  }

  if (method === 'POST' && url.pathname.endsWith('/cycle')) {
    const body = await request.json();
    return Response.json(scheduleCompanyCycle(body));
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}
