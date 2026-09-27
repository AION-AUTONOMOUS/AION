import http from "node:http";
import { listAgents, listServices } from "./agents.js";
import { controlPlaneHealth } from "../../../config/aion-control-plane.js";
import { stackHealth, createAutonomousPlan, listAutonomousPlans } from "../../../config/aion-autonomous-stack.js";
import { processBatch, workerRuntimeStatus } from "../../../config/aion-worker-runtime.js";

const port = Number(process.env.PORT || 8787);
const serviceName = "AION Autonomous Core";
const VERSION = "1.3.0";
const WORKER_TICK_MS = Math.max(5000, Number(process.env.AION_WORKER_TICK_MS || 5000));
const CHAT_MODEL = process.env.AION_GROQ_CHAT_MODEL || process.env.AION_GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_CHAT_RETRIES = 4;

const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  });
  res.end(JSON.stringify(body));
};

const readBody = async req => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { throw new Error("invalid JSON"); }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function callGroq(messages, temperature = 0.7) {
  if (!process.env.GROQ_API_KEY) throw new Error("AI provider is not configured");

  let lastError = "AI provider error";
  for (let attempt = 1; attempt <= MAX_CHAT_RETRIES; attempt += 1) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{
          Authorization:"Bearer "+process.env.GROQ_API_KEY,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model: CHAT_MODEL,
          messages,
          temperature,
          max_completion_tokens: Math.max(128, Math.min(Number(process.env.AION_GROQ_MAX_COMPLETION_TOKENS) || 800, 2048))
        })
      });

      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = { error: { message: raw.slice(-2000) } }; }

      if (response.ok) {
        const reply = data.choices?.[0]?.message?.content;
        if (!reply) throw new Error("AI provider returned no reply");
        return reply;
      }

      lastError = data?.error?.message || `AI provider HTTP ${response.status}`;
      const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === MAX_CHAT_RETRIES) throw new Error(lastError);

      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30000)
        : Math.min(3000 * (2 ** (attempt - 1)), 30000);
      await sleep(delayMs);
    } catch (error) {
      lastError = String(error?.message || error);
      if (attempt === MAX_CHAT_RETRIES) throw new Error(lastError);
      await sleep(Math.min(3000 * (2 ** (attempt - 1)), 30000));
    }
  }
  throw new Error(lastError);
}

let workerTickBusy = false;
const runWorkerTick = async () => {
  if (workerTickBusy) return;
  workerTickBusy = true;
  try { await processBatch(); } catch (error) { console.error("AION worker tick failed:", error?.message || error); }
  finally { workerTickBusy = false; }
};
const workerInterval = setInterval(runWorkerTick, WORKER_TICK_MS);
workerInterval.unref?.();

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url || "/", "http://aion.mobile");
  if (req.method === "OPTIONS") return send(res,204,{});

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res,200,{
      success:true,
      service:serviceName,
      version:VERSION,
      status:"ready",
      controlPlane:controlPlaneHealth().status,
      stack:stackHealth().status
    });
  }

  if (req.method === "GET" && url.pathname === "/autonomy") {
    return send(res,200,{
      success:true,
      service:serviceName,
      stack:stackHealth(),
      controlPlane:controlPlaneHealth(),
      workerRuntime:await workerRuntimeStatus()
    });
  }

  if (req.method === "GET" && url.pathname === "/plans") {
    return send(res,200,{success:true,plans:await listAutonomousPlans()});
  }

  if (req.method === "POST" && url.pathname === "/plan") {
    try {
      const body = await readBody(req);
      if (typeof body.goal !== "string" || !body.goal.trim()) return send(res,400,{success:false,error:"goal required"});
      if (body.goal.length > 12000) return send(res,413,{success:false,error:"goal too long"});
      const plan = await createAutonomousPlan(body.goal, body);
      return send(res,201,{success:true,plan});
    } catch (error) {
      return send(res,400,{success:false,error:String(error?.message || error)});
    }
  }

  if (req.method === "GET" && url.pathname === "/agents") return send(res,200,{success:true,service:serviceName,agents:listAgents()});
  if (req.method === "GET" && url.pathname === "/services") return send(res,200,{success:true,service:serviceName,services:listServices()});

  if (req.method === "POST" && url.pathname === "/chat") {
    try {
      const body = await readBody(req);
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return send(res,400,{success:false,error:"message required"});
      if (message.length > 12000) return send(res,413,{success:false,error:"message too long"});
      const agent = listAgents().find(a => a.id === body.agent) || listAgents()[0];
      const reply = await callGroq([
        {role:"system",content:"أنت AION Mobile Core. لا تدّع تنفيذ أفعال خارج النظام ولا تنفذ قرارات مالية أو قانونية أو سياسية حساسة دون موافقة بشرية. الوكيل: "+agent.name+"."},
        {role:"user",content:message}
      ]);
      return send(res,200,{success:true,reply,agent,model:CHAT_MODEL});
    } catch (error) {
      return send(res,502,{success:false,error:String(error?.message || error)});
    }
  }

  return send(res,404,{success:false,error:"Not found"});
});

server.listen(port,()=>console.log(serviceName+" v"+VERSION+" listening on "+port+"; control plane ready; worker runtime active"));
