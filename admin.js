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

    function renderDashboard() {
        if (!window.sbClient) {
            console.error("Supabase client not initialized");
            return;
        }
        fetchRevenueData();
    }

    // Helper function to fetch ALL tickets using pagination (Supabase has 1000 row limit)
    async function fetchAllTickets(status) {
        const BATCH_SIZE = 1000;
        let allTickets = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            let query = window.sbClient
                .from('tickets')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, from + BATCH_SIZE - 1);

            if (status !== 'all') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching tickets batch:', error);
                return null;
            }

            if (data && data.length > 0) {
                allTickets = [...allTickets, ...data];
                from += BATCH_SIZE;
                // If we got less than BATCH_SIZE, we've reached the end
                if (data.length < BATCH_SIZE) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        return allTickets;
    }

    async function fetchRevenueData(isInitial = true) {
        if (!window.sbClient) return;

        if (isInitial) {
            currentPage = 0;
            allDataRendered = false;
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Cargando todos los clientes...</td></tr>';

            // Fetch Global Stats (Accurate counts)
            const { count: paidCount } = await window.sbClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'paid');
            const { count: reservedCount } = await window.sbClient.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'reserved');
            updateStatsUI(paidCount || 0, reservedCount || 0);
        }

        // Server-side filtering
        const term = ticketSearch.value.trim().toLowerCase();
        const status = filterStatus.value;

        // Fetch ALL tickets using pagination to overcome 1000 row limit
        const data = await fetchAllTickets(status);

        if (data === null) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Error al cargar datos.</td></tr>';
            return;
        }

        // Apply client-side search filter if term exists
        let filteredData = data;
        if (term) {
            filteredData = data.filter(t =>
                (t.client_name && t.client_name.toLowerCase().includes(term)) ||
                (t.client_phone && t.client_phone.toLowerCase().includes(term)) ||
                (t.ticket_number && t.ticket_number.toString().includes(term))
            );
        }

        currentFilteredData = filteredData;
        allDataRendered = true;
        tableBody.innerHTML = '';

        renderTable(currentFilteredData);
    }

    function updateStatsUI(paidCount, reservedCount) {
        const totalSales = paidCount * TICKET_PRICE;
        const TOTAL_TICKETS = 100000;

        statTotal.textContent = `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        statSold.textContent = `${paidCount} / ${TOTAL_TICKETS.toLocaleString()}`;
        statPending.textContent = `${reservedCount}`;
    }

    function groupTicketsByClient(flatTickets) {
        const groups = {};
        flatTickets.forEach(t => {
            // Use a combination of phone and name to avoid grouping separate people if phone is missing/same
            const key = `${t.client_phone || 'no-phone'}_${t.client_name || 'no-name'}`;
            if (!groups[key]) {
                groups[key] = {
                    client: t.client_name || 'Desconocido',
                    phone: t.client_phone || 'Sin número',
                    tickets: [],
                    totalPrice: 0,
                    statuses: new Set(),
                    date: t.created_at
                };
            }
            groups[key].tickets.push(t);
            groups[key].totalPrice += TICKET_PRICE;
            groups[key].statuses.add(t.status);
            // Keep the most recent date
            if (new Date(t.created_at) > new Date(groups[key].date)) {
                groups[key].date = t.created_at;
            }
        });
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function renderTable(flatData) {
        tableBody.innerHTML = '';
        const groupedData = groupTicketsByClient(flatData);

        if (groupedData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No se encontraron registros.</td></tr>';
            return;
        }

        groupedData.forEach(group => {
            const tr = document.createElement('tr');

            // Determine dominant status
            let badgeClass = 'reserved';
            let statusText = 'Apartado';

            if (group.statuses.has('paid') && !group.statuses.has('reserved')) {
                badgeClass = 'paid';
                statusText = 'Pagado';
            } else if (group.statuses.has('paid') && group.statuses.has('reserved')) {
                badgeClass = 'warning';
                statusText = 'Mixto';
            }

            const ticketCount = group.tickets.length;
            const formattedTotal = `$${group.totalPrice.toLocaleString()}`;

            tr.innerHTML = `
                <td data-label="Cliente"><strong>${group.client}</strong></td>
                <td data-label="Teléfono">${group.phone}</td>
                <td data-label="Boletos"><span class="badge available" style="color:white;">${ticketCount} boletos</span></td>
                <td data-label="Total">${formattedTotal}</td>
                <td data-label="Estado"><span class="badge ${badgeClass}">${statusText}</span></td>
                <td data-label="Acciones">
                    <div class="action-buttons-group">
                        <button class="action-btn btn-view" onclick="viewDetails('${group.phone}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${statusText !== 'Pagado' ?
                    `<button class="action-btn btn-pay" onclick="markGroupAsPaid('${group.phone}')"><i class="fas fa-check"></i></button>` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- Infinite Scroll ---
    window.addEventListener('scroll', () => {
        if (allDataRendered || isLoadingMore) return;

        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;

        if (Math.ceil(scrolled) >= scrollable - 200) {
            fetchRevenueData(false);
        }
    });

    // --- Filtering & Search ---
    let searchTimeout;
    ticketSearch.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchRevenueData(true), 500);
    });
    filterStatus.addEventListener('change', () => fetchRevenueData(true));

    function filterData() {
        // Redundant with server-side logic now
        fetchRevenueData(true);
    }

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
