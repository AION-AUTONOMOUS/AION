import http from "node:http";
import { listAgents, listServices } from "./agents.js";
const port = Number(process.env.PORT || 8787);
const serviceName = "AION Mobile Core";
const send = (res, status, body) => {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"});
  res.end(JSON.stringify(body));
};
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url || "/", "http://aion.mobile");
  if (req.method === "OPTIONS") return send(res,204,{});
  if (req.method === "GET" && url.pathname === "/health") return send(res,200,{success:true,service:serviceName,version:"1.1.0",status:"ready"});
  if (req.method === "GET" && url.pathname === "/agents") return send(res,200,{success:true,service:serviceName,agents:listAgents()});
  if (req.method === "GET" && url.pathname === "/services") return send(res,200,{success:true,service:serviceName,services:listServices()});
  if (req.method === "POST" && url.pathname === "/chat") {
    let raw=""; for await (const chunk of req) raw += chunk;
    let body; try { body=JSON.parse(raw||"{}"); } catch { return send(res,400,{success:false,error:"invalid JSON"}); }
    const message=typeof body.message==="string"?body.message.trim():"";
    if(!message) return send(res,400,{success:false,error:"message required"});
    if(message.length>12000) return send(res,413,{success:false,error:"message too long"});
    if(!process.env.GROQ_API_KEY) return send(res,503,{success:false,error:"AI provider is not configured"});
    const agent=listAgents().find(a=>a.id===body.agent)||listAgents()[0];
    const groqRes=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+process.env.GROQ_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"openai/gpt-oss-120b",messages:[{role:"system",content:"أنت AION Mobile Core. لا تدّع تنفيذ أفعال خارج النظام ولا تنفذ قرارات مالية أو قانونية أو سياسية حساسة دون موافقة بشرية. الوكيل: "+agent.name+"."},{role:"user",content:message}],temperature:0.7})});
    const rawText=await groqRes.text(); let data; try{data=JSON.parse(rawText)}catch{return send(res,502,{success:false,error:"AI provider returned invalid JSON"})}
    if(!groqRes.ok)return send(res,502,{success:false,error:"AI provider error"});
    const reply=data.choices?.[0]?.message?.content;
    if(!reply)return send(res,502,{success:false,error:"AI provider returned no reply"});
    return send(res,200,{success:true,reply,agent});
  }
  return send(res,404,{success:false,error:"Not found"});
});
server.listen(port,()=>console.log(serviceName+" listening on "+port));
