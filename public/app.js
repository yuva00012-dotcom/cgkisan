/**
 * Kisan - Tunhar Token Web Portal
 * Interactive Logic, Storage & Calculations
 */

// 1. Mock Farmer Records (Matching CG Paddy Procurement Database)
const FARMER_DB = {
    "TF4400590100836": {
        code: "TF4400590100836",
        name: "रामेश्वर साहू",
        father: "स्व. चैतराम साहू",
        mobile: "9826144321",
        district: "रायपुर (Raipur)",
        block: "आरंग (Arang)",
        samiti: "रसौटा (समिति कोड: 440059)",
        samitiCode: "440059",
        areaHectare: 2.5000,
        areaAcre: 6.177,
        totalPaddy: 130.00, // at ~21 quintal/acre
        soldPaddy: 0.00,
        bankName: "छत्तीसगढ़ राज्य ग्रामीण बैंक",
        accountNo: "******4910",
        ifsc: "CRGB0001044",
        category: "अन्य पिछड़ा वर्ग (OBC)"
    },
    "TF2200840201124": {
        code: "TF2200840201124",
        name: "सुनीता देवी वर्मा",
        father: "रमेश कुमार वर्मा",
        mobile: "9425287654",
        district: "दुर्ग (Durg)",
        block: "पाटन (Patan)",
        samiti: "जामगांव (समिति कोड: 220084)",
        samitiCode: "220084",
        areaHectare: 1.8000,
        areaAcre: 4.447,
        totalPaddy: 93.50,
        soldPaddy: 30.00,
        bankName: "जिला सहकारी केंद्रीय बैंक मर्यादित",
        accountNo: "******8821",
        ifsc: "CBIN0280812",
        category: "सामान्य (General)"
    }
};

// Initial Token Storage in LocalStorage or memory
let tokenRegistry = JSON.parse(localStorage.getItem('kisan_tokens')) || {
    "TK-2026-440059-0082": {
        tokenId: "TK-2026-440059-0082",
        farmerCode: "TF4400590100836",
        farmerName: "रामेश्वर साहू",
        fatherName: "स्व. चैतराम साहू",
        mobile: "9826144321",
        district: "रायपुर (Raipur)",
        block: "आरंग (Arang)",
        samiti: "रसौटा (समिति कोड: 440059)",
        date: "16-11-2026 (सोमवार)",
        quantity: 40.00,
        bags: 100,
        vehicle: "ट्रैक्टर (Tractor)",
        status: "सक्रिय (CONFIRMED)",
        issueTime: "12-11-2026 18:45"
    }
};

let currentSelectedFarmer = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    setupEventListeners();
    calculatePaddy(); // run initial calculation for calculator tab
    initFarmerCodeSearch(); // Initialize Bastar Farmer Search Engine
    initWeatherGuard(); // Initialize 🌦️ Paddy Weather Guard
    initFormsAndSchemes(); // Initialize 📑 Forms, Grievance, Solar & Kisan ID Card
});

// 2. Navigation Tabs
function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const activePane = document.getElementById(`tab-${tabId}`);

    if (activeTab && activePane) {
        activeTab.classList.add('active');
        activePane.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 3. Setup Event Handlers
function setupEventListeners() {
    // Check Status
    const btnStatus = document.getElementById('btn-check-status');
    if (btnStatus) {
        btnStatus.addEventListener('click', handleStatusSearch);
    }
}

// 4. Search & Display Status
function handleStatusSearch() {
    const query = document.getElementById('status-query-input').value.trim();
    if (!query) {
        showToast("कृपया टोकन नंबर या किसान कोड दर्ज करें!", "warning");
        return;
    }

    // Search by Token ID or Farmer Code
    let foundToken = tokenRegistry[query];

    if (!foundToken) {
        // Search by farmer code
        for (const tid in tokenRegistry) {
            if (tokenRegistry[tid].farmerCode.toLowerCase() === query.toLowerCase()) {
                foundToken = tokenRegistry[tid];
                break;
            }
        }
    }

    if (foundToken) {
        displayReceipt(foundToken);
        showToast("टोकन रिकॉर्ड मिल गया!", "success");
    } else {
        showToast("दिए गए विवरण से कोई टोकन प्राप्त नहीं हुआ।", "danger");
    }
}

function displayReceipt(token) {
    document.getElementById('slip-token-id').textContent = token.tokenId;
    document.getElementById('slip-issue-time').textContent = token.issueTime;
    document.getElementById('slip-fcode').textContent = token.farmerCode;
    document.getElementById('slip-fname').textContent = token.farmerName;
    document.getElementById('slip-ffather').textContent = token.fatherName || "श्री कृषक";
    document.getElementById('slip-fmobile').textContent = token.mobile;
    document.getElementById('slip-fdistrict').textContent = token.district;
    document.getElementById('slip-fblock').textContent = token.block;
    document.getElementById('slip-fsamiti').textContent = token.samiti;
    document.getElementById('slip-fdate').innerHTML = `<strong>${token.date}</strong>`;
    document.getElementById('slip-fqty').innerHTML = `<strong>${token.quantity.toFixed(2)} क्विंटल (${token.bags} बोरे)</strong>`;
    document.getElementById('slip-fvehicle').textContent = token.vehicle || "ट्रैक्टर";

    const badge = document.getElementById('slip-status-badge');
    badge.textContent = token.status;
    if (token.status.includes("निरस्त") || token.status.includes("CANCELLED")) {
        badge.className = "status-active text-danger";
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
    } else {
        badge.className = "status-active";
        badge.style.background = "#22c55e";
        badge.style.color = "#052e16";
    }

    document.getElementById('status-query-input').value = token.tokenId;
}

// 5. Calculator Functionality
function calculatePaddy() {
    const unitRadios = document.getElementsByName('calc-unit');
    let selectedUnit = 'acre';
    for (const r of unitRadios) {
        if (r.checked) selectedUnit = r.value;
    }

    const areaInput = parseFloat(document.getElementById('calc-area-input').value) || 0;
    const convertedLabel = document.getElementById('calc-converted-unit');

    let areaInAcre = 0;
    if (selectedUnit === 'acre') {
        areaInAcre = areaInput;
        const hectare = areaInput * 0.404686;
        convertedLabel.textContent = `${areaInput.toFixed(2)} एकड़ = ${hectare.toFixed(4)} हेक्टेयर`;
    } else {
        areaInAcre = areaInput * 2.47105;
        convertedLabel.textContent = `${areaInput.toFixed(2)} हेक्टेयर = ${areaInAcre.toFixed(2)} एकड़`;
    }

    // 21 Quintal per Acre (CG Govt policy)
    const ratePerAcre = 21.0;
    const totalQuintals = areaInAcre * ratePerAcre;
    const totalBags = Math.round((totalQuintals * 100) / 40); // 40kg bag standard

    // Recommended Tokens (max 40-50 quintals per tractor trip)
    let tokensCount = "1 टोकन";
    if (totalQuintals > 120) {
        tokensCount = "3 से 4 टोकन";
    } else if (totalQuintals > 60) {
        tokensCount = "2 से 3 टोकन";
    } else if (totalQuintals > 30) {
        tokensCount = "1 से 2 टोकन";
    }

    // Total Amount at ₹3100 per quintal
    const mspPrice = 3100;
    const totalAmount = Math.round(totalQuintals * mspPrice);

    // Update Output
    document.getElementById('res-total-quintal').textContent = `${totalQuintals.toFixed(2)} क्विंटल`;
    document.getElementById('res-total-bags').textContent = `${totalBags.toLocaleString('en-IN')} बोरे (लगभग)`;
    document.getElementById('res-recommended-tokens').textContent = tokensCount;
    document.getElementById('res-total-amount').textContent = `₹ ${totalAmount.toLocaleString('en-IN')}`;
}

// 10. Print & PDF helper
function printReceipt() {
    window.print();
}

function downloadSlipPDF() {
    showToast("प्रिंट डायलॉग खुल रहा है - गंतव्य (Destination) में 'Save as PDF' चुनें।", "info");
    setTimeout(() => {
        window.print();
    }, 600);
}

// 11. Toast Notifications
function showToast(message, type = "info") {
    const toast = document.getElementById('toast');
    if (!toast) return;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "warning") icon = "fa-triangle-exclamation";
    if (type === "danger") icon = "fa-circle-xmark";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toast.className = `toast-notification show ${type}`;

    setTimeout(() => {
        toast.className = 'toast-notification';
    }, 3800);
}

// ===================================================
// 12. MULTI-DISTRICT KISAN CODE & SERIAL NO. SEARCH
// ===================================================

let fcAllDistricts = null;
let fcCurrentDistrictKey = 'bastar';
let fcFarmerData = null;
let fcAllFarmersFlat = [];
let fcCurrentMatches = [];
let fcCurrentPage = 1;
const FC_PAGE_SIZE = 50;
let fcSearchDebounceTimer = null;
let fcBackendMode = false;
let fcBackendTotal = 0;
let fcSearchAbortController = null;
let fcDistrictsList = [];

async function initFarmerCodeSearch() {
    const districtSelect = document.getElementById('fc-district');
    const centerSelect = document.getElementById('fc-center');
    const searchInput = document.getElementById('fc-search-input');
    const btnClear = document.getElementById('fc-btn-clear');
    const btnSearch = document.getElementById('fc-btn-search');
    const btnPrev = document.getElementById('fc-btn-prev');
    const btnNext = document.getElementById('fc-btn-next');

    // 1. Detect if Backend API is active
    try {
        const resp = await fetch('/api/districts');
        if (resp.ok) {
            const data = await resp.json();
            if (data.success && Array.isArray(data.districts)) {
                fcBackendMode = true;
                fcDistrictsList = data.districts;
                console.log("🔒 Secured Backend API Connected! Total Districts in DB:", data.districts.length);
            }
        }
    } catch (e) {
        fcBackendMode = false;
    }

    if (fcBackendMode) {
        // BACKEND MODE: Fast SQLite Edge/Node API
        fcCurrentDistrictKey = districtSelect ? districtSelect.value : 'bastar';
        await loadDistrictCentersBackend(fcCurrentDistrictKey);

        if (districtSelect) {
            districtSelect.addEventListener('change', async () => {
                fcCurrentDistrictKey = districtSelect.value;
                fcCurrentPage = 1;
                if (searchInput) searchInput.value = '';
                if (btnClear) btnClear.style.display = 'none';
                await loadDistrictCentersBackend(fcCurrentDistrictKey);
                filterFarmerData();
            });
        }
    } else {
        // FALLBACK OFFLINE MODE (Only if server is not running)
        if (window.CG_KISAN_DATA) {
            fcAllDistricts = window.CG_KISAN_DATA;
        } else if (window.BASTAR_FARMER_DATA) {
            fcAllDistricts = { 'bastar': window.BASTAR_FARMER_DATA };
        }

        if (fcAllDistricts) {
            fcCurrentDistrictKey = districtSelect ? districtSelect.value : 'bastar';
            loadDistrictDataOffline(fcCurrentDistrictKey);

            if (districtSelect) {
                districtSelect.addEventListener('change', () => {
                    fcCurrentDistrictKey = districtSelect.value;
                    loadDistrictDataOffline(fcCurrentDistrictKey);
                    if (searchInput) searchInput.value = '';
                    if (btnClear) btnClear.style.display = 'none';
                    filterFarmerData();
                });
            }
        }
    }

    // Search input event handlers
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (btnClear) {
                btnClear.style.display = searchInput.value.trim() ? 'block' : 'none';
            }
            clearTimeout(fcSearchDebounceTimer);
            fcSearchDebounceTimer = setTimeout(() => {
                fcCurrentPage = 1;
                filterFarmerData();
            }, 120);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fcCurrentPage = 1;
                filterFarmerData();
            }
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            searchInput.value = '';
            btnClear.style.display = 'none';
            searchInput.focus();
            fcCurrentPage = 1;
            filterFarmerData();
        });
    }

    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            fcCurrentPage = 1;
            filterFarmerData();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (fcCurrentPage > 1) {
                fcCurrentPage--;
                if (fcBackendMode) {
                    filterFarmerData();
                } else {
                    renderFarmerTableOffline();
                }
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const maxPage = fcBackendMode
                ? (Math.ceil(fcBackendTotal / FC_PAGE_SIZE) || 1)
                : (Math.ceil(fcCurrentMatches.length / FC_PAGE_SIZE) || 1);
            if (fcCurrentPage < maxPage) {
                fcCurrentPage++;
                if (fcBackendMode) {
                    filterFarmerData();
                } else {
                    renderFarmerTableOffline();
                }
            }
        });
    }

    // Initial render
    filterFarmerData();
}

// Load Centers from Backend API
async function loadDistrictCentersBackend(districtKey) {
    const badgeDistrict = document.getElementById('fc-badge-district');
    const centerSelect = document.getElementById('fc-center');

    try {
        const resp = await fetch(`/api/centers?district=${encodeURIComponent(districtKey)}`);
        if (!resp.ok) throw new Error("Centers fetch failed");
        const data = await resp.json();
        const centers = data.centers || [];

        const currentDistObj = fcDistrictsList.find(d => d.key === districtKey);
        const distDisplayName = currentDistObj ? currentDistObj.name : districtKey;

        if (badgeDistrict) {
            badgeDistrict.innerHTML = `<i class="fa-solid fa-location-dot"></i> जिला: ${distDisplayName} <span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 2px 7px; border-radius: 999px; margin-left: 6px;"><i class="fa-solid fa-shield-halved"></i> सुरक्षित सर्वर</span>`;
        }

        if (centerSelect) {
            centerSelect.innerHTML = `<option value="ALL">-- सभी ${centers.length} उपार्जन केंद्र (समस्त ${distDisplayName}) --</option>`;
            centers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = String(c.sr);
                const count = c.totalFarmers || 0;
                opt.textContent = `${c.upkendra} (समिति: ${c.samiti}) - [${count.toLocaleString('en-IN')} किसान]`;
                centerSelect.appendChild(opt);
            });

            centerSelect.onchange = () => {
                fcCurrentPage = 1;
                filterFarmerData();
            };
        }
    } catch (e) {
        console.error("Error loading centers from backend:", e);
    }
}

// Unicode Hindi & English Search Normalizer
function normalizeHindiSearch(str) {
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

// Offline Mode: Load District Data
function loadDistrictDataOffline(districtKey) {
    if (!fcAllDistricts) return;
    fcFarmerData = fcAllDistricts[districtKey] || fcAllDistricts['bastar'];
    if (!fcFarmerData) return;

    const badgeDistrict = document.getElementById('fc-badge-district');
    if (badgeDistrict) {
        badgeDistrict.innerHTML = `<i class="fa-solid fa-location-dot"></i> जिला: ${fcFarmerData.district}`;
    }

    fcAllFarmersFlat = [];
    if (fcFarmerData.centers) {
        fcFarmerData.centers.forEach(c => {
            const upkNorm = normalizeHindiSearch(c.upkendra);
            const socNorm = normalizeHindiSearch(c.samiti);
            
            c.farmers.forEach(f => {
                f.samiti = c.samiti;
                f.upkendra = c.upkendra;
                f.centerSr = c.sr;
                f.totalPaddy = f.totalPaddy || '0.00';
                f.firstDate = f.firstDate || '';
                f.kramank = f.kramank ? String(f.kramank) : '-';

                const nameNorm = normalizeHindiSearch(f.name);
                const fatherNorm = normalizeHindiSearch(f.father);
                const nameCompact = nameNorm.replace(/\s+/g, '');
                const fatherCompact = fatherNorm.replace(/\s+/g, '');
                const codeLower = (f.code || '').toLowerCase();

                f._search = `${nameNorm} ${nameCompact} ${fatherNorm} ${fatherCompact} ${codeLower} ${f.kramank} ${upkNorm} ${socNorm}`;
                fcAllFarmersFlat.push(f);
            });
        });
    }

    const centerSelect = document.getElementById('fc-center');
    if (centerSelect && fcFarmerData.centers) {
        centerSelect.innerHTML = `<option value="ALL">-- सभी ${fcFarmerData.totalCenters} उपार्जन केंद्र --</option>`;
        fcFarmerData.centers.forEach(c => {
            const opt = document.createElement('option');
            opt.value = String(c.sr);
            const count = c.totalFarmers || c.farmerCount || (c.farmers ? c.farmers.length : 0);
            opt.textContent = `${c.upkendra} (समिति: ${c.samiti}) - [${count.toLocaleString('en-IN')} किसान]`;
            centerSelect.appendChild(opt);
        });

        centerSelect.onchange = () => {
            fcCurrentPage = 1;
            filterFarmerData();
        };
    }
}

// Master Filter Function
async function filterFarmerData() {
    const centerSelect = document.getElementById('fc-center');
    const searchInput = document.getElementById('fc-search-input');
    const selectedCenterSr = centerSelect ? centerSelect.value : 'ALL';
    const rawQuery = searchInput ? searchInput.value.trim() : '';

    if (fcBackendMode) {
        await filterFarmerDataBackend(selectedCenterSr, rawQuery);
        return;
    }

    // Offline Filter Fallback
    filterFarmerDataOffline(selectedCenterSr, rawQuery);
}

// Backend Filter & Search
async function filterFarmerDataBackend(selectedCenterSr, rawQuery) {
    if (fcSearchAbortController) {
        fcSearchAbortController.abort();
    }
    fcSearchAbortController = new AbortController();

    const tbody = document.getElementById('fc-table-body');
    const matchCountEl = document.getElementById('fc-match-count');
    const filterHintEl = document.getElementById('fc-filter-hint');
    const pageInfo = document.getElementById('fc-page-info');

    // Smooth loading: Only collapse to spinner row if table is completely empty.
    // If records are already visible, gently dim them without collapsing height to prevent footer jumping!
    if (tbody) {
        if (!fcCurrentMatches || fcCurrentMatches.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><i class="fa-solid fa-spinner fa-spin"></i><h4>सुरक्षित खोज जारी है...</h4><p>डेटाबेस से खोज रहे हैं...</p></td></tr>`;
        } else {
            tbody.style.opacity = '0.4';
            tbody.style.transition = 'opacity 0.15s ease';
        }
    }

    try {
        const url = `/api/farmers/search?district=${encodeURIComponent(fcCurrentDistrictKey)}&center=${encodeURIComponent(selectedCenterSr)}&q=${encodeURIComponent(rawQuery)}&page=${fcCurrentPage}&limit=${FC_PAGE_SIZE}`;
        const resp = await fetch(url, { signal: fcSearchAbortController.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (tbody) {
            tbody.style.opacity = '1';
        }

        fcCurrentMatches = data.farmers || [];
        fcBackendTotal = data.total || 0;

        if (matchCountEl) matchCountEl.textContent = fcBackendTotal.toLocaleString('en-IN');
        if (filterHintEl) {
            const centerText = selectedCenterSr === 'ALL' ? 'समस्त उपकेंद्र' : `उपकेंद्र #${selectedCenterSr}`;
            filterHintEl.textContent = `(${centerText} • खोज समय: ${data.queryTimeMs}ms • 🔒 सुरक्षित)`;
        }

        renderFarmerTableBackend(data.page, data.pageSize, fcBackendTotal);
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("Backend search error:", e);
        if (tbody) {
            tbody.style.opacity = '1';
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h4>सर्च में समस्या</h4><p>${e.message}</p></td></tr>`;
        }
    }
}

// Offline Filter
function filterFarmerDataOffline(selectedCenterSr, rawQuery) {
    if (!fcFarmerData) return;

    let baseList = [];
    let filterHint = "";

    if (selectedCenterSr === 'ALL') {
        baseList = fcAllFarmersFlat;
        filterHint = `(समस्त ${fcFarmerData.totalCenters || ''} उपकेंद्र - ${fcFarmerData.district || ''})`;
    } else {
        const centerObj = (fcFarmerData.centers || []).find(c => String(c.sr) === selectedCenterSr);
        if (centerObj) {
            baseList = centerObj.farmers || [];
            filterHint = `(उपकेंद्र: ${centerObj.upkendra}, समिति: ${centerObj.samiti})`;
        }
    }

    if (!rawQuery) {
        fcCurrentMatches = baseList;
    } else {
        const normQuery = normalizeHindiSearch(rawQuery);
        const compactQuery = normQuery.replace(/\s+/g, '');
        const tokens = normQuery.split(/\s+/).filter(Boolean);
        const rawLower = rawQuery.toLowerCase();
        const isKramankOnly = /^\d+$/.test(rawQuery);

        const matches = [];
        const totalLen = baseList.length;

        for (let i = 0; i < totalLen; i++) {
            const f = baseList[i];
            if (f.kramank === rawQuery || (f.code && f.code.toLowerCase() === rawLower)) {
                matches.push(f);
                continue;
            }
            if (compactQuery && f._search && f._search.includes(compactQuery)) {
                matches.push(f);
                continue;
            }
            let allMatch = true;
            for (let t = 0; t < tokens.length; t++) {
                if (!f._search || !f._search.includes(tokens[t])) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) matches.push(f);
        }

        if (isKramankOnly) {
            matches.sort((a, b) => (a.kramank === rawQuery ? 0 : 1) - (b.kramank === rawQuery ? 0 : 1));
        }
        fcCurrentMatches = matches;
    }

    fcCurrentPage = 1;
    const matchCountEl = document.getElementById('fc-match-count');
    const filterHintEl = document.getElementById('fc-filter-hint');
    if (matchCountEl) matchCountEl.textContent = fcCurrentMatches.length.toLocaleString('en-IN');
    if (filterHintEl) filterHintEl.textContent = filterHint;

    renderFarmerTableOffline();
}

// Render Table Rows for Backend
function renderFarmerTableBackend(page, pageSize, totalMatches) {
    const tbody = document.getElementById('fc-table-body');
    const pageInfo = document.getElementById('fc-page-info');
    const btnPrev = document.getElementById('fc-btn-prev');
    const btnNext = document.getElementById('fc-btn-next');
    if (!tbody) return;

    if (fcCurrentMatches.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <h4>कोई किसान रिकॉर्ड नहीं मिला</h4>
                    <p>कृपया नाम की वर्तनी जांचें अथवा उपार्जन केंद्र बदल कर पुनः प्रयास करें।</p>
                </td>
            </tr>`;
        if (pageInfo) pageInfo.textContent = "0 परिणाम";
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        return;
    }

    const maxPage = Math.ceil(totalMatches / pageSize) || 1;
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + fcCurrentMatches.length, totalMatches);

    let rowsHtml = '';
    fcCurrentMatches.forEach(f => {
        const safeName = (f.name || '').replace(/'/g, "\\'");
        const safeFather = (f.father || '').replace(/'/g, "\\'");
        const safeSamiti = (f.samiti || '').replace(/'/g, "\\'");
        const safeUpkendra = (f.upkendra || '').replace(/'/g, "\\'");

        rowsHtml += `
            <tr>
                <td style="text-align: center;">
                    <span class="badge-kramank" title="सरकारी सूची क्रमांक">#${f.kramank || '-'}</span>
                </td>
                <td>
                    <div class="code-cell-wrap">
                        <span class="code-badge">${f.code || '-'}</span>
                        <button type="button" class="btn-action-copy" onclick="copyFarmerCode('${f.code}')" title="कोड कॉपी करें">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td><strong class="farmer-name-text">${f.name || '-'}</strong></td>
                <td><span class="father-name-text">${f.father || '-'}</span></td>
                <td><span class="center-badge">${f.upkendra || ''} (${f.samiti || ''})</span></td>
                <td><span class="paddy-text">${f.totalPaddy || '0.00'} क्विंटल</span></td>
                <td class="action-cell">
                    <button type="button" class="btn-action-copy" onclick="copyFarmerCode('${f.code}')" title="किसान कोड कॉपी करें">
                        <i class="fa-regular fa-copy"></i> कोड
                    </button>
                    <button type="button" class="btn-action-kisan-card" onclick="openKisanCard('${f.code}', '${safeName}', '${safeFather}', '${safeSamiti}', '${safeUpkendra}', '${f.totalPaddy}', '${f.kramank}')" title="डिजिटल किसान कार्ड देखें व प्रिंट करें">
                        <i class="fa-solid fa-id-card"></i> 🪪 कार्ड
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = rowsHtml;

    if (pageInfo) {
        pageInfo.textContent = `दिख रहे ${startIdx + 1} - ${endIdx} (कुल: ${totalMatches.toLocaleString('en-IN')}) | पृष्ठ ${page} / ${maxPage}`;
    }
    if (btnPrev) btnPrev.disabled = (page <= 1);
    if (btnNext) btnNext.disabled = (page >= maxPage);
}

// Render Table Rows for Offline
function renderFarmerTableOffline() {
    const tbody = document.getElementById('fc-table-body');
    const pageInfo = document.getElementById('fc-page-info');
    const btnPrev = document.getElementById('fc-btn-prev');
    const btnNext = document.getElementById('fc-btn-next');
    if (!tbody) return;

    if (fcCurrentMatches.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <h4>कोई किसान रिकॉर्ड नहीं मिला</h4>
                    <p>कृपया नाम की वर्तनी जांचें अथवा उपार्जन केंद्र बदल कर पुनः प्रयास करें।</p>
                </td>
            </tr>`;
        if (pageInfo) pageInfo.textContent = "0 परिणाम";
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        return;
    }

    const totalMatches = fcCurrentMatches.length;
    const maxPage = Math.ceil(totalMatches / FC_PAGE_SIZE) || 1;
    if (fcCurrentPage > maxPage) fcCurrentPage = maxPage;

    const startIdx = (fcCurrentPage - 1) * FC_PAGE_SIZE;
    const endIdx = Math.min(startIdx + FC_PAGE_SIZE, totalMatches);
    const pageSlice = fcCurrentMatches.slice(startIdx, endIdx);

    let rowsHtml = '';
    pageSlice.forEach(f => {
        const safeName = (f.name || '').replace(/'/g, "\\'");
        const safeFather = (f.father || '').replace(/'/g, "\\'");
        const safeSamiti = (f.samiti || '').replace(/'/g, "\\'");
        const safeUpkendra = (f.upkendra || '').replace(/'/g, "\\'");

        rowsHtml += `
            <tr>
                <td style="text-align: center;">
                    <span class="badge-kramank" title="सरकारी सूची क्रमांक">#${f.kramank}</span>
                </td>
                <td>
                    <div class="code-cell-wrap">
                        <span class="code-badge">${f.code}</span>
                        <button type="button" class="btn-action-copy" onclick="copyFarmerCode('${f.code}')" title="कोड कॉपी करें">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td><strong class="farmer-name-text">${f.name}</strong></td>
                <td><span class="father-name-text">${f.father}</span></td>
                <td><span class="center-badge">${f.upkendra} (${f.samiti})</span></td>
                <td><span class="paddy-text">${f.totalPaddy} क्विंटल</span></td>
                <td class="action-cell">
                    <button type="button" class="btn-action-copy" onclick="copyFarmerCode('${f.code}')" title="किसान कोड कॉपी करें">
                        <i class="fa-regular fa-copy"></i> कोड
                    </button>
                    <button type="button" class="btn-action-kisan-card" onclick="openKisanCard('${f.code}', '${safeName}', '${safeFather}', '${safeSamiti}', '${safeUpkendra}', '${f.totalPaddy}', '${f.kramank}')" title="डिजिटल किसान कार्ड देखें व प्रिंट करें">
                        <i class="fa-solid fa-id-card"></i> 🪪 कार्ड
                    </button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = rowsHtml;

    if (pageInfo) {
        pageInfo.textContent = `दिख रहे ${startIdx + 1} - ${endIdx} (कुल: ${totalMatches.toLocaleString('en-IN')}) | पृष्ठ ${fcCurrentPage} / ${maxPage}`;
    }
    if (btnPrev) btnPrev.disabled = (fcCurrentPage <= 1);
    if (btnNext) btnNext.disabled = (fcCurrentPage >= maxPage);
}

// 13. Copy Farmer Code to Clipboard
function copyFarmerCode(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showToast(`किसान कोड ${code} कॉपी हो गया!`, "success");
        }).catch(() => {
            fallbackCopy(code);
        });
    } else {
        fallbackCopy(code);
    }
}

function fallbackCopy(code) {
    const ta = document.createElement("textarea");
    ta.value = code;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(`किसान कोड ${code} कॉपी हो गया!`, "success");
}

// 14. Quick Example Search
function quickSearchCode(term) {
    const input = document.getElementById('fc-search-input');
    const clearBtn = document.getElementById('fc-btn-clear');
    if (input) {
        input.value = term;
        if (clearBtn) clearBtn.style.display = 'block';
        filterFarmerData();
    }
}

// ===================================================
// 🌦️ PADDY WEATHER GUARD (धान सुरक्षा व स्थानीय मौसम अलर्ट)
// ===================================================

const CG_DISTRICT_COORDS = {
    "balod": { name: "बालोद", fullName: "जिला: बालोद (Balod)", lat: 20.73, lon: 81.20 },
    "balodabazar": { name: "बलौदाबाजार", fullName: "जिला: बलौदाबाजार (Baloda Bazar)", lat: 21.66, lon: 82.16 },
    "balrampur": { name: "बलरामपुर", fullName: "जिला: बलरामपुर (Balrampur)", lat: 23.61, lon: 83.61 },
    "bastar": { name: "बस्तर", fullName: "जिला: बस्तर (Bastar - जगदलपुर)", lat: 19.07, lon: 82.03 },
    "bemetara": { name: "बेमेतरा", fullName: "जिला: बेमेतरा (Bemetara)", lat: 21.70, lon: 81.54 },
    "bilaspur": { name: "बिलासपुर", fullName: "जिला: बिलासपुर (Bilaspur)", lat: 22.08, lon: 82.14 },
    "dhamtari": { name: "धमतरी", fullName: "जिला: धमतरी (Dhamtari)", lat: 20.71, lon: 81.55 },
    "durg": { name: "दुर्ग", fullName: "जिला: दुर्ग (Durg)", lat: 21.19, lon: 81.28 },
    "gariaband": { name: "गरियाबंद", fullName: "जिला: गरियाबंद (Gariaband)", lat: 20.96, lon: 82.06 },
    "gpm": { name: "गौरेला-पेन्ड्रा-मरवाही", fullName: "जिला: गौरेला-पेन्ड्रा-मरवाही (GPM)", lat: 22.75, lon: 81.95 },
    "janjgir": { name: "जांजगीर-चांपा", fullName: "जिला: जांजगीर-चांपा (Janjgir-Champa)", lat: 22.01, lon: 82.57 },
    "jashpur": { name: "जशपुर", fullName: "जिला: जशपुर (Jashpur)", lat: 22.88, lon: 84.14 },
    "kanker": { name: "कांकेर", fullName: "जिला: कांकेर (Kanker)", lat: 20.27, lon: 81.49 },
    "kawardha": { name: "कबीरधाम (कवर्धा)", fullName: "जिला: कबीरधाम - कवर्धा (Kabirdham)", lat: 22.01, lon: 81.24 },
    "kondagaon": { name: "कोंडागांव", fullName: "जिला: कोंडागांव (Kondagaon)", lat: 19.60, lon: 81.67 },
    "korba": { name: "कोरबा", fullName: "जिला: कोरबा (Korba)", lat: 22.36, lon: 82.72 },
    "koriya": { name: "कोरिया", fullName: "जिला: कोरिया (Koriya - बैकुंठपुर)", lat: 23.26, lon: 82.55 },
    "mahasamund": { name: "महासमुंद", fullName: "जिला: महासमुंद (Mahasamund)", lat: 21.11, lon: 82.10 },
    "mungeli": { name: "मुंगेली", fullName: "जिला: मुंगेली (Mungeli)", lat: 22.07, lon: 81.69 },
    "raigarh": { name: "रायगढ़", fullName: "जिला: रायगढ़ (Raigarh)", lat: 21.90, lon: 83.40 },
    "raipur": { name: "रायपुर", fullName: "जिला: रायपुर (Raipur)", lat: 21.25, lon: 81.63 },
    "rajnandgaon": { name: "राजनांदगांव", fullName: "जिला: राजनांदगांव (Rajnandgaon)", lat: 21.10, lon: 81.03 },
    "sarguja": { name: "सरगुजा", fullName: "जिला: सरगुजा (Sarguja - अंबिकापुर)", lat: 23.12, lon: 83.19 },
    "sukma": { name: "सुकमा", fullName: "जिला: सुकमा (Sukma)", lat: 18.74, lon: 81.67 },
    "surajpur": { name: "सूरजपुर", fullName: "जिला: सूरजपुर (Surajpur)", lat: 23.22, lon: 82.86 },
    "bijapur": { name: "बीजापुर", fullName: "जिला: बीजापुर (Bijapur)", lat: 18.80, lon: 80.82 },
    "narayanpur": { name: "नारायणपुर", fullName: "जिला: नारायणपुर (Narayanpur)", lat: 19.72, lon: 81.25 },
    "dantewada": { name: "दंतेवाड़ा", fullName: "जिला: दंतेवाड़ा (Dantewada)", lat: 18.90, lon: 81.35 }
};

let wgDailyForecastData = null;
let wgCurrentLocationMode = "district"; // "district" | "gps"
let wgCurrentCoords = { lat: 19.07, lon: 82.03, label: "जिला: बस्तर (Bastar)" };

function decodeWeatherCode(code) {
    if (code === 0) return { text: "साफ आसमान (खिली धूप)", icon: "fa-solid fa-sun", color: "#f59e0b" };
    if ([1, 2, 3].includes(code)) return { text: "हल्के बादल (Partly Cloudy)", icon: "fa-solid fa-cloud-sun", color: "#64748b" };
    if ([45, 48].includes(code)) return { text: "कोहरा / धुंध (Fog)", icon: "fa-solid fa-smog", color: "#94a3b8" };
    if ([51, 53, 55].includes(code)) return { text: "हल्की बूंदाबांदी (Drizzle)", icon: "fa-solid fa-cloud-rain", color: "#0284c7" };
    if ([61, 63, 65].includes(code)) return { text: "मध्यम से तेज बारिश (Rain)", icon: "fa-solid fa-cloud-showers-heavy", color: "#2563eb" };
    if ([80, 81, 82].includes(code)) return { text: "गरज के साथ बौछारें (Showers)", icon: "fa-solid fa-cloud-showers-water", color: "#1d4ed8" };
    if ([95, 96, 99].includes(code)) return { text: "आंधी-तूफान व बिजली (Thunderstorm)", icon: "fa-solid fa-cloud-bolt", color: "#dc2626" };
    return { text: "सामान्य मौसम", icon: "fa-solid fa-cloud", color: "#64748b" };
}

// Calculate nearest Chhattisgarh district by distance (offline fallback)
function findNearestCGDistrict(lat, lon) {
    let nearest = null;
    let minDistance = Infinity;
    for (const key in CG_DISTRICT_COORDS) {
        const d = CG_DISTRICT_COORDS[key];
        const dist = Math.hypot(d.lat - lat, d.lon - lon);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = d;
        }
    }
    return nearest;
}

// Reverse geocode coordinates to human-readable Hindi village/town/city name
async function reverseGeocodeToPlaceName(lat, lon) {
    // 1. Primary: BigDataCloud Client Reverse Geocoding (Fast, Free, CORS, Hindi supported)
    try {
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=hi`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(bdcUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const locality = (data.locality || '').trim();
            const city = (data.city || '').trim();
            let district = '';

            if (data.localityInfo && Array.isArray(data.localityInfo.administrative)) {
                // Find district (adminLevel 5 or containing "जिला" or "District")
                const distItem = data.localityInfo.administrative.find(a => 
                    a.adminLevel === 5 || (a.name && (a.name.includes('जिला') || a.name.toLowerCase().includes('district')))
                );
                if (distItem && distItem.name) {
                    district = distItem.name.replace(/\s*जिला\s*/g, '').replace(/\s*District\s*/gi, '').trim();
                }
            }

            const primaryPlace = locality || city;
            if (primaryPlace && district && primaryPlace !== district) {
                return `${primaryPlace}, ${district}`;
            }
            if (primaryPlace) return primaryPlace;
            if (district) return district;
            if (data.principalSubdivision) return data.principalSubdivision;
        }
    } catch (e) {
        console.warn("BigDataCloud geocode failed, trying OSM Nominatim fallback:", e);
    }

    // 2. Secondary Fallback: OpenStreetMap Nominatim
    try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=hi,en`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(osmUrl, {
            headers: { 'User-Agent': 'KisanWebPortal/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const place = (addr.village || addr.hamlet || addr.suburb || addr.town || addr.city || addr.municipality || addr.county || '').trim();
            const dist = (addr.state_district || addr.district || '').replace(/\s*जिला\s*/g, '').replace(/\s*District\s*/gi, '').trim();

            if (place && dist && place !== dist) return `${place}, ${dist}`;
            if (place) return place;
            if (dist) return dist;
        }
    } catch (e) {
        console.warn("OSM Nominatim geocode fallback failed:", e);
    }

    // 3. Fallback: Find closest CG District if within reasonable proximity
    const nearest = findNearestCGDistrict(lat, lon);
    if (nearest) {
        const distDeg = Math.hypot(nearest.lat - lat, nearest.lon - lon);
        if (distDeg < 1.2) {
            return nearest.name;
        }
    }

    // 4. Default fallback: coordinates
    return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
}

async function initWeatherGuard() {
    const districtSelect = document.getElementById('wg-district-select');
    const btnGps = document.getElementById('wg-btn-gps');
    const btnRefresh = document.getElementById('wg-btn-refresh');

    if (!districtSelect) return;

    // 1. District Dropdown Change Event
    districtSelect.addEventListener('change', () => {
        const key = districtSelect.value;
        const d = CG_DISTRICT_COORDS[key];
        if (d) {
            wgCurrentLocationMode = "district";
            wgCurrentCoords = { lat: d.lat, lon: d.lon, label: d.fullName };
            fetchWeatherData(d.lat, d.lon, d.fullName);

            // Sync with FC District selector if user switches tab
            const fcDist = document.getElementById('fc-district');
            if (fcDist && fcDist.value !== key && fcDist.querySelector(`option[value="${key}"]`)) {
                fcDist.value = key;
                // trigger change on fc-district to update search view
                const event = new Event('change');
                fcDist.dispatchEvent(event);
            }
        }
    });

    // 2. GPS Button Click Event
    if (btnGps) {
        btnGps.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast("आपके ब्राउज़र में GPS लोकेशन समर्थित नहीं है।", "error");
                return;
            }

            const origContent = btnGps.innerHTML;
            btnGps.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>स्थान पहचान रहे हैं...</span>`;
            btnGps.disabled = true;

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    wgCurrentLocationMode = "gps";

                    // Reverse geocode to exact Hindi village / town / city name
                    const placeName = await reverseGeocodeToPlaceName(lat, lon);
                    const label = placeName;
                    wgCurrentCoords = { lat, lon, label };

                    fetchWeatherData(lat, lon, label);
                    btnGps.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${placeName}</span>`;
                    btnGps.disabled = false;
                    showToast(`📍 सटीक स्थान: ${placeName} से स्थानीय मौसम लोड हुआ!`, "success");
                },
                (err) => {
                    btnGps.innerHTML = origContent;
                    btnGps.disabled = false;
                    let msg = "GPS अनुमति नहीं मिली। कृपया जिला सूची से चयन करें।";
                    if (err.code === 1) msg = "लोकेशन अनुमति अस्वीकृत (Permission Denied)।";
                    else if (err.code === 2) msg = "लोकेशन सेवा अनुपलब्ध है।";
                    showToast(msg, "warning");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    // 3. Refresh Button Click Event
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.classList.add('spinning');
            fetchWeatherData(wgCurrentCoords.lat, wgCurrentCoords.lon, wgCurrentCoords.label).finally(() => {
                setTimeout(() => btnRefresh.classList.remove('spinning'), 700);
            });
            showToast("मौसम डेटा अपडेट किया जा रहा है...", "info");
        });
    }

    // 4. Initial Load (Bastar or Selected District)
    const initKey = districtSelect.value || 'bastar';
    const initD = CG_DISTRICT_COORDS[initKey] || CG_DISTRICT_COORDS['bastar'];
    wgCurrentCoords = { lat: initD.lat, lon: initD.lon, label: initD.fullName };
    fetchWeatherData(initD.lat, initD.lon, initD.fullName);
}

// Fetch Weather Data from Open-Meteo API
async function fetchWeatherData(lat, lon, locationLabel) {
    const locLabelEl = document.getElementById('wg-location-source');
    if (locLabelEl) {
        // Clean any redundant leading emoji pins to avoid duplicate icons
        const cleanLabel = (locationLabel || '').replace(/^[📍\s\u{1F4CD}\u{1F4CC}]+/u, '').trim();
        locLabelEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${cleanLabel}`;
    }

    // 10-Day Full Forecast with Rain Sum & Wind Speed
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&forecast_days=10&timezone=Asia/Kolkata`;

    try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        renderWeatherGuard(data, locationLabel);
    } catch (err) {
        console.warn("Weather fetch error, rendering fallback weather:", err);
        renderFallbackWeather(locationLabel);
    }
}

// Render Weather Guard Dashboard
function renderWeatherGuard(data, locationLabel) {
    const current = data.current || {};
    const daily = data.daily || {};

    wgDailyForecastData = daily;

    const temp = Math.round(current.temperature_2m ?? 25);
    const humidity = Math.round(current.relative_humidity_2m ?? 65);
    const precip = (current.precipitation ?? 0).toFixed(1);
    const wind = Math.round(current.wind_speed_10m ?? 6);
    const wcode = current.weather_code ?? 0;

    const rainProbToday = (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) ?? 0;
    const rainProbTomorrow = (daily.precipitation_probability_max && daily.precipitation_probability_max[1]) ?? 0;
    const maxRainRisk = Math.max(rainProbToday, rainProbTomorrow);

    const minTempToday = (daily.temperature_2m_min && daily.temperature_2m_min[0]) ? Math.round(daily.temperature_2m_min[0]) : (temp - 6);
    const maxTempToday = (daily.temperature_2m_max && daily.temperature_2m_max[0]) ? Math.round(daily.temperature_2m_max[0]) : (temp + 5);

    const weatherInfo = decodeWeatherCode(wcode);

    // 1. Update Metrics Cards
    const elTemp = document.getElementById('wg-temp-val');
    const elTempRange = document.getElementById('wg-temp-range');
    const elRain = document.getElementById('wg-rain-val');
    const elRainSub = document.getElementById('wg-rain-sub');
    const elHum = document.getElementById('wg-humidity-val');
    const elHumSub = document.getElementById('wg-humidity-sub');
    const elWind = document.getElementById('wg-wind-val');
    const elCond = document.getElementById('wg-condition-val');

    if (elTemp) elTemp.textContent = `${temp}°C`;
    if (elTempRange) elTempRange.textContent = `न्यूनतम: ${minTempToday}°C • अधिकतम: ${maxTempToday}°C`;
    if (elRain) elRain.textContent = `${rainProbToday}%`;
    if (elRainSub) elRainSub.textContent = `वर्षा मात्रा: ${precip} mm`;
    if (elHum) elHum.textContent = `${humidity}%`;
    if (elHumSub) elHumSub.textContent = `मानक: अधिकतम 17% नमी`;
    if (elWind) elWind.textContent = `${wind} km/h`;
    if (elCond) elCond.textContent = weatherInfo.text;

    // 2. Evaluate Paddy Alert Engine (Business Logic)
    const alertBanner = document.getElementById('wg-alert-banner');
    const alertIcon = document.getElementById('wg-alert-icon');
    const alertTitle = document.getElementById('wg-alert-title');
    const alertDesc = document.getElementById('wg-alert-desc');
    const tarpaulinBadge = document.getElementById('wg-tarpaulin-badge');

    if (alertBanner && alertIcon && alertTitle && alertDesc) {
        alertBanner.className = 'wg-alert-banner'; // reset classes

        const isRainRisk = (maxRainRisk >= 35 || parseFloat(precip) > 0 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(wcode));
        const isHighHumidity = (humidity >= 78);

        if (isRainRisk) {
            // RED ALERT
            alertBanner.classList.add('alert-danger');
            alertIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
            alertTitle.textContent = `🚨 धान सुरक्षा चेतावनी: बारिश का खतरा (${maxRainRisk}%)`;
            alertDesc.textContent = `आज या आगामी 24 घंटों में बारिश की संभावना (${maxRainRisk}%) है। उपार्जन केंद्र (समिति) जाने से पहले धान की बोरियों को वाटरप्रूफ तिरपाल (Tarpaulin) से अच्छी तरह ढंककर रखें ताकि धान भीगकर खराब न हो।`;
            if (tarpaulinBadge) {
                tarpaulinBadge.className = 'wg-tarpaulin-badge';
                tarpaulinBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <span>तिरपाल अनिवार्य</span>`;
            }
        } else if (isHighHumidity) {
            // YELLOW ALERT
            alertBanner.classList.add('alert-warning');
            alertIcon.innerHTML = `<i class="fa-solid fa-droplet"></i>`;
            alertTitle.textContent = `⚠️ नमी चेतावनी: हवा में नमी अधिक (${humidity}%)`;
            alertDesc.textContent = `हवा में नमी अधिक (${humidity}%) दर्ज की गई है। सरकारी समर्थन मूल्य मानक के अनुसार धान में 17% से अधिक नमी होने पर रिजेक्शन का खतरा रहता है। धान को समिति लाने से पहले धूप में अच्छी तरह सुखा लें।`;
            if (tarpaulinBadge) {
                tarpaulinBadge.className = 'wg-tarpaulin-badge';
                tarpaulinBadge.style.background = '#d97706';
                tarpaulinBadge.innerHTML = `<i class="fa-solid fa-wheat-awn"></i> <span>FAQ 17% नमी सीमा</span>`;
            }
        } else {
            // GREEN ALERT (SAFE)
            alertBanner.classList.add('alert-safe');
            alertIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
            alertTitle.textContent = `☀️ मौसम अनुकूल (धान खरीदी व सुखाने हेतु उत्तम)`;
            alertDesc.textContent = `मौसम पूरी तरह साफ और खिली धूप है। धान सुखाने, मिंजाई करने और उपार्जन केंद्र (समिति) ले जाने हेतु आज का दिन सर्वोत्तम व सुरक्षित है।`;
            if (tarpaulinBadge) {
                tarpaulinBadge.className = 'wg-tarpaulin-badge safe-mode';
                tarpaulinBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <span>तिरपाल साथ रखें (एहतियात)</span>`;
            }
        }
    }

    // 3. Render 10-Day Paddy Forecast Strip
    renderForecastStrip(daily);

    // 4. Update Last Updated Time
    const lastUp = document.getElementById('wg-last-updated');
    if (lastUp) {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        lastUp.textContent = `${hrs}:${mins} बजे`;
    }

    // 5. Update token date hint if user is currently on apply tab
    const tokenDateSelect = document.getElementById('token-date');
    if (tokenDateSelect && tokenDateSelect.value) {
        updateTokenWeatherHint(tokenDateSelect.value);
    }
}

// Render 10-Day Forecast Cards
function renderForecastStrip(daily) {
    const container = document.getElementById('wg-forecast-grid');
    if (!container || !daily || !daily.time) return;

    const hindiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    const hindiMonths = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

    let cardsHtml = '';
    const totalDays = Math.min(10, daily.time.length);

    for (let i = 0; i < totalDays; i++) {
        const dateStr = daily.time[i]; // "YYYY-MM-DD"
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10) - 1;
        const dayNum = parseInt(parts[2], 10);
        const dObj = new Date(year, monthNum, dayNum);
        const dayOfWeek = hindiDays[dObj.getDay()] || '';

        // Day Title
        let dayTitle = "";
        let isToday = (i === 0);
        if (i === 0) dayTitle = `आज (${dayOfWeek})`;
        else if (i === 1) dayTitle = `कल (${dayOfWeek})`;
        else if (i === 2) dayTitle = `परसों (${dayOfWeek})`;
        else dayTitle = `${dayOfWeek}`;

        const dateFormatted = `${dayNum} ${hindiMonths[monthNum] || ''}`;

        const code = daily.weather_code ? daily.weather_code[i] : 0;
        const winfo = decodeWeatherCode(code);
        const rainProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[i] != null) ? daily.precipitation_probability_max[i] : 0;
        const rainSum = (daily.precipitation_sum && daily.precipitation_sum[i] != null) ? Number(daily.precipitation_sum[i]).toFixed(1) : '0.0';
        const minT = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[i]) : '--';
        const maxT = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[i]) : '--';

        // Categorize Risk
        let cardClass = "wg-f-card";
        if (isToday) cardClass += " today-card";

        let rainClass = "wg-f-rain-low";
        let statusClass = "status-safe";
        let statusIcon = "fa-solid fa-circle-check";
        let statusText = "उत्तम दिन";

        const rainNum = parseFloat(rainSum);

        if (rainProb >= 40 || rainNum >= 2.0) {
            cardClass += " rain-alert-card";
            rainClass = "wg-f-rain-high";
            statusClass = "status-danger";
            statusIcon = "fa-solid fa-triangle-exclamation";
            statusText = "तिरपाल अनिवार्य!";
        } else if (rainProb >= 20 || rainNum > 0.0) {
            rainClass = "wg-f-rain-med";
            statusClass = "status-warning";
            statusIcon = "fa-solid fa-circle-exclamation";
            statusText = "हल्की सावधानी";
        }

        cardsHtml += `
            <div class="${cardClass}">
                <div class="wg-fc-header">
                    <span class="wg-fc-day ${isToday ? 'today-tag' : ''}">${dayTitle}</span>
                    <span class="wg-fc-date">${dateFormatted}</span>
                </div>
                <div class="wg-fc-body">
                    <div class="wg-fc-icon"><i class="${winfo.icon}" style="color:${winfo.color}"></i></div>
                    <div class="wg-fc-temp">${minT}° / ${maxT}°C</div>
                    <div class="wg-fc-cond">${winfo.text}</div>
                </div>
                <div class="wg-fc-footer">
                    <span class="wg-f-rain-pill ${rainClass}">
                        <i class="fa-solid fa-umbrella"></i> ${rainProb}% (${rainSum} mm)
                    </span>
                    <span class="wg-f-status-pill ${statusClass}">
                        <i class="${statusIcon}"></i> ${statusText}
                    </span>
                </div>
            </div>
        `;
    }

    container.innerHTML = cardsHtml;
}

// Fallback Weather when Offline or API Glitch (10 Days Mock)
function renderFallbackWeather(locationLabel) {
    const dates = [];
    const wcodes = [0, 1, 0, 0, 2, 0, 1, 0, 0, 1];
    const maxTemps = [29.5, 30.0, 29.0, 28.5, 29.0, 30.0, 29.5, 29.0, 28.0, 28.5];
    const minTemps = [17.5, 18.0, 17.0, 16.5, 17.0, 17.5, 18.0, 17.0, 16.0, 16.5];
    const rainProbs = [0, 5, 10, 0, 15, 0, 5, 0, 10, 5];
    const rainSums = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }

    const mockData = {
        current: {
            temperature_2m: 26.0,
            relative_humidity_2m: 62,
            precipitation: 0.0,
            weather_code: 0,
            wind_speed_10m: 5.5
        },
        daily: {
            time: dates,
            weather_code: wcodes,
            temperature_2m_max: maxTemps,
            temperature_2m_min: minTemps,
            precipitation_probability_max: rainProbs,
            precipitation_sum: rainSums
        }
    };
    renderWeatherGuard(mockData, locationLabel);
}

// Update Token Date Weather Hint in Apply Tab
function updateTokenWeatherHint(selectedDateStr) {
    const hintEl = document.getElementById('token-weather-alert-hint');
    if (!hintEl) return;

    if (!wgDailyForecastData || !wgDailyForecastData.time) {
        hintEl.style.display = 'none';
        return;
    }

    // Extract DD-MM-YYYY from selectedDateStr (e.g. "16-11-2026 (सोमवार)")
    const match = selectedDateStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
    let matchedRainProb = 0;
    let matchedRainSum = 0;
    let matchedMaxTemp = '--';
    let matchedMinTemp = '--';
    let matchedCode = 0;
    let found = false;

    if (match) {
        const targetDate = `${match[3]}-${match[2]}-${match[1]}`;
        const idx = wgDailyForecastData.time.indexOf(targetDate);
        if (idx !== -1) {
            matchedRainProb = (wgDailyForecastData.precipitation_probability_max && wgDailyForecastData.precipitation_probability_max[idx] != null) ? wgDailyForecastData.precipitation_probability_max[idx] : 0;
            matchedRainSum = (wgDailyForecastData.precipitation_sum && wgDailyForecastData.precipitation_sum[idx] != null) ? Number(wgDailyForecastData.precipitation_sum[idx]).toFixed(1) : '0.0';
            matchedMaxTemp = (wgDailyForecastData.temperature_2m_max && wgDailyForecastData.temperature_2m_max[idx] != null) ? Math.round(wgDailyForecastData.temperature_2m_max[idx]) : '--';
            matchedMinTemp = (wgDailyForecastData.temperature_2m_min && wgDailyForecastData.temperature_2m_min[idx] != null) ? Math.round(wgDailyForecastData.temperature_2m_min[idx]) : '--';
            matchedCode = (wgDailyForecastData.weather_code && wgDailyForecastData.weather_code[idx] != null) ? wgDailyForecastData.weather_code[idx] : 0;
            found = true;
        }
    }

    hintEl.style.display = 'flex';

    const winfo = decodeWeatherCode(matchedCode);

    if (found && (matchedRainProb >= 35 || parseFloat(matchedRainSum) >= 2.0)) {
        hintEl.className = 'token-weather-note note-warn';
        hintEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <div><strong>🚨 मौसम चेतावनी (${match[1]}-${match[2]}-${match[3]}):</strong> इस तारीख को बारिश की संभावना (${matchedRainProb}%, वर्षा: ${matchedRainSum} mm) है! धान भीगने से बचाने हेतु तिरपाल (Tarpaulin) अनिवार्य रूप से साथ रखें।</div>`;
    } else {
        const probText = found ? `मात्र ${matchedRainProb}%` : 'नगण्य';
        hintEl.className = 'token-weather-note note-safe';
        hintEl.innerHTML = `<i class="fa-solid fa-cloud-sun"></i> <div><strong>☀️ मौसम अनुकूल (${match ? match[1] + '-' + match[2] : ''}):</strong> मौसम साफ रहेगा (${winfo.text}, तापमान: ${matchedMinTemp}°-${matchedMaxTemp}°C, बारिश: ${probText})। धान उपार्जन हेतु उपयुक्त दिन।</div>`;
    }
}

// ===================================================
// 17. 🪪 DIGITAL KISAN ID CARD ENGINE
// ===================================================

let currentKisanCardData = null;

function openKisanCard(code, name, father, samiti, upkendra, paddy, kramank) {
    currentKisanCardData = { code, name, father, samiti, upkendra, paddy, kramank };

    // Get active district name
    const distKey = fcCurrentDistrictKey || 'bastar';
    const distObj = fcAllDistricts && fcAllDistricts[distKey] ? fcAllDistricts[distKey].district : 'बस्तर (Bastar)';

    document.getElementById('kic-name').textContent = name || 'कृषक भाई';
    document.getElementById('kic-father').textContent = father || '--';
    document.getElementById('kic-code').textContent = code || '--';
    document.getElementById('kic-district').textContent = distObj;
    document.getElementById('kic-center').textContent = `${upkendra || '--'} (${samiti || '--'})`;
    document.getElementById('kic-paddy').textContent = `${paddy || '0.00'} क्विंटल`;
    document.getElementById('kic-kramank').textContent = `#${kramank || '-'}`;

    // Dynamic QR code containing verified government farmer details
    const qrText = encodeURIComponent(`CG-KISAN-CARD\nकोड: ${code}\nनाम: ${name}\nपिता: ${father}\nजिला: ${distObj}\nकेंद्र: ${upkendra}\nकोटा: ${paddy} क्विंटल`);
    const qrImg = document.getElementById('kic-qr-img');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrText}`;
    }

    const modal = document.getElementById('kisan-card-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeKisanCardModal() {
    const modal = document.getElementById('kisan-card-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function printKisanCard() {
    window.print();
}

// ===================================================
// 18. 📑 KISAN FORMS, AFFIDAVITS & SCHEMES ENGINE
// ===================================================

function initFormsAndSchemes() {
    // Populate Districts in Forms
    const affDist = document.getElementById('aff-district');
    const grvDist = document.getElementById('grv-district');

    if (affDist || grvDist) {
        for (const key in CG_DISTRICT_COORDS) {
            const d = CG_DISTRICT_COORDS[key];
            if (affDist) {
                const opt = document.createElement('option');
                opt.value = d.name;
                opt.textContent = d.fullName;
                if (key === 'raipur') opt.selected = true;
                affDist.appendChild(opt);
            }
            if (grvDist) {
                const opt2 = document.createElement('option');
                opt2.value = d.name;
                opt2.textContent = d.fullName;
                if (key === 'raipur') opt2.selected = true;
                grvDist.appendChild(opt2);
            }
        }
    }

    // Initial renders
    updateAffidavitFields();
    generateAffidavit();
    generateGrievance();
    calculateSolarSubsidy();
    generateDbtBankLetter();
}

// Subtab switcher for Forms tab
function switchFormsSubTab(subtab) {
    const btnAff = document.getElementById('btn-subnav-affidavit');
    const btnGrv = document.getElementById('btn-subnav-grievance');
    const subAff = document.getElementById('subtab-affidavit');
    const subGrv = document.getElementById('subtab-grievance');

    if (subtab === 'affidavit') {
        if (btnAff) btnAff.classList.add('active');
        if (btnGrv) btnGrv.classList.remove('active');
        if (subAff) subAff.style.display = 'block';
        if (subGrv) subGrv.style.display = 'none';
    } else {
        if (btnAff) btnAff.classList.remove('active');
        if (btnGrv) btnGrv.classList.add('active');
        if (subAff) subAff.style.display = 'none';
        if (subGrv) subGrv.style.display = 'block';
    }
}

// Subtab switcher for Schemes tab
function switchSchemesSubTab(subtab) {
    const btnSol = document.getElementById('btn-subnav-solar');
    const btnDbt = document.getElementById('btn-subnav-dbt');
    const subSol = document.getElementById('subtab-solar');
    const subDbt = document.getElementById('subtab-dbt');

    if (subtab === 'solar') {
        if (btnSol) btnSol.classList.add('active');
        if (btnDbt) btnDbt.classList.remove('active');
        if (subSol) subSol.style.display = 'block';
        if (subDbt) subDbt.style.display = 'none';
    } else {
        if (btnSol) btnSol.classList.remove('active');
        if (btnDbt) btnDbt.classList.add('active');
        if (subSol) subSol.style.display = 'none';
        if (subDbt) subDbt.style.display = 'block';
    }
}

// Update affidavit inputs based on type
function updateAffidavitFields() {
    const affType = document.getElementById('aff-type').value;
    const secondPartyLabel = document.getElementById('aff-second-party-label');
    const secondPartyGroup = document.getElementById('aff-second-party-group');

    if (!secondPartyLabel || !secondPartyGroup) return;

    if (affType === 'adhia') {
        secondPartyGroup.style.display = 'block';
        secondPartyLabel.innerHTML = `<strong>मूल भूमि स्वामी (जमीन मालिक) का नाम *</strong>`;
    } else if (affType === 'family') {
        secondPartyGroup.style.display = 'block';
        secondPartyLabel.innerHTML = `<strong>सह-खातेदार / परिवार के अन्य सदस्य का नाम *</strong>`;
    } else if (affType === 'nominee') {
        secondPartyGroup.style.display = 'block';
        secondPartyLabel.innerHTML = `<strong>नॉमिनी (वारिसदार) का नाम व संबंध *</strong>`;
    } else if (affType === 'rakba') {
        secondPartyGroup.style.display = 'none';
    }
    generateAffidavit();
}

// Generate Official Hindi Legal Affidavit
function generateAffidavit() {
    const area = document.getElementById('affidavit-print-area');
    if (!area) return;

    const affType = document.getElementById('aff-type').value;
    const name = document.getElementById('aff-farmer-name').value || 'श्री कृषक';
    const father = document.getElementById('aff-father-name').value || 'श्री पिता';
    const village = document.getElementById('aff-village').value || 'ग्राम';
    const block = document.getElementById('aff-block').value || 'विकासखंड';
    const district = document.getElementById('aff-district').value || 'जिला';
    const center = document.getElementById('aff-center').value || 'उपार्जन केंद्र';
    const khasra = document.getElementById('aff-khasra').value || 'खसरा क्र.';
    const landArea = document.getElementById('aff-area').value || '0.00 एकड़';
    const secondParty = document.getElementById('aff-second-party').value || 'श्री अन्य पक्ष';

    const today = new Date();
    const dateFormatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    let titleText = "";
    let subjectText = "";
    let bodyText = "";

    if (affType === 'adhia') {
        titleText = "अधिया / रेगहा (बंटाईदार) कृषक सहमति एवं स्व-घोषणा पत्र";
        subjectText = `समर्थन मूल्य धान खरीदी 2026-27 अंतर्गत खसरा क्र. ${khasra} रकबा ${landArea} में अधिया/रेगहा धान विक्रय सहमति बाबत।`;
        bodyText = `
            1. यह कि मैं शपथकर्ता <strong>${name}</strong>, आत्मज <strong>${father}</strong>, निवासी ग्राम <strong>${village}</strong>, तहसील <strong>${block}</strong>, जिला <strong>${district} (छ.ग.)</strong> का स्थायी निवासी हूँ।<br>
            2. यह कि भूमि स्वामी <strong>${secondParty}</strong> की स्वामित्व वाली भूमि स्थित ग्राम <strong>${village}</strong>, खसरा नं. <strong>${khasra}</strong>, कुल रकबा <strong>${landArea}</strong> को मैंने खरीफ वर्ष 2026-27 हेतु वैध सहमति अनुसार अधिया / रेगहा (बंटाई) पर लेकर स्वयं धान की फसल उगाई है।<br>
            3. यह कि उक्त खसरे में उत्पादित धान को उपार्जन केंद्र (समिति) <strong>${center}</strong> में समर्थन मूल्य पर विक्रय करने हेतु मूल भूमि स्वामी की पूर्ण सहमति प्राप्त है तथा इसमें किसी प्रकार का कोई वाद-विवाद नहीं है।<br>
            4. यह कि यदि उक्त कथन भविष्य में किसी भी स्तर पर असत्य पाया जाता है, तो इसके लिए मैं स्वयं व्यक्तिगत रूप से उत्तरदायी रहूँगा।
        `;
    } else if (affType === 'family') {
        titleText = "पारिवारिक रकबा बंटवारा एवं सहमति घोषणा पत्र";
        subjectText = `पारिवारिक संयुक्त खाते के खसरा क्र. ${khasra} रकबा ${landArea} में समर्थन मूल्य पर धान विक्रय सहमति बाबत।`;
        bodyText = `
            1. यह कि हम शपथकर्ता <strong>${name}</strong> एवं सह-खातेदार <strong>${secondParty}</strong>, पिता <strong>${father}</strong>, निवासी ग्राम <strong>${village}</strong>, जिला <strong>${district}</strong> के स्थायी निवासी हैं।<br>
            2. यह कि हमारे संयुक्त स्वामित्व की भूमि खसरा क्र. <strong>${khasra}</strong> कुल रकबा <strong>${landArea}</strong> में से आपसी सहमति एवं पारिवारिक बंटवारे अनुसार <strong>${name}</strong> के हिस्से का धान उपार्जन केंद्र <strong>${center}</strong> में विक्रय किया जा रहा है।<br>
            3. यह कि इस धान विक्रय व खाते में राशि भुगतान से परिवार के अन्य किसी भी सदस्य को कोई आपत्ति नहीं है।
        `;
    } else if (affType === 'nominee') {
        titleText = "नॉमिनी (वारिसदार) बायोमेट्रिक तौल प्राधिकार पत्र";
        subjectText = `समिति में बायोमेट्रिक आधार सत्यापन हेतु नॉमिनी <strong>${secondParty}</strong> को अधिकृत करने बाबत।`;
        bodyText = `
            1. यह कि मैं मूल पंजीकृत किसान <strong>${name}</strong>, किसान कोड <strong>TF...</strong>, वृद्ध/अस्वस्थ होने के कारण उपार्जन केंद्र <strong>${center}</strong> में स्वयं उपस्थित होने में असमर्थ हूँ।<br>
            2. यह कि मैं अपने परिवार के सदस्य / वारिसदार <strong>${secondParty}</strong> को मेरे स्थान पर धान तौलवाने, बायोमेट्रिक / आधार सत्यापन कराने एवं पावती प्राप्त करने हेतु पूर्णतः अधिकृत करता हूँ।<br>
            3. यह कि नॉमिनी द्वारा किए गए समस्त हस्ताक्षरों एवं तौल पावती को मेरे द्वारा किया गया माना जाएगा।
        `;
    } else {
        titleText = "रकबा संशोधन एवं गिरदावरी सुधार शपथ पत्र";
        subjectText = `भुइयां पोर्टल एवं गिरदावरी रिकॉर्ड में खसरा क्र. ${khasra} के वास्तविक धान रकबे के सुधार बाबत।`;
        bodyText = `
            1. यह कि मैं कृषक <strong>${name}</strong>, पिता <strong>${father}</strong>, ग्राम <strong>${village}</strong>, तहसील <strong>${block}</strong>, जिला <strong>${district}</strong> का निवासी हूँ।<br>
            2. यह कि मेरे स्वामित्व की भूमि खसरा क्र. <strong>${khasra}</strong> में वास्तविक रूप से <strong>${landArea}</strong> में धान की फसल उगाई गई है, किंतु गिरदावरी में त्रुटिवश कम रकबा दर्ज हो गया है।<br>
            3. अतः श्रीमान् से निवेदन है कि स्थल निरीक्षण कर वास्तविक धान रकबे का सुधार उपार्जन केंद्र <strong>${center}</strong> के पंजीयन में करने की कृपा करें।
        `;
    }

    area.innerHTML = `
        <div class="doc-official-header">
            <h3>छत्तीसगढ़ शासन • समर्थन मूल्य धान उपार्जन 2026-27</h3>
            <h5>[ कानूनी शपथ पत्र एवं स्व-प्रमाणीकरण प्रारूप ]</h5>
        </div>
        <div style="text-align: center; margin-bottom: 16px;">
            <h4 style="color: #166534; font-weight: 800; font-size: 1.15rem; text-decoration: underline;">${titleText}</h4>
        </div>
        <p><strong>समक्ष:</strong> श्रीमान् उपार्जन केंद्र प्रबंधक (समिति) / तहसीलदार महोदय, <strong>${center}</strong>, जिला: <strong>${district} (छ.ग.)</strong></p>
        <div class="doc-subject-box">
            <strong>विषय:</strong> ${subjectText}
        </div>
        <div class="doc-body-text">
            ${bodyText}
        </div>
        <p style="margin-top: 15px;"><strong>सत्यापन:</strong> मैं शपथपूर्वक सत्यापित करता हूँ कि उपर्युक्त समस्त जानकारी मेरे ज्ञान व विश्वास अनुसार सत्य है।</p>
        <p style="margin-top: 8px;"><strong>दिनांक:</strong> ${dateFormatted} | <strong>स्थान:</strong> ${village}, ${district}</p>
        <div class="doc-signatures-grid">
            <div class="doc-sig-box">
                <div class="doc-sig-line"></div>
                <strong>हस्ताक्षर / अंगूठा कृषक</strong>
                <span>(${name})</span>
            </div>
            <div class="doc-sig-box">
                <div class="doc-sig-line"></div>
                <strong>हस्ताक्षर गवाह 1</strong>
                <span>(नाम व पता)</span>
            </div>
            <div class="doc-sig-box">
                <div class="doc-sig-line"></div>
                <strong>हस्ताक्षर गवाह 2 / सरपंच</strong>
                <span>(सील सहित)</span>
            </div>
        </div>
    `;
}

function printAffidavit() {
    window.print();
}

function copyAffidavitText() {
    const area = document.getElementById('affidavit-print-area');
    if (!area) return;
    const text = area.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("शपथ पत्र का पूरा टेक्स्ट कॉपी हो गया!", "success");
    }).catch(() => {
        fallbackCopy(text);
    });
}

// Generate Grievance Complaint Letter
function updateGrievanceText() {
    generateGrievance();
}

function generateGrievance() {
    const area = document.getElementById('grievance-print-area');
    if (!area) return;

    const issueKey = document.getElementById('grv-issue').value;
    const officer = document.getElementById('grv-officer').value;
    const name = document.getElementById('grv-farmer-name').value || 'श्री कृषक';
    const code = document.getElementById('grv-farmer-code').value || 'TF...';
    const center = document.getElementById('grv-center').value || 'उपार्जन केंद्र';
    const district = document.getElementById('grv-district').value || 'जिला';
    const details = document.getElementById('grv-details').value.trim();

    const today = new Date();
    const dateFormatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    let subjectText = "";
    let bodyText = "";

    if (issueKey === 'bardana') {
        subjectText = `उपार्जन केंद्र ${center} में बारदाना (बोरी) न मिलने अथवा फटा बारदाना देने बाबत शिकायत।`;
        bodyText = `निवेदन है कि मैं प्रार्थी किसान कोड ${code} का पंजीकृत कृषक हूँ। दिनांक ${dateFormatted} को मैं अपनी निर्धारित उपज लेकर उपार्जन केंद्र ${center} पहुँचा था। किंतु समिति प्रबंधन द्वारा यह कहकर बारदाना देने से मना कर दिया गया कि बारदाना समाप्त हो गया है अथवा अत्यंत जर्जर/फटा बारदाना दिया जा रहा है। इससे मेरी धान की बोरियां फटने और धान खराब होने का खतरा उत्पन्न हो गया है।`;
    } else if (issueKey === 'weight') {
        subjectText = `उपार्जन केंद्र ${center} में तौल में अवैध कटौती (घटतौली) एवं हमाली में अवैध वसूली बाबत।`;
        bodyText = `निवेदन है कि मैं प्रार्थी किसान कोड ${code} का कृषक हूँ। उपार्जन केंद्र ${center} में तौल कांटे पर प्रति बोरी 1 से 2 किलोग्राम की अवैध कटौती (सूखा/धूल के नाम पर) की जा रही है, जो कि शासन के नियमों के विरुद्ध है। इसके अतिरिक्त हमालों एवं कर्मचारियों द्वारा शासन द्वारा निर्धारित दर से अधिक राशि की अवैध वसूली की जा रही है।`;
    } else if (issueKey === 'payment') {
        subjectText = `धान विक्रय के निर्धारित 3 दिवस व्यतीत होने उपरांत भी बैंक खाते में भुगतान न आने बाबत।`;
        bodyText = `निवेदन है कि मैंने उपार्जन केंद्र ${center} में अपना धान सफलता पूर्वक विक्रय किया था। शासन के नियमानुसार 72 घंटे (3 कार्यदिवस) के भीतर भुगतान खाते में अंतरित होना अनिवार्य है, किंतु आज दिनांक तक मेरे आधार लिंक बैंक खाते में राशि जमा नहीं हुई है।`;
    } else if (issueKey === 'refusal') {
        subjectText = `वैध ऑनलाइन टोकन होने के उपरांत भी समिति द्वारा धान तौल से मना करने बाबत।`;
        bodyText = `निवेदन है कि मेरे पास उक्त दिनांक का विधिवत ऑनलाइन टोकन उपलब्ध होने के बावजूद समिति प्रबंधक द्वारा बिना किसी ठोस कारण के धान तौलने से इनकार किया जा रहा है, जिससे मुझे ट्रैक्टर का अतिरिक्त भाड़ा वहन करना पड़ रहा है।`;
    } else {
        subjectText = `उपार्जन केंद्र ${center} के कर्मचारियों द्वारा कृषकों के साथ दुर्व्यवहार बाबत।`;
        bodyText = `निवेदन है कि उपार्जन केंद्र ${center} में उपस्थित कर्मचारियों द्वारा किसान भाइयों के साथ अनुचित व्यवहार किया जा रहा है तथा आवश्यक सहयोग नहीं दिया जा रहा है।`;
    }

    if (details) {
        bodyText += `<br><br><strong>अतिरिक्त विवरण:</strong> ${details}`;
    }

    area.innerHTML = `
        <div class="doc-official-header">
            <h3>कार्यालयीन शिकायत आवेदन पत्र</h3>
            <h5>[ समर्थन मूल्य धान उपार्जन व्यवस्था 2026-27 ]</h5>
        </div>
        <p><strong>सेवा में,</strong><br>${officer},<br>जिला: <strong>${district} (छत्तीसगढ़)</strong></p>
        <div class="doc-subject-box" style="border-left-color: #dc2626;">
            <strong>विषय:</strong> ${subjectText}
        </div>
        <p><strong>महोदय,</strong></p>
        <div class="doc-body-text">
            ${bodyText}
            <br><br>
            अतः श्रीमान् से सादर करबद्ध प्रार्थना है कि उक्त विषय पर संज्ञान लेते हुए उपार्जन केंद्र <strong>${center}</strong> की तत्काल जांच कराने एवं प्रार्थी कृषक की समस्या का 24 घंटे में निराकरण कराने की महती कृपा करें।
        </div>
        <p><strong>संलग्नक:</strong> किसान पंजीयन पर्ची, टोकन पर्ची, आधार कार्ड छायाप्रति।</p>
        <p style="margin-top: 15px;"><strong>दिनांक:</strong> ${dateFormatted} | <strong>स्थान:</strong> ${district}</p>
        <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
            <div class="doc-sig-box" style="text-align: right;">
                <div class="doc-sig-line"></div>
                <strong>विनीत प्रार्थी (कृषक)</strong>
                <span><strong>नाम:</strong> ${name}</span>
                <span><strong>किसान कोड:</strong> ${code}</span>
                <span><strong>केंद्र:</strong> ${center}</span>
            </div>
        </div>
    `;
}

function printGrievance() {
    window.print();
}

function copyGrievanceText() {
    const area = document.getElementById('grievance-print-area');
    if (!area) return;
    const text = area.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("शिकायत आवेदन पत्र का टेक्स्ट कॉपी हो गया!", "success");
    }).catch(() => {
        fallbackCopy(text);
    });
}

// Calculate Solar Sujala Pump Subsidy
function calculateSolarSubsidy() {
    const pumpType = document.getElementById('solar-pump-type').value;
    const category = document.getElementById('solar-category').value;

    let marketCost = 350000;
    let farmerShare = 18000;

    if (pumpType === '2_surface') {
        marketCost = 250000;
        if (category === 'ST' || category === 'SC') farmerShare = 7000;
        else if (category === 'OBC') farmerShare = 12000;
        else farmerShare = 18000;
    } else if (pumpType === '3_sub') {
        marketCost = 350000;
        if (category === 'ST' || category === 'SC') farmerShare = 10000;
        else if (category === 'OBC') farmerShare = 18000;
        else farmerShare = 25000;
    } else if (pumpType === '5_sub') {
        marketCost = 450000;
        if (category === 'ST' || category === 'SC') farmerShare = 18000;
        else if (category === 'OBC') farmerShare = 28000;
        else farmerShare = 38000;
    }

    const subsidy = marketCost - farmerShare;
    const subsidyPct = Math.round((subsidy / marketCost) * 100);

    const elMarket = document.getElementById('solar-market-cost');
    const elSub = document.getElementById('solar-subsidy-amount');
    const elShare = document.getElementById('solar-farmer-share');

    if (elMarket) elMarket.textContent = `₹${marketCost.toLocaleString('en-IN')}`;
    if (elSub) elSub.innerHTML = `₹${subsidy.toLocaleString('en-IN')} (${subsidyPct}%)`;
    if (elShare) elShare.textContent = `₹${farmerShare.toLocaleString('en-IN')}`;
}

// Generate Bank Letter for Aadhaar NPCI / DBT Mapping
function generateDbtBankLetter() {
    const area = document.getElementById('dbt-print-area');
    if (!area) return;

    const name = document.getElementById('dbt-farmer-name').value || 'श्री कृषक';
    const father = document.getElementById('dbt-father-name').value || 'श्री पिता';
    const bank = document.getElementById('dbt-bank-name').value || 'बैंक';
    const branch = document.getElementById('dbt-branch-name').value || 'शाखा';
    const account = document.getElementById('dbt-account-no').value || 'XXXXXXXX';
    const aadhaar = document.getElementById('dbt-aadhaar-no').value || 'XXXX-XXXX-XXXX';
    const mobile = document.getElementById('dbt-mobile').value || 'XXXXXXXXXX';

    const today = new Date();
    const dateFormatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    area.innerHTML = `
        <div class="doc-official-header">
            <h3>आवेदन पत्र • आधार NPCI / DBT बैंक खाता सीडिंग</h3>
            <h5>[ समर्थन मूल्य धान खरीदी भुगतान प्राप्ति हेतु ]</h5>
        </div>
        <p><strong>सेवा में,</strong><br>श्रीमान् शाखा प्रबंधक महोदय,<br><strong>${bank}</strong>, शाखा: <strong>${branch}</strong></p>
        <div class="doc-subject-box">
            <strong>विषय:</strong> बैंक खाता क्रमांक <strong>${account}</strong> को आधार NPCI मैपर एवं DBT (प्रत्यक्ष लाभ अंतरण) से तत्काल लिंक करने बाबत।
        </div>
        <p><strong>महोदय,</strong></p>
        <div class="doc-body-text">
            सविनय निवेदन है कि मैं प्रार्थी <strong>${name}</strong>, पिता <strong>${father}</strong>, आपकी बैंक शाखा का खाताधारक हूँ। मेरी खाता संख्या <strong>${account}</strong> है तथा मेरा आधार नंबर <strong>${aadhaar}</strong> है।<br><br>
            छत्तीसगढ़ शासन द्वारा समर्थन मूल्य धान खरीदी 2026-27 का भुगतान सीधे PFMS / DBT माध्यम से आधार से लिंक बैंक खाते में भेजा जा रहा है। NPCI सर्वर पर मेरा खाता सीडेड न होने के कारण मेरी धान खरीदी की राशि का भुगतान प्राप्त होने में बाधा आ रही है।<br><br>
            अतः श्रीमान् से सादर अनुरोध है कि मेरे उक्त बैंक खाते को तत्काल NPCI (National Payments Corporation of India) मैपर पर आधार से सीड / लिंक करने की कृपा करें, ताकि शासन द्वारा अंतरित धान खरीदी भुगतान राशि मेरे खाते में क्रेडिट हो सके।
        </div>
        <p><strong>संलग्न दस्तावेज:</strong> 1. आधार कार्ड की स्व-प्रमाणित छायाप्रति, 2. बैंक पासबुक की प्रथम पृष्ठ छायाप्रति।</p>
        <p style="margin-top: 15px;"><strong>दिनांक:</strong> ${dateFormatted}</p>
        <div style="display: flex; justify-content: flex-end; margin-top: 35px;">
            <div class="doc-sig-box" style="text-align: right;">
                <div class="doc-sig-line"></div>
                <strong>हस्ताक्षर खाताधारक (कृषक)</strong>
                <span><strong>नाम:</strong> ${name}</span>
                <span><strong>खाता क्र.:</strong> ${account}</span>
                <span><strong>मोबाइल:</strong> ${mobile}</span>
            </div>
        </div>
    `;
}

function printDbtBankLetter() {
    window.print();
}

function copyDbtBankLetterText() {
    const area = document.getElementById('dbt-print-area');
    if (!area) return;
    const text = area.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast("बैंक आवेदन पत्र का टेक्स्ट कॉपी हो गया!", "success");
    }).catch(() => {
        fallbackCopy(text);
    });
}



