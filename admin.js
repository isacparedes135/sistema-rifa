document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const btnLogin = document.getElementById('btn-login');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');

    const tableBody = document.getElementById('tickets-table-body');
    const ticketSearch = document.getElementById('ticket-search');
    const filterStatus = document.getElementById('filter-status');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statSold = document.getElementById('stat-sold');
    const statPending = document.getElementById('stat-pending');

    // --- Supabase Config ---
    const TICKET_PRICE = 500;

    // Pagination & Search State
    let currentPage = 0;
    const PAGE_SIZE = 50;
    let allDataRendered = false;
    let isLoadingMore = false;
    let currentFilteredData = [];

    // Details Modal Elements
    const detailsModal = document.getElementById('ticket-details-modal');
    const closeDetailsModal = document.getElementById('close-details-modal');
    const detailsTitle = document.getElementById('details-title');
    const detailsList = document.getElementById('details-list');
    const btnPayAll = document.getElementById('btn-pay-all');
    let currentSelectedPhone = null;

    // --- Authentication Flow ---

    // Check session on load
    async function checkSession() {
        if (!window.sbClient) return;
        const { data: { session } } = await window.sbClient.auth.getSession();
        if (session) {
            showDashboard();
        }
    }
    checkSession();

    btnLogin.addEventListener('click', attemptLogin);
    [adminEmailInput, adminPasswordInput].forEach(el => {
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        }
    });

    btnLogout.addEventListener('click', async () => {
        if (window.sbClient) {
            await window.sbClient.auth.signOut();
        }
        showLogin();
    });

    closeDetailsModal.addEventListener('click', () => {
        detailsModal.classList.add('hidden');
    });

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        renderDashboard();
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        if (adminPasswordInput) adminPasswordInput.value = '';
        if (adminEmailInput) adminEmailInput.value = '';
    }

    async function attemptLogin() {
        const email = adminEmailInput.value.trim();
        const password = adminPasswordInput.value;

        if (!email || !password) {
            loginError.textContent = 'Ingresa email y contraseña';
            return;
        }

        loginError.textContent = 'Verificando...';

        const { data, error } = await window.sbClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            loginError.textContent = 'Acceso denegado: ' + error.message;
        } else {
            loginError.textContent = '';
            showDashboard();
        }
    }

    // --- Dashboard Logic ---

    // --- Dashboard Logic (Optimized) ---

    // Constants
    const LOAD_BATCH_SIZE = 1000;

    // State
    let currentOffset = 0;
    let isSearchActive = false;
    let accumulatedTickets = [];

    const btnLoadMore = document.getElementById('btn-load-more');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', () => loadMoreTickets());
    }

    function toggleLoader(show) {
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('hidden', !show);
        }
    }

    function renderDashboard() {
        if (!window.sbClient) {
            console.error("Supabase client not initialized");
            return;
        }
        // Initial Full Load
        resetAndLoadDashboard();
    }

    async function resetAndLoadDashboard() {
        try {
            currentOffset = 0;
            accumulatedTickets = [];
            isSearchActive = false;
            tableBody.innerHTML = '';

            toggleLoader(true);
            await fetchStats();
            await loadMoreTickets(); // Load first batch
        } catch (e) {
            console.error(e);
            alert('Error en dashboard: ' + e.message);
        } finally {
            toggleLoader(false);
        }
    }

    async function fetchStats() {
        try {
            const { data: { session } } = await window.sbClient.auth.getSession();
            const { count: paidCount, error: paidError } = await window.sbClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'paid');
            const { count: reservedCount, error: reservedError } = await window.sbClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'reserved');

            alert(`DEBUG: User: ${session?.user?.id || 'NONE'}\nPaid: ${paidCount}\nReserved: ${reservedCount}\nError: ${paidError?.message || 'Ninguno'}`);

            updateStatsUI(paidCount || 0, reservedCount || 0);
        } catch (e) {
            alert('Error fetchStats: ' + e.message);
        }
    }

    async function loadMoreTickets() {
        // Safe check for search mode
        if (isSearchActive) return; // Load more only works for timeline view, not search results

        if (loadMoreContainer) loadMoreContainer.style.display = 'none';

        // Fetch Batch
        const status = filterStatus.value;

        let query = window.sbClient
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .range(currentOffset, currentOffset + LOAD_BATCH_SIZE - 1);

        if (status !== 'all') {
            query = query.eq('status', status);
            // Notes: Filtering by status implies we might miss recent tickets if strictly paginating by date globally
            // But usually acceptable for simple admin view
        }

        const { data, error } = await query;

        if (error) {
            alert('Error al cargar datos: ' + error.message);
            toggleLoader(false);
            return;
        }

        if (data && data.length > 0) {
            accumulatedTickets = [...accumulatedTickets, ...data];
            currentOffset += LOAD_BATCH_SIZE;

            // Render current accumulation (grouping logic handles the whole set correctly)
            renderTable(accumulatedTickets);

            if (data.length === LOAD_BATCH_SIZE) {
                // Potential for more data
                if (loadMoreContainer) loadMoreContainer.style.display = 'block';
                btnLoadMore.textContent = 'Cargar más resultados antiguos...';
            }
        } else {
            if (accumulatedTickets.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No se encontraron registros.</td></tr>';
            }
        }
    }

    // --- Optimized Search Logic ---
    async function performGlobalSearch() {
        const term = ticketSearch.value.trim();
        if (!term) {
            // If cleared, reset to normal view
            resetAndLoadDashboard();
            return;
        }

        isSearchActive = true;
        if (loadMoreContainer) loadMoreContainer.style.display = 'none'; // No "load more" in search results

        // Show lightweight loader within table or maintain overlay? Overlay is safer for "global search" feel
        toggleLoader(true);

        const status = filterStatus.value;
        const normalizedTerm = term.toLowerCase();

        // Construct Query for Global Search
        // Note: Supabase 'or' filtering with ilike on multiple columns
        let query = window.sbClient
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200); // Reasonable limit for search results

        // Complex OR filter for search
        // ticket_number is text/int? Assuming text based on ilike needs. If int, we need careful casting.
        // Assuming database ticket_number is TEXT based on previous code usage (padStart). 
        // If it's INT, ilike won't work directly on it easily without casting.
        // Let's assume standard client_name/phone search first.

        const searchFilter = `client_name.ilike.%${term}%,client_phone.ilike.%${term}%,ticket_number.ilike.%${term}%`;
        query = query.or(searchFilter);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        toggleLoader(false);

        if (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Error en la búsqueda.</td></tr>';
            return;
        }

        if (data && data.length > 0) {
            // For search results, we just render what we found
            renderTable(data);
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No se encontraron resultados para "' + term + '".</td></tr>';
        }
    }

    // Debounce Search
    let searchTimeout;
    ticketSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performGlobalSearch, 600);
    });

    filterStatus.addEventListener('change', () => {
        if (ticketSearch.value.trim()) {
            performGlobalSearch();
        } else {
            resetAndLoadDashboard();
        }
    });

    // --- Detail Modal Actions ---
    window.viewDetails = function (phone) {
        // Group might be across multiple pages, but for details we can fetch all of them just for this client
        console.log(`Buscando detalles para: ${phone}`);
        // We filter from currentFilteredData first, but better to fetch fresh to be sure
        const groupTickets = currentFilteredData.filter(t => t.client_phone === phone);
        if (groupTickets.length === 0) return;

        const clientName = groupTickets[0].client_name;
        detailsTitle.textContent = `Boletos de ${clientName} (${groupTickets.length})`;
        currentSelectedPhone = phone;

        // Render Grid
        detailsList.innerHTML = '';
        groupTickets.forEach(t => {
            const pill = document.createElement('div');
            pill.className = `ticket-pill ${t.status}`;
            pill.style.border = t.status === 'paid' ? '1px solid #22c55e' : '1px solid #eab308';
            pill.textContent = `#${t.ticket_number}`;
            detailsList.appendChild(pill);
        });

        // Setup Pay All Button
        const hasUnpaid = groupTickets.some(t => t.status === 'reserved');
        if (hasUnpaid) {
            btnPayAll.style.display = 'block';
            btnPayAll.onclick = () => {
                markGroupAsPaid(phone);
                detailsModal.classList.add('hidden');
            };
        } else {
            btnPayAll.style.display = 'none';
        }

        detailsModal.classList.remove('active'); // Wait, should be active/remove hidden
        detailsModal.classList.remove('hidden');
        detailsModal.classList.add('active'); // Ensure overlay triggers
    }

    window.markGroupAsPaid = async function (phone) {
        if (!confirm(`¿Marcar TODOS los boletos de ${phone} como PAGADOS?`)) return;

        // Supabase Update
        if (window.sbClient) {
            const { error } = await window.sbClient
                .from('tickets')
                .update({ status: 'paid' })
                .eq('client_phone', phone)
                .eq('status', 'reserved'); // Only pay reserved ones

            if (error) {
                alert('Error al actualizar: ' + error.message);
                return;
            }

            // Refresh Data
            fetchRevenueData();
        }
    }

    window.freeGroup = async function (phone) {
        if (!confirm(`¿LIBERAR/ELIMINAR todos los boletos de ${phone}? Esta acción no se puede deshacer.`)) return;

        // Supabase Delete
        if (window.sbClient) {
            const { error } = await window.sbClient
                .from('tickets')
                .delete()
                .eq('client_phone', phone);

            if (error) {
                alert('Error al liberar: ' + error.message);
                return;
            }

            fetchRevenueData();
        }
    };

});
