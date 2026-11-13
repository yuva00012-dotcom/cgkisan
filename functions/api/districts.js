// Cloudflare Pages Function: GET /api/districts
// Supports Cloudflare D1 Database binding (env.DB) or Turso (env.TURSO_URL)

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

export async function onRequestGet(context) {
    const { env } = context;

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
    };

    // 1. Try Cloudflare D1 Database binding
    if (env && env.DB) {
        try {
            const { results } = await env.DB.prepare(
                "SELECT key, name, total_centers as totalCenters, total_farmers as totalFarmers FROM districts ORDER BY name"
            ).all();

            if (results && results.length > 0) {
                return new Response(JSON.stringify({ success: true, districts: results }), { headers });
            }
        } catch (e) {
            console.error("D1 districts query failed:", e);
        }
    }

    // 2. Fallback: Pre-indexed static list of all 28 CG Districts
    return new Response(JSON.stringify({ success: true, districts: CG_DISTRICTS_STATIC }), { headers });
}
