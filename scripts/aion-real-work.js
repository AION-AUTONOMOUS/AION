import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const checks={engineering:['node','--test'],quality:['node','--test'],security:['npm','audit','--audit-level=high'],devops:['npx','hardhat','compile'],research:['node','--check','config/aion-fleet.js'],data:['node','--check','config/aion-daily-report.js'],product:['node','--check','config/aion-control-plane.js'],operations:['node','--check','config/aion-ops-engine.js'],communications:['node','--check','api/orchestrator.js']};
const department=process.argv[2]||'operations'; const command=checks[department]||['node','--check','config/aion-workers.js']; const result=spawnSync(command[0],command.slice(1),{encoding:'utf8',shell:false});
mkdirSync('reports',{recursive:true}); const report={department,command:command.join(' '),exitCode:result.status??1,ok:result.status===0,stdout:String(result.stdout||'').slice(-4000),stderr:String(result.stderr||'').slice(-4000),utc:new Date().toISOString()};
writeFileSync('reports/worker-result.json',JSON.stringify(report,null,2)); process.stdout.write(JSON.stringify(report,null,2)); process.exit(result.status===0?0:1);
