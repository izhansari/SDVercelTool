// api/shopify-orders.js
// Vercel serverless function — proxies Shopify API to avoid CORS

export default async function handler(req, res) {
  // Allow requests from your deployed frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const store = process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_TOKEN;

  if (!store || !token) {
    return res.status(500).json({ error: "Missing SHOPIFY_STORE or SHOPIFY_TOKEN env vars" });
  }

  try {
    const allOrders = [];
    let url = `https://${store}/admin/api/2024-01/orders.json?status=open&financial_status=paid&limit=250`;

    while (url) {
      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Shopify error: ${response.statusText}` });
      }

      const data = await response.json();
      allOrders.push(...data.orders);

      // Follow pagination
      const link = response.headers.get("Link") || "";
      const next = link.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
    }

    return res.status(200).json({ orders: allOrders });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
