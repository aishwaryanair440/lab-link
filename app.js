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
        $("#demoLoginBtn").addEventListener("click", () => {
            APP_STATE.isDemo = true;
            APP_STATE.user = APP_STATE.role === "admin" ? { Name: "Demo Admin" } : { Student_ID: "ST001", Name: "Aarav Sharma" };
            loginSuccess();
        });

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
        const sId = APP_STATE.user ? APP_STATE.user.Student_ID.toString().trim().toLowerCase() : "";

        if (APP_STATE.role === "admin") {
            $("#statAvailable").textContent = stats.available || 0;
            $("#statInUse").textContent = stats.in_use || 0;
            $("#statTotalEq").textContent = stats.total_equipment || 0;
            const overdueCount = cachedData.transactions.filter(t => (t.Return_Status || "").toString().trim().toLowerCase() === "not returned").length;
            $("#statOverdue").textContent = overdueCount;

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
            const myItems = cachedData.transactions.filter(t => {
                const tId = (t.Student_ID || "").toString().trim().toLowerCase();
                const tStatus = (t.Return_Status || "").toString().trim().toLowerCase();
                return tId === sId && (tStatus === "not returned" || tStatus === "issued");
            });

            $("#statAvailable").textContent = stats.available || 0;
            $("#statInUse").textContent = myItems.length;

            // Personalize the label if it exists
            const inUseLabel = $("#statInUse").parentElement.querySelector(".stat-label");
            if (inUseLabel) inUseLabel.textContent = "Your Items In Use";

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
        const sId = APP_STATE.user ? APP_STATE.user.Student_ID.toString().trim().toLowerCase() : "";

        const data = APP_STATE.role === "admin"
            ? cachedData.transactions
            : cachedData.transactions.filter(t => (t.Student_ID || "").toString().trim().toLowerCase() === sId);

        body.innerHTML = data.slice().reverse().map(t => `
      <tr>
        <td><strong>${t.Transaction_ID}</strong></td>
        <td class="admin-only">${t.Student_ID}</td>
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

    // -------------------------------------------------------------------------
    // BARCODE SCANNER (html5-qrcode)
    // -------------------------------------------------------------------------
    function openScanner(targetInputId) {
        APP_STATE.scanTargetInput = targetInputId;
        dom.scannerModal.classList.add("active");

        if (!APP_STATE.scanner) {
            APP_STATE.scanner = new Html5Qrcode("qr-reader");
        }

        APP_STATE.scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 100 } },
            (decodedText, decodedResult) => {
                // Success
                document.getElementById(APP_STATE.scanTargetInput).value = decodedText;
                showToast("Barcode Scanned: " + decodedText, "success");
                closeScanner();
            },
            (errorMessage) => {
                // Continuous scanning failure - ignore safe to ignore
            }
        ).catch(err => {
            showToast("Camera access denied or unvailable.", "error");
            closeScanner();
        });
    }

    function closeScanner() {
        dom.scannerModal.classList.remove("active");
        if (APP_STATE.scanner && APP_STATE.scanner.isScanning) {
            APP_STATE.scanner.stop().catch(console.error);
        }
    }

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
