// Cloudflare Worker for CG Kisan Portal
// Serves static assets from public/ and provides API endpoints

const CG_DISTRICTS_STATIC = [
    { key: "balod", name: "बालोद (Balod)", totalCenters: 138, totalFarmers: 130679 },
    { key: "balodabazar", name: "बलौदाबाजार (Baloda Bazar)", totalCenters: 182, totalFarmers: 168471 },
    { key: "balrampur", name: "बलरामपुर (Balrampur)", totalCenters: 44, totalFarmers: 36835 },
    { key: "bastar", name: "बस्तर (Bastar)", totalCenters: 71, totalFarmers: 31047 },
    { key: "bemetara", name: "बेमेतरा (Bemetara)", totalCenters: 123, totalFarmers: 137005 },
    { key: "bilaspur", name: "बिलासपुर (Bilaspur)", totalCenters: 139, totalFarmers: 110102 },
    { key: "dhamtari", name: "धमतरी (Dhamtari)", totalCenters: 99, totalFarmers: 112227 },
    { key: "durg", name: "दुर्ग (Durg)", totalCenters: 102, totalFarmers: 95699 },
    { key: "gariaband", name: "गरियाबंद (Gariaband)", totalCenters: 82, totalFarmers: 73006 },
    { key: "gpm", name: "गौरेला पेन्ड्रा मरवाही (GPM)", totalCenters: 26, totalFarmers: 13976 },
    { key: "janjgir", name: "जांजगीर-चांपा (Janjgir-Champa)", totalCenters: 198, totalFarmers: 190898 },
    { key: "jashpur", name: "जशपुर (Jashpur)", totalCenters: 38, totalFarmers: 23772 },
    { key: "kanker", name: "कांकेर (Kanker)", totalCenters: 137, totalFarmers: 77948 },
    { key: "kawardha", name: "कबीरधाम - कवर्धा (Kabirdham)", totalCenters: 104, totalFarmers: 102085 },
    { key: "kondagaon", name: "कोंडागांव (Kondagaon)", totalCenters: 67, totalFarmers: 34753 },
    { key: "korba", name: "कोरबा (Korba)", totalCenters: 58, totalFarmers: 34077 },
    { key: "koriya", name: "कोरिया (Koriya)", totalCenters: 37, totalFarmers: 28304 },
    { key: "mahasamund", name: "महासमुंद (Mahasamund)", totalCenters: 156, totalFarmers: 139691 },
    { key: "mungeli", name: "मुंगेली (Mungeli)", totalCenters: 97, totalFarmers: 87872 },
    { key: "raigarh", name: "रायगढ़ (Raigarh)", totalCenters: 142, totalFarmers: 108117 },
    { key: "raipur", name: "रायपुर (Raipur)", totalCenters: 146, totalFarmers: 122290 },
    { key: "rajnandgaon", name: "राजनांदगांव (Rajnandgaon)", totalCenters: 189, totalFarmers: 196035 },
    { key: "sarguja", name: "सरगुजा (Sarguja)", totalCenters: 51, totalFarmers: 41467 },
    { key: "sukma", name: "सुकमा (Sukma)", totalCenters: 22, totalFarmers: 10481 },
    { key: "surajpur", name: "सूरजपुर (Surajpur)", totalCenters: 62, totalFarmers: 47331 },
    { key: "bijapur", name: "बीजापुर (Bijapur)", totalCenters: 24, totalFarmers: 13061 },
    { key: "narayanpur", name: "नारायणपुर (Narayanpur)", totalCenters: 14, totalFarmers: 5314 },
    { key: "dantewada", name: "दंतेवाड़ा (Dantewada)", totalCenters: 14, totalFarmers: 4935 }
];

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

function jsonResponse(data, status = 200, cacheSec = 0) {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (cacheSec > 0) {
        headers['Cache-Control'] = `public, max-age=${cacheSec}`;
    } else {
        headers['Cache-Control'] = 'no-store';
    }
    return new Response(JSON.stringify(data), { status, headers });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // ==========================================
        // API 1: /api/districts
        // ==========================================
        if (url.pathname === '/api/districts') {
            if (env && env.DB) {
                try {
                    const { results } = await env.DB.prepare(
                        "SELECT key, name, total_centers as totalCenters, total_farmers as totalFarmers FROM districts ORDER BY name"
                    ).all();
                    if (results && results.length > 0) {
                        return jsonResponse({ success: true, districts: results }, 200, 86400);
                    }
                } catch (e) {
                    console.error("D1 districts query error:", e);
                }
            }
            return jsonResponse({ success: true, districts: CG_DISTRICTS_STATIC }, 200, 86400);
        }

        // ==========================================
        // API 2: /api/centers
        // ==========================================
        if (url.pathname === '/api/centers') {
            const district = url.searchParams.get('district') || 'bastar';
            if (env && env.DB) {
                try {
                    const { results } = await env.DB.prepare(
                        "SELECT sr, samiti, upkendra, total_farmers as totalFarmers FROM centers WHERE district_key = ? ORDER BY sr"
                    ).bind(district).all();
                    return jsonResponse({ success: true, district, centers: results || [] }, 200, 3600);
                } catch (e) {
                    console.error("D1 centers query error:", e);
                }
            }
            return jsonResponse({ success: true, district, centers: [] }, 200);
        }

        // ==========================================
        // API 3: /api/farmers/search
        // ==========================================
        if (url.pathname === '/api/farmers/search') {
            const district = url.searchParams.get('district') || 'bastar';
            const center = url.searchParams.get('center') || 'ALL';
            const rawQ = (url.searchParams.get('q') || '').trim();
            const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
            const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '50', 10)));
            const offset = (page - 1) * limit;
            const t0 = Date.now();

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

                    return jsonResponse({
                        success: true,
                        district,
                        center,
                        page,
                        pageSize: limit,
                        total,
                        queryTimeMs: Date.now() - t0,
                        farmers: results || []
                    });
                } catch (e) {
                    console.error("D1 search error:", e);
                    return jsonResponse({ success: false, error: e.message }, 500);
                }
            }

            return jsonResponse({
                success: true,
                district,
                center,
                page,
                pageSize: limit,
                total: 0,
                queryTimeMs: Date.now() - t0,
                farmers: []
            });
        }

        // ==========================================
        // Static assets fallback (HTML, CSS, JS, etc.)
        // ==========================================
        if (env && env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response("Not Found", { status: 404 });
    }
};
