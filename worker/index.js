const ALLOWED_W = new Set(['160', '400', '600']);

const imgHeaders = (ct) => ({
  'Content-Type': ct,
  'Cache-Control': 'public, max-age=604800, immutable',
  'Cross-Origin-Resource-Policy': 'cross-origin',
});

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    const url = new URL(request.url);
    const id = url.pathname.slice(1);
    const w = url.searchParams.get('w') || '400';
    if (!/^[\w-]{20,}$/.test(id) || !ALLOWED_W.has(w)) {
      return new Response('Bad request', { status: 400 });
    }

    const cacheKey = new Request(`${url.origin}/${id}?w=${w}`);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const r2Key = `${id}_w${w}`;
    if (env.IMG) {
      const obj = await env.IMG.get(r2Key);
      if (obj) {
        const res = new Response(obj.body, { headers: imgHeaders(obj.httpMetadata?.contentType || 'image/jpeg') });
        ctx.waitUntil(caches.default.put(cacheKey, res.clone()));
        return res;
      }
    }

    const up = await fetch(`https://lh3.googleusercontent.com/d/${id}=w${w}`, { redirect: 'follow' });
    const ct = up.headers.get('content-type') || '';
    if (!up.ok || !ct.startsWith('image/')) {
      return new Response('Upstream error', { status: up.status === 429 ? 429 : 502 });
    }

    const buf = await up.arrayBuffer();
    const out = new Response(buf, { headers: imgHeaders(ct) });
    ctx.waitUntil(Promise.all([
      caches.default.put(cacheKey, out.clone()),
      env.IMG?.put(r2Key, buf, { httpMetadata: { contentType: ct } }),
    ]));
    return out;
  },
};
