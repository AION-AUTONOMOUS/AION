import { spawnSync } from 'node:child_process';
export function runSelfChecks(){
  const checks=[['syntax',['find','api','config','scripts','test','-type','f','-name','*.js']],['tests',['node','--test']],['contracts',['npx','hardhat','compile']]];
  return checks.map(([name,cmd])=>{const r=spawnSync(cmd[0],cmd.slice(1),{encoding:'utf8'});return {name,ok:r.status===0,exitCode:r.status??1,stderr:String(r.stderr||'').slice(-1500)};});
}
export function repairDecision(results){const failed=results.filter(x=>!x.ok);return {safeToAutoRepair:failed.length>0&&failed.every(x=>x.name==='tests'||x.name==='contracts'),failed};}
