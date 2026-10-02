import { platformHealth, getProduct } from "../config/aion-global-platform.js";

export default async function handler({ req, res }) {
  const url = new URL(req.url, "http://localhost");
  const productId = url.searchParams.get("product");

  if (req.method === "GET" && productId) {
    const product = getProduct(productId);
    if (!product) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ ok: false, error: "product_not_found" }));
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ ok: true, product }));
  }

  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  return res.end(JSON.stringify({ ok: true, platform: platformHealth() }));
}
