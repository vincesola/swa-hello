module.exports = async function (context, req) {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
  context.res = {
    status: vapidPublicKey ? 200 : 500,
    headers: { "Content-Type": "application/json" },
    body: { vapidPublicKey }
  };
};
