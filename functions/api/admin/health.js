// functions/api/admin/health.js
export function onRequest() {
  return new Response(JSON.stringify({ ok: true, route: "/api/admin/health" }), {
    headers: { "Content-Type": "application/json" },
  });
}
