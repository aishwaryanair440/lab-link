// ============================================================================
// LABLINK — University Equipment Portal Application Controller
// Integration with Google Apps Script & Html5-Qrcode
// ============================================================================

(function () {
    "use strict";

    // -------------------------------------------------------------------------
    // STATE & CONFIG
    // -------------------------------------------------------------------------
    const APP_STATE = {
        apiUrl: "https://script.google.com/macros/s/AKfycbzMyzEEPWqtsTB2CoQOZUTMajN0ttBysuy1zW8xcUYgFoV0wmg9UVQJpEmqCFgFNldB/exec",
        role: "student", // 'student' or 'admin'
        user: null,      // holds user details like { Student_ID: "ST...", Name: "..." }
        isDemo: false,
        currentPage: "dashboard",
        scanner: null,   // reference to html5Qrcode scanner instance
        scanTargetInput: null // the input field waiting for the scan result
    };

    // -------------------------------------------------------------------------
    // DOM REFERENCES
    // -------------------------------------------------------------------------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        loginScreen: $("#loginScreen"),
        appLayout: $("#appLayout"),
        sidebar: $("#sidebar"),
        pageContainer: $("#pageContainer"),
        loader: $("#globalLoader"),
        toast: $("#toast"),
        scannerModal: $("#scannerModal")
    };

    // -------------------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------------------
    function init() {
        bindEvents();
    }

    function bindEvents() {
        // Login Tabs
        $$(".login-tabs .tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                $$(".login-tabs .tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                APP_STATE.role = btn.dataset.role;
                $("#loginId").placeholder = APP_STATE.role === "admin" ? "Enter Admin ID (e.g. admin)" : "Enter Student ID (e.g. ST001)";
            });
        });

        // Login Actions
        $("#loginBtn").addEventListener("click", handleLogin);


        // Navigation
        $$(".nav-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                navigateTo(item.dataset.page);
            });
        });

        // Mobile menu
        $("#mobileMenuToggle").addEventListener("click", () => dom.sidebar.classList.toggle("open"));
        $("#logoutBtn").addEventListener("click", handleLogout);

        // Scanners
        $$(".start-scan-btn").forEach(btn => {
            btn.addEventListener("click", () => openScanner(btn.dataset.target));
        });
        $("#closeScannerBtn").addEventListener("click", closeScanner);

        // Business Logic Actions
        $("#submitIssueBtn").addEventListener("click", processIssue);
        $("#submitReturnBtn").addEventListener("click", processReturn);

        // Search & Filters
        $("#globalSearch").addEventListener("input", debounce(handleGlobalSearch, 300));
        $$("#equipFilters .filter-chip").forEach(chip => {
            chip.addEventListener("click", (e) => {
                $$("#equipFilters .filter-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                renderCatalogue();
            });
        });
    }

    // -------------------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------------------
    async function handleLogin() {
        const id = $("#loginId").value.trim();

        if (!id) return showToast("Please enter an ID.", "error");

        showLoader("Authenticating...");

        try {
            if (APP_STATE.isDemo) {
                // Mock Login
                setTimeout(() => {
                    APP_STATE.user = APP_STATE.role === "admin" ? { Name: "Admin User", role: "admin" } : { Student_ID: id, Name: "Demo Student", Department: "IT" };
                    loginSuccess();
                }, 800);
            } else {
                const res = await callApi("login", { role: APP_STATE.role, id: id });
                if (res.status === "success") {
                    APP_STATE.user = res.user;
                    loginSuccess();
                } else {
                    showToast(res.message || "Invalid credentials", "error");
                    hideLoader();
                }
            }
        } catch (e) {
            showToast("Connection failed. Please check the API URL.", "error");
            hideLoader();
        }
    }

    function loginSuccess() {
        dom.loginScreen.classList.remove("active");
        dom.appLayout.classList.remove("hidden");

        // UI Setup based on Role
        $("#userNameDisplay").textContent = APP_STATE.user.Name;
        $("#userRoleDisplay").textContent = APP_STATE.role === "admin" ? "Lab Assistant" : "Student";

        if (APP_STATE.role === "admin") {
            document.body.classList.add("role-admin");
            document.body.classList.remove("role-student");
            $("#dashboardSubtitle").textContent = "Administration Overview";
        } else {
            document.body.classList.add("role-student");
            document.body.classList.remove("role-admin");
            $("#dashboardSubtitle").textContent = "Your equipment circulation dashboard";
        }

        refreshData();
        navigateTo("dashboard");
        hideLoader();
        showToast(`Welcome back, ${APP_STATE.user.Name}!`);
    }

    function handleLogout() {
        dom.loginScreen.classList.add("active");
        dom.appLayout.classList.add("hidden");
        $("#loginId").value = "";
        APP_STATE.user = null;
        document.body.classList.remove("role-admin", "role-student");
    }

    // -------------------------------------------------------------------------
    // NAVIGATION & DATA ROUTING
    // -------------------------------------------------------------------------
    function navigateTo(page) {
        if (page === "issue" || page === "return" || page === "students" || page === "damage") {
            if (APP_STATE.role !== "admin") return; // Access control
        }

        APP_STATE.currentPage = page;
        $$(".nav-item").forEach(n => n.classList.remove("active"));
        $(`.nav-item[data-page="${page}"]`)?.classList.add("active");

        $$(".page").forEach(p => p.classList.remove("active"));
        $(`#page-${page}`).classList.add("active");

        if (window.innerWidth <= 768) dom.sidebar.classList.remove("open");

        // Clear inputs on entry
        if (page === "issue") $("#issueStudentId").value = $("#issueEquipId").value = "";
        if (page === "return") $("#returnEquipId").value = ""; $("#returnDamageCheck").checked = false;
    }

    // -------------------------------------------------------------------------
    // DATA FETCHING & RENDERING
    // -------------------------------------------------------------------------
    let cachedData = {};

    async function refreshData() {
        showLoader("Syncing database...");
        try {
            if (APP_STATE.isDemo) {
                cachedData = await getDemoData();
            } else {
                const [eqRes, stRes, txRes, dmRes, statRes] = await Promise.all([
                    callApi("equipment"), callApi("students"), callApi("transactions"), callApi("damage"), callApi("status")
                ]);
                cachedData = {
                    equipment: eqRes.data || [],
                    students: stRes.data || [],
                    transactions: txRes.data || [],
                    damage: dmRes.data || [],
                    status: statRes.summary || {}
                };
            }
            renderAllViews();
        } catch (e) {
            showToast("Sync error.", "error");
        } finally {
            hideLoader();
        }
    }

    function renderAllViews() {
        renderDashboard();
        renderCatalogue();
        if (APP_STATE.role === "admin") {
            renderTransactions();
            renderStudents();
            renderDamage();
        }
    }

    // --- Rendering Functions --- //

    function renderDashboard() {
        // Render Stats
        const stats = cachedData.status;
        $("#statAvailable").textContent = stats.available || 0;
        $("#statInUse").textContent = stats.in_use || 0;

        if (APP_STATE.role === "admin") {
            $("#statTotalEq").textContent = stats.total_equipment || 0;
            // Calculate overdue randomly for UI or properly by date
            let overdueCount = cachedData.transactions.filter(t => t.Return_Status === "Not Returned").length; // Simplified
            $("#statOverdue").textContent = overdueCount;

            // Render Admin Rxns
            const tbody = $("#recentRxnTable tbody");
            tbody.innerHTML = cachedData.transactions.slice(-5).reverse().map(t => `
        <tr>
          <td>${t.Student_ID}</td>
          <td>${t.Equipment_ID}</td>
          <td>${formatBadge(t.Return_Status)}</td>
          <td>${t.Issue_Time}</td>
        </tr>`).join("");
        } else {
            // Student specific dashboard: My Items
            const myItems = cachedData.transactions.filter(t => t.Student_ID === APP_STATE.user.Student_ID && t.Return_Status === "Not Returned");
            const tbody = $("#myIssuedTable tbody");
            if (myItems.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center">No active issues found.</td></tr>`;
            } else {
                tbody.innerHTML = myItems.map(t => `
          <tr>
            <td><strong>${t.Transaction_ID}</strong></td>
            <td>${t.Equipment_ID}</td>
            <td>${t.Issue_Time}</td>
            <td>${formatBadge(t.Return_Status)}</td>
          </tr>`).join("");
            }
        }
    }

    function renderCatalogue() {
        const activeFilter = $("#equipFilters .active").dataset.filter;
        const body = $("#catalogueTable tbody");

        let items = cachedData.equipment || [];
        if (activeFilter !== "all") {
            items = items.filter(e => e.Status === activeFilter);
        }

        body.innerHTML = items.map(eq => `
      <tr>
        <td><strong>${eq.Equipment_ID}</strong></td>
        <td>${eq.Equipment_Name}</td>
        <td>${eq.Category}</td>
        <td>${eq.Lab_Type}</td>
        <td>${formatBadge(eq.Status)}</td>
      </tr>
    `).join("");
    }

    function renderTransactions() {
        const body = $("#transactionsTable tbody");
        body.innerHTML = cachedData.transactions.slice().reverse().map(t => `
      <tr>
        <td><strong>${t.Transaction_ID}</strong></td>
        <td>${t.Student_ID}</td>
        <td>${t.Equipment_ID}</td>
        <td>${t.Issue_Time || "—"}</td>
        <td>${t.Return_Time || "—"}</td>
        <td>${formatBadge(t.Return_Status)}</td>
      </tr>
    `).join("");
    }

    function renderStudents() {
        const body = $("#studentsTable tbody");
        body.innerHTML = cachedData.students.map(s => `
      <tr>
        <td><strong>${s.Student_ID}</strong></td>
        <td>${s.Name}</td>
        <td><span class="text-primary font-bold">${s.Department}</span></td>
        <td>${s.Year}</td>
      </tr>
    `).join("");
    }

    function renderDamage() {
        const body = $("#damageTable tbody");
        body.innerHTML = cachedData.damage.map(d => `
      <tr>
        <td><strong>${d.Damage_ID}</strong></td>
        <td>${d.Equipment_ID}</td>
        <td>${d.Reported_By}</td>
        <td>${d.Damage_Description}</td>
        <td>${formatBadge(d.Status)}</td>
      </tr>
    `).join("");
    }

    function formatBadge(status) {
        if (!status) return "";
        const cls = status.toLowerCase().replace(/\s+/g, '-');
        return `<span class="badge badge-${cls}">${status}</span>`;
    }

    function handleGlobalSearch(e) {
        const term = e.target.value.toLowerCase();

        // Quick filtering of active page tables
        $$(".page.active tbody tr").forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(term) ? "" : "none";
        });
    }

    // =========================================================================
    // HYBRID SCANNER ENGINE  (QuaggaJS for barcodes | html5-qrcode for QR)
    // =========================================================================
    const ScannerEngine = (() => {
        let _targetInputId = null;   // Which <input> receives the scanned value
        let _mode = 'barcode';       // 'barcode' | 'qr'
        let _running = false;        // Prevent duplicate starts
        let _lastCode = null;        // Duplicate-scan guard
        let _qrInstance = null;      // html5-qrcode instance
        let _scanLock = false;       // Brief lock after successful scan

        // ---- Audio feedback (tiny beep via Web Audio API) -------------------
        function _beep() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.value = 1046;   // C6
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.start(); osc.stop(ctx.currentTime + 0.12);
            } catch (e) { /* AudioContext blocked — silent fallback */ }
        }

        // ---- Visual success feedback ----------------------------------------
        function _flashSuccess() {
            const flash = document.getElementById('scanSuccessFlash');
            if (!flash) return;
            flash.classList.add('flash');
            setTimeout(() => flash.classList.remove('flash'), 350);
        }

        // ---- Vibrate if available -------------------------------------------
        function _vibrate() {
            if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
        }

        // ---- Set scan box shape for current mode ----------------------------
        function _updateScanBox() {
            const box = document.getElementById('scanBox');
            if (!box) return;
            box.className = 'scan-box ' + (_mode === 'qr' ? 'mode-qr' : 'mode-barcode');
        }

        // ---- Show result chip ------------------------------------------------
        function _showResult(code) {
            const resultEl = document.getElementById('scannerResult');
            const textEl   = document.getElementById('scannerResultText');
            if (resultEl && textEl) {
                textEl.textContent = code;
                resultEl.classList.remove('hidden');
            }
        }

        // ---- Called on every successful decode ------------------------------
        function _onDetected(code) {
            if (_scanLock || !code) return;
            if (code === _lastCode) return;   // Ignore duplicate reads
            _scanLock = true;
            _lastCode = code;

            _beep();
            _vibrate();
            _flashSuccess();
            _showResult(code);

            // Fill the target input
            if (_targetInputId) {
                const input = document.getElementById(_targetInputId);
                if (input) {
                    input.value = code;
                    input.dispatchEvent(new Event('input')); // Trigger any listeners
                }
            }

            showToast('Scanned: ' + code, 'success');

            // Close modal after brief delay so user sees feedback
            setTimeout(() => stop(), 600);
        }

        // ---- START QuaggaJS (barcode mode) ----------------------------------
        function _startQuagga() {
            const viewport = document.getElementById('scannerViewport');
            const vw = viewport ? viewport.clientWidth  : 320;
            const vh = viewport ? viewport.clientHeight : 240;

            Quagga.init({
                inputStream: {
                    name: 'Live',
                    type: 'LiveStream',
                    target: document.getElementById('quagga-container'),
                    constraints: {
                        facingMode: 'environment',    // Always back camera
                        width:  { ideal: 1280 },      // High-resolution for reliability
                        height: { ideal: 720 },
                        focusMode: 'continuous'
                    },
                    // Only decode within the center 80%×50% region (matches scan box)
                    area: { top: '25%', right: '10%', left: '10%', bottom: '25%' }
                },
                decoder: {
                    // Focus exclusively on Code-128 and Code-39 (student + equipment IDs)
                    readers: ['code_128_reader', 'code_39_reader'],
                    debug: { drawBoundingBox: false, showFrequency: false,
                             drawScanline: false, showPattern: false }
                },
                locate: true,
                frequency: 15    // ~15 decode attempts per second — fast without overloading
            }, (err) => {
                if (err) {
                    showToast('Camera error: ' + err, 'error');
                    stop();
                    return;
                }
                Quagga.start();
                _running = true;
            });

            Quagga.onDetected((result) => {
                const code = result && result.codeResult && result.codeResult.code;
                if (code) _onDetected(code);
            });
        }

        // ---- START html5-qrcode (QR mode) -----------------------------------
        function _startQr() {
            const formats = [Html5QrcodeSupportedFormats.QR_CODE];
            _qrInstance = new Html5Qrcode('qr-reader', { formatsToSupport: formats, verbose: false });

            _qrInstance.start(
                { facingMode: 'environment' },
                { fps: 20, qrbox: { width: 220, height: 220 }, disableFlip: true },
                (decodedText) => { _onDetected(decodedText); },
                () => {}   // Ignore per-frame decode errors
            ).catch((err) => {
                showToast('Camera error: ' + err, 'error');
                stop();
            });
            _running = true;
        }

        // ---- Stop all scanning engines ---------------------------------------
        function stop() {
            // Stop QuaggaJS
            try { Quagga.stop(); } catch (e) {}
            try { Quagga.offDetected(); } catch (e) {}

            // Stop html5-qrcode
            if (_qrInstance) {
                _qrInstance.stop().catch(() => {}).finally(() => { _qrInstance = null; });
            }

            _running  = false;
            _scanLock = false;
            _lastCode = null;

            // Hide modal
            document.getElementById('scannerModal').classList.remove('active');

            // Clear QR reader DOM so it can restart fresh
            const qrEl = document.getElementById('qr-reader');
            if (qrEl) qrEl.innerHTML = '';
        }

        // ---- Switch between barcode / QR modes --------------------------------
        function setMode(newMode) {
            if (_running) stop();   // Tear down current engine first

            _mode = newMode;
            _updateScanBox();

            // Update tab UI
            document.getElementById('tabBarcode').classList.toggle('active', newMode === 'barcode');
            document.getElementById('tabQr').classList.toggle('active', newMode === 'qr');

            // Update instruction text
            const instr = document.getElementById('scannerInstruction');
            if (instr) instr.innerHTML = newMode === 'qr'
                ? '<i class="fa-solid fa-circle-info"></i> Align QR code within the box'
                : '<i class="fa-solid fa-circle-info"></i> Align barcode within the box';

            // Show / hide containers
            document.getElementById('quagga-container').classList.toggle('hidden', newMode === 'qr');
            document.getElementById('qr-reader').classList.toggle('hidden', newMode === 'barcode');

            // Restart in new mode
            if (newMode === 'qr') _startQr(); else _startQuagga();
        }

        // ---- Public open entry point -----------------------------------------
        function open(targetInputId) {
            if (_running) stop();    // Always clean restart

            _targetInputId = targetInputId;
            _lastCode      = null;
            _scanLock      = false;
            _mode          = 'barcode';   // Default to barcode mode

            // Reset result chip
            const resultEl = document.getElementById('scannerResult');
            if (resultEl) resultEl.classList.add('hidden');

            // Update scan-box shape
            _updateScanBox();
            document.getElementById('quagga-container').classList.remove('hidden');
            document.getElementById('qr-reader').classList.add('hidden');
            document.getElementById('tabBarcode').classList.add('active');
            document.getElementById('tabQr').classList.remove('active');

            // Update modal title
            const title = document.getElementById('scannerModalTitle');
            if (title) title.textContent = 'Scanning for ' + targetInputId
                .replace('issueStudentId','Student ID')
                .replace('issueEquipId','Equipment ID')
                .replace('returnEquipId','Equipment ID');

            document.getElementById('scannerModal').classList.add('active');
            _startQuagga();
        }

        return { open, stop, setMode };
    })();

    // ---- Thin wrappers so existing call sites don't need changing ----------
    function openScanner(targetInputId) { ScannerEngine.open(targetInputId); }
    function closeScanner()             { ScannerEngine.stop(); }

    // -------------------------------------------------------------------------
    // ACTIONS (Issue / Return)
    // -------------------------------------------------------------------------
    async function processIssue() {
        const studentId = $("#issueStudentId").value.trim();
        const equipInput = $("#issueEquipId").value.trim();

        if (!studentId || !equipInput) return showToast("Both IDs are required", "warning");

        // Automatically resolve Equipment Name to Equipment ID using local catalog
        let resolvedEquipId = equipInput;
        if (cachedData.equipment) {
            const cleanInput = equipInput.toLowerCase().trim().replace(/\s+/g, ' ');
            const match = cachedData.equipment.find(eq => {
                const cleanName = eq.Equipment_Name.toLowerCase().trim().replace(/\s+/g, ' ');
                const cleanID = eq.Equipment_ID.toLowerCase().trim();
                return cleanName === cleanInput || cleanID === cleanInput;
            });
            if (match) resolvedEquipId = match.Equipment_ID;
        }

        showLoader("Processing circulation...");

        try {
            if (APP_STATE.isDemo) {
                setTimeout(() => {
                    showToast(`Mock Issue: ${equipId} given to ${studentId}`, "success");
                    $("#issueStudentId").value = $("#issueEquipId").value = "";
                    hideLoader();
                }, 1000);
                return;
            }

            const res = await callApi("issue", { studentId, equipmentId: resolvedEquipId });
            if (res.status === "success") {
                showToast("Transaction successful!", "success");
                $("#issueStudentId").value = $("#issueEquipId").value = "";
                refreshData(); // Sync the rest of the app
            } else {
                showToast(res.message || "Failed to issue equipment", "error");
            }
        } catch (e) {
            showToast("Network interface error.", "error");
        } finally {
            hideLoader();
        }
    }

    async function processReturn() {
        const equipInput = $("#returnEquipId").value.trim();
        const damage = $("#returnDamageCheck").checked ? "Yes" : "No";

        if (!equipInput) return showToast("Equipment ID is required", "warning");

        // Automatically resolve Equipment Name to Equipment ID using local catalog
        let resolvedEquipId = equipInput;
        if (cachedData.equipment) {
            const cleanInput = equipInput.toLowerCase().trim().replace(/\s+/g, ' ');
            const match = cachedData.equipment.find(eq => {
                const cleanName = eq.Equipment_Name.toLowerCase().trim().replace(/\s+/g, ' ');
                const cleanID = eq.Equipment_ID.toLowerCase().trim();
                return cleanName === cleanInput || cleanID === cleanInput;
            });
            if (match) resolvedEquipId = match.Equipment_ID;
        }

        showLoader("Checking in equipment...");

        try {
            if (APP_STATE.isDemo) {
                setTimeout(() => {
                    showToast(`Mock Return: ${equipId} processed`, "success");
                    $("#returnEquipId").value = "";
                    hideLoader();
                }, 1000);
                return;
            }

            const res = await callApi("return", { equipmentId: resolvedEquipId, damage: damage });
            if (res.status === "success") {
                showToast("Equipment checked in securely.", "success");
                $("#returnEquipId").value = "";
                $("#returnDamageCheck").checked = false;
                refreshData();
            } else {
                showToast(res.message || "Failed to return equipment", "error");
            }
        } catch (e) {
            showToast("Network interface error.", "error");
        } finally {
            hideLoader();
        }
    }

    // -------------------------------------------------------------------------
    // CORE API UTILS
    // -------------------------------------------------------------------------
    async function callApi(action, params = {}) {
        const url = new URL(APP_STATE.apiUrl);
        url.searchParams.set("action", action);
        for (const [key, val] of Object.entries(params)) {
            url.searchParams.set(key, val);
        }
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("HTTP " + response.status);
        return await response.json();
    }

    function showLoader(text) {
        dom.loader.querySelector("p").textContent = text || "Processing...";
        dom.loader.classList.remove("hidden");
    }

    function hideLoader() {
        dom.loader.classList.add("hidden");
    }

    function showToast(msg, type = "info") {
        dom.toast.querySelector("span").textContent = msg;
        if (type === "error") dom.toast.style.background = "var(--danger)";
        else if (type === "success") dom.toast.style.background = "var(--success)";
        else dom.toast.style.background = "#111827";

        dom.toast.classList.add("show");
        setTimeout(() => dom.toast.classList.remove("show"), 3000);
    }

    function debounce(func, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // -------------------------------------------------------------------------
    // MOCK DEMO DATA
    // -------------------------------------------------------------------------
    async function getDemoData() {
        return {
            status: { available: 28, in_use: 6, total_equipment: 40, active_transactions: 5 },
            equipment: [
                { Equipment_ID: "EQ001", Equipment_Name: "Oscilloscope", Category: "Measurement", Lab_Type: "Electronics", Status: "Available" },
                { Equipment_ID: "EQ002", Equipment_Name: "Digital Multimeter", Category: "Measurement", Lab_Type: "Electronics", Status: "In Use" },
            ],
            students: [
                { Student_ID: "ST001", Name: "Aarav Sharma", Department: "IT", Year: "2nd" }
            ],
            transactions: [
                { Transaction_ID: "TXN123", Student_ID: "ST001", Equipment_ID: "EQ002", Issue_Time: "2026-03-10 10:00", Return_Time: "", Return_Status: "Not Returned" }
            ],
            damage: []
        };
    }

    // Expose controller for global inline calls (like refresh btn)
    window.appController = { refreshData, processIssue, processReturn };

    document.addEventListener("DOMContentLoaded", init);
})();
