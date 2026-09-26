import http from "node:http";
import { listAgents } from "./agents.js";
const port = Number(process.env.PORT || 8787);
const serviceName = "AION Mobile Core";
const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
};
const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { success: true, service: serviceName, version: "1.0.0", status: "ready" });
  if (req.method === "GET" && req.url === "/agents") return send(res, 200, { success: true, service: serviceName, agents: listAgents() });
  return send(res, 404, { success: false, error: "Not found" });
});
server.listen(port, () => console.log(serviceName + " listening on " + port));
