// Cloudflare Pages Function: GET /api/farmers/search
// Runs on Cloudflare Edge runtime with sub-10ms response time
// Supports Cloudflare D1 Database binding (env.DB)

function normalizeHindi(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFC')
        .toLowerCase()
        .replace(/[\u200b\u200c\u200d\u200e\u200f\ufeff\u00a0]/g, '')
        .replace(/[\u0901]/g, '\u0902')
        .replace(/न्(?=[क-ह])/g, 'ं')
        .replace(/म्(?=[प-म])/g, 'ं')
        .replace(/[\u093c]/g, '')
        .replace(/[,\-_.\/\\()]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const district = url.searchParams.get('district') || 'bastar';
    const center = url.searchParams.get('center') || 'ALL';
    const rawQ = (url.searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
    };

    const t0 = Date.now();

    // 1. Cloudflare D1 Serverless Database Query
    if (env && env.DB) {
        try {
            const hasCenter = center !== 'ALL' && !isNaN(parseInt(center, 10));
            const centerSr = hasCenter ? parseInt(center, 10) : null;

            let querySql = "";
            let countSql = "";
            let params = [];
            let countParams = [];

            if (rawQ) {
                const normQ = normalizeHindi(rawQ);
                const compactQ = normQ.replace(/\s+/g, '');
                const likePattern = `%${normQ}%`;
                const likeCompact = `%${compactQ}%`;
                const codeLike = `%${rawQ.toLowerCase()}%`;

                if (hasCenter) {
                    querySql = `
                        SELECT kramank, code, name, father, total_paddy as totalPaddy, first_date as firstDate, transactions, samiti, upkendra, center_sr as centerSr
                        FROM farmers
                        WHERE district_key = ? AND center_sr = ? AND (search_text LIKE ? OR search_text LIKE ? OR code LIKE ?)
                        LIMIT ? OFFSET ?
                    `;
                    params = [district, centerSr, likePattern, likeCompact, codeLike, limit, offset];

                    countSql = `
                        SELECT COUNT(*) as cnt
                        FROM farmers
                        WHERE district_key = ? AND center_sr = ? AND (search_text LIKE ? OR search_text LIKE ? OR code LIKE ?)
                    `;
                    countParams = [district, centerSr, likePattern, likeCompact, codeLike];
                } else {
                    querySql = `
                        SELECT kramank, code, name, father, total_paddy as totalPaddy, first_date as firstDate, transactions, samiti, upkendra, center_sr as centerSr
                        FROM farmers
                        WHERE district_key = ? AND (search_text LIKE ? OR search_text LIKE ? OR code LIKE ?)
                        LIMIT ? OFFSET ?
                    `;
                    params = [district, likePattern, likeCompact, codeLike, limit, offset];

                    countSql = `
                        SELECT COUNT(*) as cnt
                        FROM farmers
                        WHERE district_key = ? AND (search_text LIKE ? OR search_text LIKE ? OR code LIKE ?)
                    `;
                    countParams = [district, likePattern, likeCompact, codeLike];
                }
            } else {
                if (hasCenter) {
                    querySql = `
                        SELECT kramank, code, name, father, total_paddy as totalPaddy, first_date as firstDate, transactions, samiti, upkendra, center_sr as centerSr
                        FROM farmers
                        WHERE district_key = ? AND center_sr = ?
                        LIMIT ? OFFSET ?
                    `;
                    params = [district, centerSr, limit, offset];

                    countSql = `
                        SELECT COUNT(*) as cnt
                        FROM farmers
                        WHERE district_key = ? AND center_sr = ?
                    `;
                    countParams = [district, centerSr];
                } else {
                    querySql = `
                        SELECT kramank, code, name, father, total_paddy as totalPaddy, first_date as firstDate, transactions, samiti, upkendra, center_sr as centerSr
                        FROM farmers
                        WHERE district_key = ?
                        LIMIT ? OFFSET ?
                    `;
                    params = [district, limit, offset];

                    countSql = `
                        SELECT total_farmers as cnt
                        FROM districts
                        WHERE key = ?
                    `;
                    countParams = [district];
                }
            }

            const { results } = await env.DB.prepare(querySql).bind(...params).all();
            const countResult = await env.DB.prepare(countSql).bind(...countParams).first();
            const total = countResult ? (countResult.cnt || 0) : 0;
            const queryTimeMs = Date.now() - t0;

            return new Response(JSON.stringify({
                success: true,
                district,
                center,
                page,
                pageSize: limit,
                total,
                queryTimeMs,
                farmers: results || []
            }), { headers });
        } catch (e) {
            console.error("D1 farmers search error:", e);
            return new Response(JSON.stringify({ success: false, error: e.message }), { headers, status: 500 });
        }
    }

    // Fallback if D1 is not connected yet
    return new Response(JSON.stringify({
        success: true,
        district,
        center,
        page,
        pageSize: limit,
        total: 0,
        queryTimeMs: Date.now() - t0,
        farmers: []
    }), { headers });
}
