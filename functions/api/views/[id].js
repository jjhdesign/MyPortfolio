export async function onRequestGet({ params, env }) {
  const views = Number(await env.VIEWS.get(params.id)) || 0;
  return Response.json({ views });
}

export async function onRequestPost({ params, env }) {
  const current = Number(await env.VIEWS.get(params.id)) || 0;
  const views = current + 1;
  await env.VIEWS.put(params.id, String(views));
  return Response.json({ views });
}
