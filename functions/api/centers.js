// Cloudflare Pages Function: GET /api/centers?district=...
// Supports Cloudflare D1 Database binding (env.DB)

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const district = url.searchParams.get('district') || 'bastar';

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
    };

    // 1. Try Cloudflare D1 Database
    if (env && env.DB) {
        try {
            const { results } = await env.DB.prepare(
                "SELECT sr, samiti, upkendra, total_farmers as totalFarmers FROM centers WHERE district_key = ? ORDER BY sr"
            ).bind(district).all();

            return new Response(JSON.stringify({ success: true, district, centers: results || [] }), { headers });
        } catch (e) {
            console.error("D1 centers query error:", e);
        }
    }

    // 2. Fallback empty array
    return new Response(JSON.stringify({ success: true, district, centers: [] }), { headers });
}
