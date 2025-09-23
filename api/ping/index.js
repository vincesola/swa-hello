module.exports = async function (context, req) {
  context.res = { headers: { "Content-Type": "application/json" }, body: { ok: true, when: new Date().toISOString() } };
};
