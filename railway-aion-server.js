import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAgents, listServices } from "./apps/aion-mobile-service/src/agents.js";
import { controlPlaneHealth } from "./config/aion-control-plane.js";
import { stackHealth, createAutonomousPlan, getAutonomousPlan, listAutonomousPlans } from "./config/aion-autonomous-stack.js";
import { processBatch, workerRuntimeStatus } from "./config/aion-worker-runtime.js";

const port = Number(process.env.PORT || 8787);
const serviceName = "AION Autonomous Core";
const VERSION = "1.7.1";
const WORKER_TICK_MS = Math.max(5000, Number(process.env.AION_WORKER_TICK_MS || 5000));
const CHAT_MODEL = process.env.AION_GROQ_CHAT_MODEL || process.env.AION_GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_CHAT_RETRIES = 4;
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const API_HANDLERS = {
  fleet: () => import("./server-api/fleet.js"),
  chat: () => import("./server-api/chat.js"),
  ops: () => import("./server-api/ops.js"),
  presale: () => import("./server-api/presale.js"),
  verify: () => import("./server-api/verify.js"),
  webhook: () => import("./server-api/webhook.js"),
  "daily-report": () => import("./server-api/daily-report.js"),
  "ops-health": () => import("./server-api/ops-health.js"),
  orchestrator: () => import("./server-api/orchestrator.js"),
  "runtime-dispatch": () => import("./server-api/runtime-dispatch.js"),
  "test-redis": () => import("./server-api/test-redis.js"),
  "worker-runtime-health": () => import("./server-api/worker-runtime-health.js"),
  "worker-runtime": () => import("./server-api/worker-runtime.js"),
  "ops-approve": () => import("./server-api/ops-approve.js"),
  workers: () => import("./server-api/workers.js"),
  "paypal-client-id": () => import("./server-api/paypal/client-id.js"),
  "paypal-client-config": () => import("./server-api/paypal/client-config.js"),
  "paypal-create-order": () => import("./server-api/paypal/create-order.js"),
  "paypal-capture-order": () => import("./server-api/paypal/capture-order.js"),
  "wallet-config": () => import("./server-api/wallet/config.js"),
  "space-commerce": () => import("./server-api/space-commerce.js"),
  "live-space": () => import("./server-api/live-space.js"),
  "leo-orchestrator": () => import("./server-api/leo-orchestrator.js"),
  "leo-exchange": () => import("./server-api/leo-intelligence-exchange.js"),
  mobile: () => import("./server-api/mobile.js"),
  autonomy: () => import("./server-api/autonomy.js"),
  "economic-intelligence": () => import("./server-api/economic-intelligence.js"),
  "continuous-intelligence": () => import("./server-api/continuous-intelligence.js"),
  "customer-revenue": () => import("./server-api/customer-revenue.js"),
  leads: () => import("./server-api/leads.js"),
  "global-prospecting": () => import("./server-api/global-prospecting.js"),
  "demand-intelligence": () => import("./server-api/demand-intelligence.js"),
  "distressed-assets": () => import("./server-api/distressed-assets.js"),
  "global-distressed-map": () => import("./server-api/global-distressed-map.js"),
  "executive-operating-system": () => import("./server-api/executive-operating-system.js"),
  "openai-intelligence": () => import("./server-api/openai-intelligence.js"),
  "global-platform": () => import("./server-api/global-platform.js"),
  "space-sentinel": () => import("./server-api/space-sentinel.js"),
  "asset-vault": () => import("./server-api/asset-vault.js"),
  "asset-vault-intelligence": () => import("./server-api/asset-vault-intelligence.js"),
  "asset-vault-ai-state": () => import("./server-api/asset-vault-ai-state.js"),
  "agent-mesh": () => import("./server-api/agent-mesh.js"),
  "digital-treasury": () => import("./server-api/digital-treasury.js"),
  "orbital-exchange": () => import("./server-api/orbital-exchange.js"),
  "digital-contracts": () => import("./server-api/digital-contracts.js"),
  "deal-room": () => import("./server-api/deal-room.js"),
  "market-quote": () => import("./server-api/market-quote.js")
};

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

const mime = {
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webp":"image/webp",
  ".ico":"image/x-icon",
  ".txt":"text/plain; charset=utf-8",
  ".xml":"application/xml; charset=utf-8",
  ".webmanifest":"application/manifest+json; charset=utf-8"
};

async function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const target = path.resolve(ROOT, "." + requested);
  if (!target.startsWith(ROOT + path.sep) && target !== ROOT) return false;
  try {
    const data = await fs.readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": requested === "/index.html" ? "no-store" : "public, max-age=300"
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

function makeVercelResponse(res) {
  const headers = {};
  return {
    setHeader(name, value) { headers[name] = value; res.setHeader(name, value); return this; },
    getHeader(name) { return headers[name] ?? res.getHeader(name); },
    removeHeader(name) { delete headers[name]; res.removeHeader(name); },
    status(code) { res.statusCode = code; return this; },
    json(body) {
      if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(body));
      return this;
    },
    send(body) {
      if (!res.headersSent && typeof body === "object") res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
      return this;
    },
    end(body = "") { res.end(body); return this; },
    writeHead(...args) { res.writeHead(...args); return this; }
  };
}

async function dispatchLegacyApi(req, res, url) {
  let route = url.searchParams.get("route");

  if (!route && url.pathname.startsWith("/api/")) {
    const tail = url.pathname.slice("/api/".length);
    const direct = {
      "openai-intelligence":"openai-intelligence",
      "customer-revenue":"customer-revenue",
      leads:"leads",
      "global-prospecting":"global-prospecting",
      "demand-intelligence":"demand-intelligence",
      "distressed-assets":"distressed-assets",
      "global-distressed-map":"global-distressed-map",
      "executive-operating-system":"executive-operating-system",
      autonomy:"autonomy",
      mobile:"mobile",
      fleet:"fleet",
      chat:"chat",
      ops:"ops",
      presale:"presale",
      verify:"verify",
      webhook:"webhook",
      "daily-report":"daily-report",
      "ops-health":"ops-health",
      orchestrator:"orchestrator",
      "runtime-dispatch":"runtime-dispatch",
      "test-redis":"test-redis",
      "worker-runtime-health":"worker-runtime-health",
      "worker-runtime":"worker-runtime",
      "ops-approve":"ops-approve",
      workers:"workers",
      "paypal/client-id":"paypal-client-id",
      "paypal/client-config":"paypal-client-config",
      "paypal/create-order":"paypal-create-order",
      "paypal/capture-order":"paypal-capture-order",
      "wallet/config":"wallet-config",
      "space-commerce":"space-commerce",
      "live-space":"live-space",
      "leo-exchange":"leo-exchange",
      "leo-orchestrator":"leo-orchestrator",
      "economic-intelligence":"economic-intelligence",
      "continuous-intelligence":"continuous-intelligence",
      "space-sentinel":"space-sentinel",
      "asset-vault":"asset-vault",
      "asset-vault/intelligence":"asset-vault-intelligence",
      "asset-vault-ai-state":"asset-vault-ai-state",
      "agent-mesh":"agent-mesh",
      "digital-treasury":"digital-treasury",
      "orbital-exchange":"orbital-exchange",
      "digital-contracts":"digital-contracts",
      "deal-room":"deal-room",
      "market-quote":"market-quote"
    };
    route = direct[tail] || null;
  }

  if (!route || !API_HANDLERS[route]) {
    if (url.pathname.startsWith("/api/")) return send(res, 404, { success:false, error:"Unknown AION API route" });
    return false;
  }

  try {
    const module = await API_HANDLERS[route]();
    const body = ["GET","HEAD"].includes(req.method) ? null : await readBody(req);
    if (body) req.body = body;
    const response = makeVercelResponse(res);
    await module.default(req, response);
    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error("AION API bridge error:", route, error);
    if (!res.writableEnded) send(res, 500, { success:false, error:"AION API route failed" });
  }
  return true;
}

let workerTickBusy = false;
const runWorkerTick = async () => {
  if (workerTickBusy) return;
  workerTickBusy = true;
  try { await processBatch(); } catch (error) { console.error("AION worker tick failed:", error?.message || error); }
  finally { workerTickBusy = false; }
};
const workerInterval = setInterval(runWorkerTick, WORKER_TICK_MS);
// Keep the worker runtime referenced so the Node process cannot exit naturally.
// Railway must be able to keep this service alive even while the durable queue is idle.
workerInterval.ref?.();

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url || "/", "http://aion.railway");
  if (req.method === "OPTIONS") return send(res,204,{});

  if (req.method === "GET" && url.pathname === "/health") {
    // Railway deploy healthchecks must stay lightweight and independent of
    // downstream providers/storage. Deep readiness is exposed separately.
    return send(res,200,{
      success:true,
      service:serviceName,
      version:VERSION,
      status:"ready"
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

  if (req.method === "GET" && url.pathname === "/plan") {
    const planId = url.searchParams.get("id");
    const plan = await getAutonomousPlan(planId);
    if (!plan) return send(res,404,{success:false,error:"plan not found"});
    return send(res,200,{success:true,plan});
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

  if (url.pathname.startsWith("/api/")) return dispatchLegacyApi(req,res,url);

  if (req.method === "GET" && await serveStatic(req,res,url.pathname)) return;

  return send(res,404,{success:false,error:"Not found"});
});

server.on("close", () => console.error("AION HTTP server closed unexpectedly"));
server.on("error", error => console.error("AION HTTP server error:", error?.message || error));
process.on("SIGTERM", () => console.error("AION process received SIGTERM from the runtime"));
process.on("SIGINT", () => console.error("AION process received SIGINT"));
process.on("uncaughtException", error => console.error("AION uncaught exception:", error?.stack || error));
process.on("unhandledRejection", error => console.error("AION unhandled rejection:", error?.stack || error));

server.listen(port,()=>console.log(serviceName+" v"+VERSION+" listening on "+port+"; control plane ready; worker runtime active"));
