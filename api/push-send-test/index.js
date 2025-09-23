const { TableClient } = require("@azure/data-tables");
const webpush = require("web-push");

function principal(headers) {
  const h = headers["x-ms-client-principal"];
  if (!h) return null;
  try { return JSON.parse(Buffer.from(h, "base64").toString("utf8")); } catch { return null; }
}

module.exports = async function (context, req) {
  const p = principal(req.headers);
  if (!p) { context.res = { status: 401, body: { error: "not signed in" } }; return; }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const client = TableClient.fromConnectionString(process.env.TABLES_CONNECTION_STRING, "PushSubs");
  const subs = [];
  for await (const e of client.listEntities({
    queryOptions: { filter: `PartitionKey eq '${p.userId}' and enabled eq true` }
  })) subs.push(e);

  if (!subs.length) { context.res = { status: 404, body: { error: "no subscriptions" } }; return; }

  const payload = JSON.stringify({ title: "ADHD Cleaning App", body: "Test push ✅", url: "/" });

  let sent = 0, removed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent++;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await client.deleteEntity(s.partitionKey, s.rowKey);
        removed++;
      }
    }
  }

  context.res = { body: { ok: true, sent, removed } };
};
