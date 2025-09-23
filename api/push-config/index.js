module.exports = async function (context, req) {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!vapidPublicKey) {
    context.log.error("Missing VAPID_PUBLIC_KEY");
  }
  context.res = {
    status: vapidPublicKey ? 200 : 500,
    headers: { "Content-Type": "application/json" },
    body: { vapidPublicKey, ok: !!vapidPublicKey }
  };
};
