const { TableClient } = require("@azure/data-tables");
const crypto = require("crypto");

function principal(headers) {
  const h = headers["x-ms-client-principal"];
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h, "base64").toString("utf8")); } catch { return null; }
}
const subId = (endpoint) => crypto.createHash("sha256").update(endpoint).digest("hex");

module.exports = async function (context, req) {
  try {
    const p = principal(req.headers);
    if (!p) return (context.res = { status: 401, body: { error: "not signed in" } });

    if (!process.env.TABLES_CONNECTION_STRING) {
      context.log.error("Missing TABLES_CONNECTION_STRING");
      return (context.res = { status: 500, body: { error: "Missing TABLES_CONNECTION_STRING" } });
    }

    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch {}
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return (context.res = { status: 400, body: { error: "invalid subscription" } });
    }

    const client = TableClient.fromConnectionString(process.env.TABLES_CONNECTION_STRING, "PushSubs");
    const id = subId(sub.endpoint);

    await client.upsertEntity({
      partitionKey: p.userId,
      rowKey: id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: req.headers["user-agent"] || "",
      enabled: true,
      createdUtc: new Date().toISOString(),
      lastSeenUtc: new Date().toISOString()
    }, "Merge");

    context.res = { body: { ok: true, subscriptionId: id } };
  } catch (e) {
    context.log.error("REGISTER ERROR:", e);
    context.res = { status: 500, body: { error: e?.message || String(e) } };
  }
};
