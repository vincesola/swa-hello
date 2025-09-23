const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
  const result = {
    env: {
      VAPID_PUBLIC_KEY: !!process.env.VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
      TABLES_CONNECTION_STRING: !!process.env.TABLES_CONNECTION_STRING
    },
    tables: { canConnect: false, canList: false, error: null },
    timeUtc: new Date().toISOString()
  };

  // Do not log secrets. Only booleans above.
  try {
    if (!process.env.TABLES_CONNECTION_STRING) {
      throw new Error("TABLES_CONNECTION_STRING not set");
    }

    const client = TableClient.fromConnectionString(
      process.env.TABLES_CONNECTION_STRING,
      "PushSubs"
    );

    // Touch the service (creates table if missing returns 204/409)
    await client.createTable({ onResponse: () => {} }).catch(() => {});
    result.tables.canConnect = true;

    // Try reading a single entity (works even if empty)
    const iter = client.listEntities({ queryOptions: { top: 1 } });
    // Force first move-next to surface auth/connection errors
    // eslint-disable-next-line no-unused-vars
    for await (const _ of iter) { break; }
    result.tables.canList = true;

  } catch (e) {
    result.tables.error = e?.message || String(e);
    context.log.error("DIAG TABLES ERROR:", e);
  }

  context.res = { headers: { "Content-Type": "application/json" }, body: result };
};
