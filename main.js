document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let selectedTickets = [];
    let targetQuantity = 0;
    let currentMode = ''; // 'manual' or 'lucky'
    let currentUser = null; // { name, lastname, phone, state }
    const TICKET_PRICE = 1; // Updated to $1 per ticket as requested
    let takenTicketsSet = new Set(); // Tracks tickets already reserved/paid in database

    // --- Prize Carousel Logic - Premium ---
    const carouselSlides = document.querySelectorAll('.carousel-slide');
    const carouselDots = document.querySelectorAll('.carousel-dot');
    const progressBar = document.getElementById('carousel-progress-bar');
    let currentSlide = 0;
    const slideInterval = 3000; // 3 seconds per slide
    let carouselTimer = null;

    function showSlide(index) {
        carouselSlides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        carouselDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;

        // Reset progress bar animation
        if (progressBar) {
            progressBar.style.animation = 'none';
            progressBar.offsetHeight; // Trigger reflow
            progressBar.style.animation = 'progressFill 3s linear forwards';
        }
    }

    function nextSlide() {
        const next = (currentSlide + 1) % carouselSlides.length;
        showSlide(next);
    }

    function startCarouselTimer() {
        if (carouselTimer) clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, slideInterval);
    }

    // Auto-advance carousel
    if (carouselSlides.length > 0) {
        startCarouselTimer();

        // Initial progress bar animation
        if (progressBar) {
            progressBar.style.animation = 'progressFill 3s linear forwards';
        }

        // Allow clicking dots to jump to slide
        carouselDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideIndex = parseInt(dot.dataset.slide);
                showSlide(slideIndex);
                startCarouselTimer(); // Reset timer on manual navigation
            });
        });
    }

    // --- Elements ---
    const btnManual = document.getElementById('btn-manual');
    const btnLucky = document.getElementById('btn-lucky');

    // Modals
    // Modals
    // Modals
    const userDataModal = document.getElementById('user-data-modal');
    const quantityModal = document.getElementById('quantity-modal');
    const manualModal = document.getElementById('manual-modal');
    const chestModal = document.getElementById('chest-modal');
    const luckyQuantityModal = document.getElementById('lucky-quantity-modal');
    const myTicketsModal = document.getElementById('my-tickets-modal');
    const paymentMethodsModal = document.getElementById('payment-methods-modal');
    const faqModal = document.getElementById('faq-modal');

    // Buttons
    const btnMisBoletosHeader = document.getElementById('btn-mis-boletos');
    const btnPaymentMethods = document.getElementById('btn-payment-methods');
    const btnFaqHeader = document.getElementById('btn-faq');

    // New Actions
    const btnSearchTickets = document.getElementById('btn-search-tickets');
    const lookupPhoneInput = document.getElementById('lookup-phone');
    const lookupResults = document.getElementById('lookup-results');
    // Countdown Elements
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');
    const closeModals = document.querySelectorAll('.close-modal');

    // Mobile Menu elements
    const navMenu = document.getElementById('nav-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    // Mosaic Elements
    const ticketsMosaic = document.getElementById('tickets-mosaic');
    const mosaicContainer = document.getElementById('tickets-mosaic-container');

    // ... (State Variables etc remain) ...

    // Helper for Scroll Lock
    function toggleBodyScroll(lock) {
        if (lock) {
            document.body.classList.add('lock-scroll');
        } else {
            // Only unlock if NO other modals are active and menu is closed
            const activeModals = document.querySelectorAll('.modal.active').length;
            const menuActive = navMenu && navMenu.classList.contains('active');
            if (activeModals === 0 && !menuActive) {
                document.body.classList.remove('lock-scroll');
                document.body.classList.remove('menu-open');
            }
        }
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        toggleBodyScroll(true);
    }

    function closeAllModals() {
        const modals = [userDataModal, quantityModal, manualModal, chestModal, luckyQuantityModal, myTicketsModal, paymentMethodsModal, faqModal];
        modals.forEach(m => {
            if (m) m.classList.remove('active');
        });
        toggleBodyScroll(false);
    }

    // Close Modals
    closeModals.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // ... (Event Listeners) ...

    async function checkUserDB(phone) {
        if (!window.sbClient) return;

        userNameInput.placeholder = "Buscando...";

        const { data, error } = await window.sbClient
            .from('tickets')
            .select('client_name, client_state')
            .eq('client_phone', phone)
            .limit(1)
            .single();

        if (data) {
            // FOUND: Fill and LOCK
            if (data.client_name) {
                const parts = data.client_name.split(' ');
                userNameInput.value = parts[0];
                userLastnameInput.value = parts.slice(1).join(' ');
            }
            userStateInput.value = data.client_state || '';

            // Keep disabled!
            userNameInput.disabled = true;
            userLastnameInput.disabled = true;
            userStateInput.disabled = true;

            // Visual feedback
            userNameInput.style.borderColor = '#a8e6cf'; // Pastel Mint
            userLastnameInput.style.borderColor = '#a8e6cf';
        } else {
            // NOT FOUND: UNLOCK
            userNameInput.disabled = false;
            userLastnameInput.disabled = false;
            userStateInput.disabled = false;

            // Clear in case of retry
            userNameInput.value = '';
            userLastnameInput.value = '';
            userStateInput.value = '';
            userNameInput.focus();
            userNameInput.style.borderColor = '';
        }
        userNameInput.placeholder = "Nombre(s)";
    }

    // ... (Other functions) ...

    // ... (Functions start below) ...

    // User Data Elements
    const userPhoneInput = document.getElementById('user-phone');
    const userNameInput = document.getElementById('user-name');
    const userLastnameInput = document.getElementById('user-lastname');
    const userStateInput = document.getElementById('user-state');
    const btnConfirmUserData = document.getElementById('btn-confirm-user-data');

    // Inputs & Buttons
    const ticketQuantityInput = document.getElementById('ticket-quantity-input');
    const btnConfirmQuantity = document.getElementById('btn-confirm-quantity');
    const quantityTitle = document.getElementById('quantity-title');

    // Manual Modal Elements
    const manualSearchInput = document.getElementById('manual-search-input');
    const btnSearchAdd = document.getElementById('btn-search-add');
    const manualCurrentCount = document.getElementById('manual-current-count');
    const manualTotalCount = document.getElementById('manual-total-count');
    const manualProgressFill = document.getElementById('manual-progress-fill');
    const manualSelectedList = document.getElementById('manual-selected-list');
    const btnFinishManual = document.getElementById('btn-finish-manual');
    const searchMessage = document.getElementById('search-message');

    // Chest Elements
    const chestContainer = document.getElementById('chest-container');
    const chest3d = document.querySelector('.chest-3d');
    const scene = document.querySelector('.scene');

    // Cart Elements
    const floatingCart = document.getElementById('floating-cart');
    const cartCount = document.getElementById('cart-count');
    const btnViewCart = document.getElementById('btn-view-cart');

    // --- Init Loading Screen ---
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        window.addEventListener('load', () => {
            // Short delay to ensure assets are painted
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 800);
        });
    }

    // --- Event Listeners ---

    // 1. Initial Interactions -> Open User Data First
    btnManual.addEventListener('click', () => {
        currentMode = 'manual';
        openUserDataModal();
    });

    btnLucky.addEventListener('click', () => {
        currentMode = 'lucky';
        openUserDataModal();
    });

    // Cart Button -> Checkout (WhatsApp)
    btnViewCart.addEventListener('click', () => {
        proceedToPayment();
    });

    // --- Header Actions ---

    btnMisBoletosHeader.addEventListener('click', () => {
        myTicketsModal.classList.add('active');
        lookupPhoneInput.focus();
    });

    btnPaymentMethods.addEventListener('click', () => {
        paymentMethodsModal.classList.add('active');
    });

    if (btnFaqHeader) {
        btnFaqHeader.addEventListener('click', () => {
            openModal(faqModal);
        });
    }

    btnSearchTickets.addEventListener('click', lookupTickets);
    lookupPhoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') lookupTickets();
    });

    // Close all modals generic
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            // Clear inputs when closing any modal
            if (manualSearchInput) manualSearchInput.value = '';
            if (lookupPhoneInput) lookupPhoneInput.value = '';
        });
    });


    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
            toggleBodyScroll(false);
            // Clear inputs
            if (manualSearchInput) manualSearchInput.value = '';
            if (lookupPhoneInput) lookupPhoneInput.value = '';
        }
    };

    // 2. User Data Form Logic
    // Removed redundant blur listener - input listener handles this now

    btnConfirmUserData.addEventListener('click', () => {
        if (validateUserData()) {
            userDataModal.classList.remove('active');
            // Reverted Flow: Separate paths
            if (currentMode === 'lucky') {
                startLuckyChestSequence();
            } else {
                openQuantityModal(currentMode);
            }
        }
    });

    // ... (Logic Functions) ...
    userPhoneInput.addEventListener('input', handlePhoneInput);

    async function handlePhoneInput(e) {
        const phone = e.target.value.replace(/\D/g, ''); // Numeric only
        if (phone.length === 10) {
            // Check DB
            await checkUserDB(phone);
        } else {
            // Reset/Disable if number incomplete
            // Only disable if we are strictly enforcing 10 digits before entry
            // But to be safe, we disable until 10 digits (common pattern)
            userNameInput.disabled = true;
            userLastnameInput.disabled = true;
            userStateInput.disabled = true;

            // Only clear if user is backspacing significantly? 
            // Better to keep clear for security/consistency if they change number
            if (phone.length < 10) {
                userNameInput.value = '';
                userLastnameInput.value = '';
                userStateInput.value = '';
                userNameInput.style.borderColor = '';
            }
        }
    }

    async function checkUserDB(phone) {
        if (!window.sbClient) {
            console.warn("Supabase client not found, unlocking fields manually.");
            unlockUserFields();
            return;
        }

        userNameInput.placeholder = "Buscando...";

        try {
            const { data, error } = await window.sbClient
                .from('tickets')
                .select('client_name, client_state')
                .eq('client_phone', phone)
                .limit(1)
                .single();

            if (data) {
                if (data.client_name) {
                    const parts = data.client_name.split(' ');
                    userNameInput.value = parts[0];
                    userLastnameInput.value = parts.slice(1).join(' ');
                }
                userStateInput.value = data.client_state || '';

                // Visual feedback of success
                userNameInput.style.borderColor = '#a8e6cf'; // Pastel Mint
                // Found -> KEEP DISABLED (Auto-filled)
                userNameInput.disabled = true;
                userLastnameInput.disabled = true;
                userStateInput.disabled = true;
            } else {
                // Not found -> Unlock
                unlockUserFields();
            }
        } catch (err) {
            console.error("Error checking user DB:", err);
            // On error, safest bet is to UNLOCK so user can continue
            unlockUserFields();
        }

        userNameInput.placeholder = "Nombre(s)";
    }

    function unlockUserFields() {
        userNameInput.disabled = false;
        userLastnameInput.disabled = false;
        userStateInput.disabled = false;
        userNameInput.style.borderColor = '';
        // Focus name if empty
        if (!userNameInput.value) userNameInput.focus();
    }

    function openUserDataModal() {
        openModal(userDataModal);
        userPhoneInput.focus();
        // Initialize disabled state for smart form
        userNameInput.disabled = true;
        userLastnameInput.disabled = true;
        userStateInput.disabled = true;
    }


    // --- Supabase Database Integration ---
    // (Logic moved to handlePhoneInput and checkUserDB above)


    function validateUserData() {
        const phone = userPhoneInput.value.trim();
        const name = userNameInput.value.trim();
        const lastname = userLastnameInput.value.trim();
        const state = userStateInput.value;

        if (phone.length < 10 || name === '' || lastname === '' || state === '') {
            alert('Por favor completa todos los datos para continuar.');
            return false;
        }

        currentUser = { phone, name, lastname, state };
        return true;
    }

    function openQuantityModal(mode) {
        quantityTitle.textContent = mode === 'manual'
            ? '¿Cuántos boletos quieres elegir manualmente?'
            : '¿Cuántos boletos quieres que la suerte elija por ti?';

        populateQuantitySelect();

        // Re-attach confirm button listener (since we replaced it in HTML sometimes or just want to be sure)
        // Access element freshly
        const confirmBtn = document.getElementById('btn-confirm-quantity');
        const select = document.getElementById('ticket-quantity-select');

        confirmBtn.onclick = () => {
            const qty = parseInt(select.value);
            if (qty > 0) {
                targetQuantity = qty;
                quantityModal.classList.remove('active');
                startSelectionFlow();
            }
        };

        openModal(quantityModal);
    }

    function populateQuantitySelect() {
        const select = document.getElementById('ticket-quantity-select');
        if (!select) return;
        select.innerHTML = '';

        // Add default placeholder
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        defaultOpt.textContent = "Selecciona cantidad...";
        select.appendChild(defaultOpt);

        const amounts = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            15, 20, 25, 30,
            40, 50, 60, 70, 80, 90, 100,
            150, 200, 250, 300, 500
        ];

        amounts.forEach(amt => {
            const opt = document.createElement('option');
            opt.value = amt;
            // Format nice text: "10 Boletos - $10"
            opt.textContent = `${amt} Boleto${amt > 1 ? 's' : ''} - $${amt}`;
            select.appendChild(opt);
        });
    }

    function startSelectionFlow() {
        if (currentMode === 'manual') {
            openManualModal();
        } else if (currentMode === 'lucky') {
            startLuckyChestSequence();
        }
    }

    // --- Fetch Taken Tickets from Database ---
    // Only considers: 1) Paid tickets 2) Reserved tickets within 5 hours
    async function fetchTakenTickets() {
        if (!window.sbClient) return new Set();

        try {
            const allTaken = [];
            const BATCH_SIZE = 1000;
            let from = 0;
            let hasMore = true;

            // Calculate 5 hours ago timestamp
            const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

            while (hasMore) {
                // Fetch paid tickets OR reserved tickets created within last 5 hours
                const { data, error } = await window.sbClient
                    .from('tickets')
                    .select('ticket_number, status, created_at')
                    .or(`status.eq.paid,and(status.eq.reserved,created_at.gte.${fiveHoursAgo})`)
                    .range(from, from + BATCH_SIZE - 1);

                if (error) {
                    console.error('Error fetching taken tickets:', error);
                    break;
                }

                if (data && data.length > 0) {
                    allTaken.push(...data.map(t => t.ticket_number));
                    from += BATCH_SIZE;
                    if (data.length < BATCH_SIZE) hasMore = false;
                } else {
                    hasMore = false;
                }
            }

            // console.log(`[TAKEN] Fetched ${allTaken.length} valid taken tickets`);
            return new Set(allTaken);
        } catch (err) {
            console.error('Error in fetchTakenTickets:', err);
            return new Set();
        }
    }

    // --- Manual Selection Logic ---
    async function openManualModal() {
        manualModal.classList.add('active');
        manualModal.classList.remove('lucky-summary-mode'); // Ensure normal selection mode

        // Ensure UI elements are visible (in case they were hidden by Lucky Summary)
        // Set to empty string to use CSS defaults (display: block for tracker, display: flex for search-box)
        document.querySelector('.manual-tracker').style.display = '';
        document.querySelector('.search-box').style.display = '';
        if (mosaicContainer) mosaicContainer.style.display = 'block';

        manualModal.querySelector('h3').textContent = 'Selecciona tus boletos'; // Reset title

        // Reset State FIRST
        selectedTickets = [];
        updateManualTracker();

        manualSearchInput.value = '';
        manualSelectedList.innerHTML = '';

        // Re-attach standard finish listener
        btnFinishManual.onclick = () => proceedToPayment();

        // Update Button Text for Direct Checkout
        btnFinishManual.textContent = "Apartar y Pagar";
        btnFinishManual.disabled = true;

        // Show loading state
        searchMessage.textContent = 'Cargando boletos disponibles...';
        searchMessage.className = 'status-message';

        // Fetch taken tickets BEFORE rendering mosaic
        takenTicketsSet = await fetchTakenTickets();

        searchMessage.textContent = '';
        manualSearchInput.focus();

        renderMosaic();
    }

    // --- Mosaic Grid Logic ---
    let mosaicBatchIndex = 0;
    const MOSAIC_BATCH_SIZE = 500;
    const MOSAIC_TOTAL = 100000;

    function renderMosaic() {
        ticketsMosaic.innerHTML = '';
        mosaicBatchIndex = 0;
        loadMosaicBatch();
    }

    function loadMosaicBatch() {
        if (mosaicBatchIndex >= MOSAIC_TOTAL) return;

        const fragment = document.createDocumentFragment();
        const end = Math.min(mosaicBatchIndex + MOSAIC_BATCH_SIZE, MOSAIC_TOTAL);

        for (let i = mosaicBatchIndex; i < end; i++) {
            const num = i.toString().padStart(5, '0');

            // SKIP taken tickets entirely - don't show them at all
            if (takenTicketsSet.has(num)) {
                continue; // Don't create tile for taken tickets
            }

            const tile = document.createElement('div');
            tile.className = 'ticket-tile';
            tile.textContent = num;
            tile.dataset.number = num;

            if (selectedTickets.includes(num)) {
                tile.classList.add('selected');
            }

            tile.addEventListener('click', () => toggleTicketSelection(num, tile));
            fragment.appendChild(tile);
        }

        ticketsMosaic.appendChild(fragment);
        mosaicBatchIndex = end;

        // Load next batch if user scrolls near bottom or just chain them for now
        if (mosaicBatchIndex < 2000) { // Load first few batches immediately
            setTimeout(loadMosaicBatch, 10);
        }
    }

    // Load on scroll
    mosaicContainer.addEventListener('scroll', () => {
        if (mosaicContainer.scrollTop + mosaicContainer.clientHeight >= mosaicContainer.scrollHeight - 50) {
            loadMosaicBatch();
        }
    });

    function toggleTicketSelection(num, tile) {
        if (selectedTickets.includes(num)) {
            // Remove
            selectedTickets = selectedTickets.filter(n => n !== num);
            tile.classList.remove('selected');
            updateManualTracker();
            syncSelectedList();
        } else {
            // Add if not full
            if (selectedTickets.length < targetQuantity) {
                selectedTickets.push(num);
                tile.classList.add('selected');
                updateManualTracker();
                syncSelectedList();
            } else {
                searchMessage.textContent = 'Has alcanzado el límite de boletos.';
                searchMessage.className = 'status-message status-error';
            }
        }
    }

    function syncSelectedList() {
        manualSelectedList.innerHTML = '';
        selectedTickets.forEach(t => renderTicketPill(t, true));
    }

    function updateManualTracker() {
        manualCurrentCount.textContent = selectedTickets.length;
        manualTotalCount.textContent = targetQuantity;
        const pct = (selectedTickets.length / targetQuantity) * 100;
        manualProgressFill.style.width = `${pct}%`;

        if (selectedTickets.length === targetQuantity) {
            btnFinishManual.disabled = false;
            searchMessage.textContent = '¡Listo! Has completado tu selección.';
            searchMessage.className = 'status-message status-success';
        } else {
            btnFinishManual.disabled = true;
            searchMessage.textContent = '';
        }
    }

    async function addManualTicket() {
        if (selectedTickets.length >= targetQuantity) {
            searchMessage.textContent = 'Ya has seleccionado todos tus boletos.';
            searchMessage.className = 'status-message status-error';
            return;
        }

        const ticketNum = manualSearchInput.value.trim();
        if (!/^\d{1,5}$/.test(ticketNum)) {
            searchMessage.textContent = 'Ingresa un número válido (hasta 5 dígitos).';
            searchMessage.className = 'status-message status-error';
            return;
        }

        const formattedTicket = ticketNum.padStart(5, '0');

        if (selectedTickets.includes(formattedTicket)) {
            searchMessage.textContent = 'Este número ya está en tu lista.';
            searchMessage.className = 'status-message status-error';
            return;
        }

        // Check local cache first
        if (takenTicketsSet.has(formattedTicket)) {
            searchMessage.textContent = 'Este boleto ya está ocupado.';
            searchMessage.className = 'status-message status-error';
            return;
        }

        searchMessage.textContent = 'Verificando...';

        // Supabase Availability Check (double-check against DB with 5-hour expiration)
        if (window.sbClient) {
            const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
            const { data } = await window.sbClient
                .from('tickets')
                .select('ticket_number, status, created_at')
                .eq('ticket_number', formattedTicket)
                .or(`status.eq.paid,and(status.eq.reserved,created_at.gte.${fiveHoursAgo})`)
                .single();

            if (data) {
                // Add to local cache (tile is already hidden since taken tickets aren't rendered)
                takenTicketsSet.add(formattedTicket);
                searchMessage.textContent = 'Este boleto ya está ocupado.';
                searchMessage.className = 'status-message status-error';
                return;
            }
        }

        selectedTickets.push(formattedTicket);
        renderTicketPill(formattedTicket, true);
        updateManualTracker();

        // Update mosaic tile
        const tile = ticketsMosaic.querySelector(`.ticket-tile[data-number="${formattedTicket}"]`);
        if (tile) tile.classList.add('selected');

        manualSearchInput.value = '';
        manualSearchInput.focus();
        searchMessage.textContent = `Boleto #${formattedTicket} agregado.`;
        searchMessage.className = 'status-message status-success';
    }

    function renderTicketPill(ticket, allowRemoval = true) {
        const pill = document.createElement('div');
        pill.className = 'ticket-pill';

        if (allowRemoval) {
            pill.innerHTML = `#${ticket} <span class="remove-ticket" data-ticket="${ticket}">&times;</span>`;
            pill.querySelector('.remove-ticket').addEventListener('click', (e) => {
                const t = e.target.dataset.ticket;
                selectedTickets = selectedTickets.filter(num => num !== t);
                pill.remove();
                updateManualTracker();
                // If mosaic is visible, unselect the tile
                const tile = ticketsMosaic.querySelector(`.ticket-tile[data-number="${t}"]`);
                if (tile) tile.classList.remove('selected');
            });
        } else {
            pill.innerHTML = `#${ticket}`;
        }

        manualSelectedList.appendChild(pill);
    }

    // --- Lucky Chest Logic ---

    function startLuckyChestSequence(prefillQty = null) {
        if (chestModal) openModal(chestModal);
        chestContainer.style.display = 'block';
        chestContainer.classList.remove('chest-open');

        // Clear previous particles
        const particlesContainer = document.querySelector('.particles');
        if (particlesContainer) particlesContainer.innerHTML = '';

        // Use enhancement for combined modal
        let enhancementActive = false;
        if (window.initLuckyEnhancement) {
            enhancementActive = true;
            window.initLuckyEnhancement(
                chestModal,
                chestContainer,
                generateLuckyNumbers,
                createAdvancedParticles,
                (qty) => { targetQuantity = qty; },
                prefillQty
            );
        }

        // Initialize 3D Heart with a small delay
        requestAnimationFrame(() => {
            if (window.init3DHeart) {
                window.init3DHeart();
            } else {
                console.error("Critical: heart3d.js not loaded.");
                alert("Error: No se ha cargado el módulo del corazón 3D (heart3d.js).");
            }
        });

        // Only attach default listener if enhancement is NOT active
        // The enhancement handles its own click logic with quantity validation
        if (!enhancementActive) {
            // Interaction Handler
            let clickCount = 0;

            // Interaction Handler
            if (window.updateChestInstruction) {
                // window.updateChestInstruction('Toca el corazón para descubrir tus números');
            }

            // Cleanup previous listener
            if (chestContainer._onChestClick) {
                chestContainer.removeEventListener('click', chestContainer._onChestClick);
            }

            const onChestClick = () => {
                chestContainer.removeEventListener('click', onChestClick);
                chestContainer._onChestClick = null;

                if (window.updateChestInstruction) window.updateChestInstruction('');

                if (window.startHeartBreak) {
                    window.startHeartBreak(() => {
                        generateLuckyNumbers();
                        createAdvancedParticles();
                    });
                }
            };

            chestContainer._onChestClick = onChestClick;
            chestContainer.addEventListener('click', onChestClick);
        }
    }

    // Create orbiting sparkle particles during spin
    function createSpinParticles() {
        const scene = document.querySelector('.scene');
        if (!scene) return;

        const particleCount = 12;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'spin-particle';

            // Random orbit radius and speed
            const orbitRadius = 80 + Math.random() * 60;
            const duration = 0.4 + Math.random() * 0.3;
            const delay = (i / particleCount) * 0.3;
            const startAngle = (i / particleCount) * 360;

            particle.style.cssText = `
                --orbit-radius: ${orbitRadius}px;
                top: 50%;
                left: 50%;
                animation: orbitSpin ${duration}s linear infinite, sparkleTrail 0.3s ease-in-out infinite alternate;
                animation-delay: ${delay}s;
                transform: rotate(${startAngle}deg) translateX(${orbitRadius}px);
            `;

            scene.appendChild(particle);
        }
    }

    // Remove spin particles
    function removeSpinParticles() {
        const particles = document.querySelectorAll('.spin-particle');
        particles.forEach(p => p.remove());
    }

    async function generateLuckyNumbers(qtyOverride) {
        let results = [];
        let attempts = 0;
        const maxAttempts = 300;
        // Use override if provided (from lucky enhancement), otherwise use state
        let target = 0;
        if (typeof qtyOverride === 'number') {
            target = qtyOverride;
            // Also update global state to keep in sync
            targetQuantity = target;
        } else {
            target = parseInt(targetQuantity);
        }

        console.log(`[LUCKY] Iniciando generación de ${target} boletos... (Source: ${typeof qtyOverride === 'number' ? 'Override' : 'State'})`);

        // Fetch fresh taken tickets set for Lucky mode
        const freshTakenSet = await fetchTakenTickets();
        takenTicketsSet = freshTakenSet; // Update global cache

        while (results.length < target && attempts < maxAttempts) {
            attempts++;
            let stillNeeded = target - results.length;

            let candidates = new Set();
            let localAttempts = 0;
            while (candidates.size < stillNeeded && localAttempts < 1000) {
                let candidate = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                // Check against cache AND already selected
                if (!results.includes(candidate) && !takenTicketsSet.has(candidate)) {
                    candidates.add(candidate);
                }
                localAttempts++;
            }

            let candidateArray = Array.from(candidates);

            // Double-check against DB for any race conditions
            if (window.sbClient && candidateArray.length > 0) {
                try {
                    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
                    const { data: taken, error } = await window.sbClient
                        .from('tickets')
                        .select('ticket_number')
                        .in('ticket_number', candidateArray)
                        .or(`status.eq.paid,and(status.eq.reserved,created_at.gte.${fiveHoursAgo})`);

                    if (!error) {
                        const takenSetDB = new Set((taken || []).map(t => t.ticket_number));
                        const available = candidateArray.filter(t => !takenSetDB.has(t));
                        // Update cache with any newly found taken
                        takenSetDB.forEach(t => takenTicketsSet.add(t));
                        if (available.length > 0) results.push(...available);
                    } else {
                        // On error, only add candidates that passed cache check
                        results.push(...candidateArray);
                    }
                } catch (err) {
                    console.error('[LUCKY] DB check error:', err);
                    results.push(...candidateArray);
                }
            } else {
                results.push(...candidateArray);
            }
        }

        // Fallback: if still not enough, generate more but only from non-taken
        if (results.length < target) {
            let fallbackAttempts = 0;
            while (results.length < target && fallbackAttempts < 10000) {
                let candidate = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                if (!results.includes(candidate) && !takenTicketsSet.has(candidate)) {
                    results.push(candidate);
                }
                fallbackAttempts++;
            }
        }

        results = [...new Set(results)].slice(0, target);
        console.log(`[LUCKY] Generated ${results.length} tickets successfully`);
        if (target <= 5) {
            animateSingleTickets(results);
        } else {
            animateBatchTickets(results);
        }
    }

    function animateSingleTickets(tickets) {
        // Show tickets floating out one by one
        // Simulating the effect by adding elements to .particles container or new container
        // For now, simpler implementation:

        // Placeholder for single ticket animation logic
        // ...

        // After delay, show summary
        setTimeout(() => showLuckySummary(tickets), tickets.length * 500 + 1000); // Faster duration
    }

    function animateBatchTickets(tickets) {
        // "Rain" effect handled by particles already somewhat
        // Just show summary faster
        setTimeout(() => showLuckySummary(tickets), 2000); // 2s of particles then summary
    }

    function showLuckySummary(tickets) {
        if (chestModal) chestModal.classList.remove('active');

        // Show Summary using standard helper
        openModal(manualModal);

        // Add class for lucky summary specific styling
        manualModal.classList.add('lucky-summary-mode');

        manualModal.querySelector('h3').textContent = '¡Tus Números de la Suerte!';

        manualSelectedList.innerHTML = '';
        tickets.forEach(t => renderTicketPill(t, false));

        btnFinishManual.textContent = "Apartar y Pagar";
        btnFinishManual.disabled = false;

        // COMMIT logic: only update global state when user confirms
        btnFinishManual.onclick = () => {
            selectedTickets = tickets;
            manualModal.classList.remove('lucky-summary-mode');
            proceedToPayment();
        };

        searchMessage.textContent = `Se han generado ${tickets.length} boletos disponibles.`;
        searchMessage.className = 'status-message status-success';

        // Hide manual entry UI elements for this view
        document.querySelector('.manual-tracker').style.display = 'none';
        document.querySelector('.search-box').style.display = 'none';
        if (mosaicContainer) mosaicContainer.style.display = 'none';

        // Add "Try Again" Button
        const tryAgainBtn = document.createElement('button');
        tryAgainBtn.className = 'btn-reset-lucky';
        tryAgainBtn.id = 'btn-reopen-chest-summary';
        tryAgainBtn.innerText = '¿No te gustaron? Inténtalo de nuevo';
        tryAgainBtn.onclick = () => {
            manualModal.classList.remove('active');
            manualModal.classList.remove('lucky-summary-mode');
            // Pass previous quantity to prefill
            startLuckyChestSequence(tickets.length);
        };
        manualSelectedList.appendChild(tryAgainBtn);
    }

    // --- Cart & Checkout Logic ---
    function updateCart() {
        // This function is now largely unused due to direct checkout
        const count = selectedTickets.length;
        cartCount.textContent = count;
        if (count > 0) {
            floatingCart.classList.remove('hidden');
            btnViewCart.textContent = 'Proceder al Pago';
        } else {
            floatingCart.classList.add('hidden');
        }
    }

    // --- Direct Checkout Logic ---

    async function proceedToPayment() {
        if (!currentUser || selectedTickets.length === 0) {
            alert('Selecciona boletos primero.');
            return;
        }

        btnFinishManual.textContent = 'Validando disponibilidad...';
        btnFinishManual.disabled = true;

        // 0. SECURITY CHECK: Debt Limit (Anti-Hoarding) - 2000 Tickets
        if (window.sbClient) {
            try {
                const { count: currentDebt, error: debtError } = await window.sbClient
                    .from('tickets')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_phone', currentUser.phone)
                    .eq('status', 'reserved');

                if (!debtError && currentDebt >= 2000) {
                    alert(`⚠️ Límite de seguridad excedido.\n\nTu número ya tiene ${currentDebt} boletos apartados sin pagar.\n\nPor favor liquida tus apartados anteriores o espera a que expiren antes de solicitar más.`);
                    btnFinishManual.textContent = 'Apartar y Pagar';
                    btnFinishManual.disabled = false;
                    return;
                }
            } catch (err) {
                console.error('Debt warning:', err);
            }
        }

        // 1. FINAL AVAILABILITY CHECK before insert (with 5-hour expiration)
        if (window.sbClient) {
            try {
                // Check which of the selected tickets are ACTUALLY taken (paid OR reserved within 5h)
                const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
                const { data: nowTaken, error: checkError } = await window.sbClient
                    .from('tickets')
                    .select('ticket_number')
                    .in('ticket_number', selectedTickets)
                    .or(`status.eq.paid,and(status.eq.reserved,created_at.gte.${fiveHoursAgo})`);

                if (checkError) {
                    console.error('Error checking availability:', checkError);
                    alert('Error verificando disponibilidad. Intenta nuevamente.');
                    btnFinishManual.textContent = 'Apartar y Pagar';
                    btnFinishManual.disabled = false;
                    return;
                }

                // If any tickets are now taken, alert user and remove them
                if (nowTaken && nowTaken.length > 0) {
                    const takenNums = nowTaken.map(t => t.ticket_number);
                    // Alert user about specific taken tickets
                    const takenList = takenNums.slice(0, 10).join(', ');
                    const moreText = takenNums.length > 10 ? ` y ${takenNums.length - 10} más` : '';

                    alert(`¡Atención! Los siguientes boletos ya fueron apartados por alguien más: ${takenList}${moreText}. Por favor selecciona otros números.`);

                    // Remove taken tickets from selection
                    selectedTickets = selectedTickets.filter(t => !takenNums.includes(t));

                    // Update taken set and re-render
                    takenNums.forEach(n => takenTicketsSet.add(n));
                    updateManualTracker();
                    syncSelectedList();
                    renderMosaic();

                    btnFinishManual.textContent = 'Apartar y Pagar';
                    btnFinishManual.disabled = selectedTickets.length !== targetQuantity;
                    return;
                }
            } catch (err) {
                console.error('Error in availability check:', err);
                alert('Error de conexión. Intenta nuevamente.');
                btnFinishManual.textContent = 'Apartar y Pagar';
                btnFinishManual.disabled = false;
                return;
            }
        }

        btnFinishManual.textContent = 'Procesando...';

        // 2. Insert into Supabase (now with conflict handling)
        if (window.sbClient) {
            const rows = selectedTickets.map(num => ({
                ticket_number: num,
                client_name: `${currentUser.name} ${currentUser.lastname}`,
                client_phone: currentUser.phone,
                client_state: currentUser.state,
                status: 'reserved'
            }));

            // Chunk Inserts to avoid limits (500 per request)
            const chunkSize = 500;
            let allSuccess = true;
            let failedTickets = [];

            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const { error } = await window.sbClient.from('tickets').insert(chunk);

                if (error) {
                    console.error("Chunk insert error:", error);

                    // Handle unique constraint violation
                    if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                        // Some tickets in this chunk were duplicates
                        failedTickets.push(...chunk.map(r => r.ticket_number));
                        allSuccess = false;
                    } else {
                        alert('Ocurrió un error al apartar. Intenta nuevamente.');
                        btnFinishManual.textContent = 'Apartar y Pagar';
                        btnFinishManual.disabled = false;
                        return;
                    }
                }
            }

            if (!allSuccess && failedTickets.length > 0) {
                console.log('Issues with some tickets:', failedTickets);
            }
        }

        // 2. WhatsApp Redirection (Updated Number)
        const total = selectedTickets.length * TICKET_PRICE;
        let message = `¡Hola! Quiero proceder al pago de mis boletos.\n\n`;
        message += `👤 *Datos del Usuario*:\nNombre: ${currentUser.name} ${currentUser.lastname}\nTeléfono: ${currentUser.phone}\nEstado: ${currentUser.state}\n\n`;
        message += `🎫 *Boletos Apartados* (${selectedTickets.length}):\n${selectedTickets.join(', ')}\n\n`;
        message += `💰 *Total a Pagar*: $${total} MXN\n\n`;
        message += `💸 *MÉTODOS DE PAGO* 💸\n`;
        message += `🏦 *Transferencia Citibanamex*\nTitular: Marisela Enriquez\nCLABE: 000 000 0000 0000 0000\n\n`;
        message += `🏪 *OXXO / Depósito*\nTitular: Marisela Enriquez\nTarjeta: 0000 0000 0000 0000\n\n`;
        message += `📸 *IMPORTANTE*:\n`;
        message += `1. Envía FOTO del comprobante en este chat.\n`;
        message += `2. Tienes un máximo de *5 HORAS* para pagar.\n`;

        const phoneNum = '526444627178'; // Corrected
        const url = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(message)}`;
        const directUrl = `whatsapp://send?phone=${phoneNum}&text=${encodeURIComponent(message)}`;

        // Attempt direct protocol
        window.location.href = directUrl;

        // Fallback to web link if protocol isn't handled after a short delay
        setTimeout(() => {
            window.location.href = url;

            // --- POST-PURCHASE CLEANUP ---
            // Close modals and reset manual selection to "Index" state
            // This prevents users from thinking their previous tickets were not saved if they return
            setTimeout(() => {
                closeAllModals();
                selectedTickets = [];
                updateManualTracker();
                if (manualSelectedList) manualSelectedList.innerHTML = '';
            }, 1000); // Small delay to ensure WhatsApp opens first
        }, 500);
    }

    // --- Lookup Logic ---

    async function lookupTickets() {
        const phone = lookupPhoneInput.value.trim();
        if (phone.length < 10) {
            alert('Ingresa tu teléfono de 10 dígitos.');
            return;
        }

        lookupResults.innerHTML = '<p style="margin-top:20px;">Buscando...</p>';

        if (!window.sbClient) return;

        try {
            const { data, error } = await window.sbClient
                .from('tickets')
                .select('*')
                .eq('client_phone', phone)
                .order('created_at', { ascending: false })
                .limit(5000);

            if (error) throw error;

            if (!data || data.length === 0) {
                lookupResults.innerHTML = '<p style="margin-top:20px; color: #ff4444;">No se encontraron boletos para este número.</p>';
            } else {
                lookupResults.innerHTML = '';
                data.forEach(ticket => {
                    const item = document.createElement('div');
                    item.className = 'lookup-item';

                    const statusText = ticket.status === 'paid' ? 'Pagado' : 'Apartado';
                    const statusClass = ticket.status === 'paid' ? 'status-paid' : 'status-reserved';

                    item.innerHTML = `
                        <div>
                            <strong style="font-size: 1.1rem; color: var(--primary);">#${ticket.ticket_number}</strong>
                            <div style="font-size: 0.8rem; color: #aaa;">${new Date(ticket.created_at).toLocaleDateString()}</div>
                        </div>
                        <span class="ticket-status-badge ${statusClass}">${statusText}</span>
                    `;
                    lookupResults.appendChild(item);
                });
            }
        } catch (err) {
            console.error(err);
            lookupResults.innerHTML = '<p style="margin-top:20px; color: #ff4444;">Error al consultar. Intenta después.</p>';
        }
    }
    function createAdvancedParticles() {
        const container = document.querySelector('.particles');
        if (!container) return;
        container.innerHTML = '';
        const particleCount = targetQuantity > 10 ? 100 : 50;
        for (let i = 0; i < particleCount; i++) {
            const ticket = document.createElement('div');
            ticket.className = 'gold-ticket';
            const angleDeg = 200 + Math.random() * 140;
            const angleRad = angleDeg * (Math.PI / 180);
            const distance = 100 + Math.random() * 200;
            const tx = Math.cos(angleRad) * distance;
            const ty = Math.sin(angleRad) * distance;
            const rot = -720 + Math.random() * 1440;
            ticket.style.setProperty('--tx', `${tx}px`);
            ticket.style.setProperty('--ty', `${ty}px`);
            ticket.style.setProperty('--rot', `${rot}deg`);
            ticket.style.animationDelay = `${Math.random() * 0.1}s`;
            container.appendChild(ticket);
        }
    }

    // --- Countdown Logic ---
    // Target Date: A fixed point in time so it's consistent for all users
    const targetTime = new Date('February 14, 2026 20:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const gap = targetTime - now;

        if (gap <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minsEl.textContent = '00';
            secsEl.textContent = '00';
            return;
        }

        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        const d = Math.floor(gap / day);
        const h = Math.floor((gap % day) / hour);
        const m = Math.floor((gap % hour) / minute);
        const s = Math.floor((gap % minute) / second);

        daysEl.textContent = d.toString().padStart(2, '0');
        hoursEl.textContent = h.toString().padStart(2, '0');
        minsEl.textContent = m.toString().padStart(2, '0');
        secsEl.textContent = s.toString().padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown(); // Init

    // --- Mobile Menu Interaction ---
    const navActionsButtons = document.querySelectorAll('.nav-actions button');

    function toggleMenu() {
        navMenu.classList.toggle('active');
        const isOpen = navMenu.classList.contains('active');
        if (isOpen) {
            document.body.classList.add('menu-open');
            document.body.classList.add('lock-scroll');
        } else {
            toggleBodyScroll(false);
        }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);

    // Close menu when clicking a button inside it
    navActionsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });

    // Close menu when clicking outside the menu content on the overlay
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !mobileMenuBtn.contains(e.target)) {
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // --- Progress Bar Real-time Logic ---
    const TOTAL_TICKETS = 100000;
    const progressFill = document.querySelector('.progress-fill-animated');

    async function updateProgressBar() {
        if (!window.sbClient) return;

        // Count only 'paid' tickets for the progress
        const { count, error } = await window.sbClient
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'paid');

        if (error) {
            console.error('Error fetching progress:', error);
            return;
        }

        const percentage = (count / TOTAL_TICKETS) * 100;
        // Minimum 1% so it's visible, max 100%
        const displayPercentage = Math.max(1, Math.min(100, percentage));

        if (progressFill) {
            progressFill.style.width = `${displayPercentage}%`;
        }
    }

    // Initial load
    updateProgressBar();
    // Refresh every 5 minutes
    setInterval(updateProgressBar, 5 * 60 * 1000);
});
