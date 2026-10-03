import { runSentinelMission } from '../server-api/space-sentinel.js';
const bbox=String(process.env.AION_SENTINEL_BBOX||'').split(',').map(Number),from=process.env.AION_SENTINEL_FROM,to=process.env.AION_SENTINEL_TO;
if(bbox.length!==4||bbox.some(Number.isNaN)||!from||!to)throw new Error('Set AION_SENTINEL_BBOX, AION_SENTINEL_FROM and AION_SENTINEL_TO before running.');
const result=await runSentinelMission({bbox,from,to,collection:process.env.AION_SENTINEL_COLLECTION||'sentinel-2-l2a',width:Number(process.env.AION_SENTINEL_WIDTH||1024),height:Number(process.env.AION_SENTINEL_HEIGHT||1024)});
console.log(JSON.stringify({ok:true,provider:result.provider,source:result.source,mock:result.mock,evidence:result.evidence,imageBytes:Buffer.isBuffer(result.image)?result.image.length:undefined},null,2));
