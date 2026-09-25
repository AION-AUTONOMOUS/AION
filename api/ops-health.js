import { opsHealth } from '../config/aion-ops-engine.js';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).json({success:false,error:'Method not allowed'});return res.status(200).json({success:true,...await opsHealth()});}
