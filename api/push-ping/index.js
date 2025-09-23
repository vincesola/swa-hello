module.exports = async function (context, req) {
  context.res = {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, ts: new Date().toISOString() })
  };
};