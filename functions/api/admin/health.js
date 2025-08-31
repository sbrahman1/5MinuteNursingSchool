export async function onRequest({ env }) {
  const out = { ok: true, checks: {} };

  // ADMIN_TOKEN present?
  out.checks.ADMIN_TOKEN = typeof env.ADMIN_TOKEN === "string" && env.ADMIN_TOKEN.length > 0;

  // D1 check: can we PRAGMA the posts table?
  try {
    const info = await env.DB.prepare("PRAGMA table_info(posts);").all();
    out.checks.D1_connected = true;
    out.checks.posts_table_columns = info.results || [];
  } catch (e) {
    out.checks.D1_connected = false;
    out.checks.D1_error = String(e);
  }

  // R2 check: can we head a non-existing key without crashing?
  try {
    await env.BUCKET.head("__nonexistent__");
    out.checks.R2_connected = true;
  } catch (e) {
    out.checks.R2_connected = false;
    out.checks.R2_error = String(e);
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
