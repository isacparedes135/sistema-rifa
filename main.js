document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let selectedTickets = [];
    let targetQuantity = 0;
    let currentMode = ''; // 'manual' or 'lucky'
    let currentUser = null; // { name, lastname, phone, state }
    const TICKET_PRICE = 500; // Example price

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

    // Buttons
    const btnMisBoletosHeader = document.getElementById('btn-mis-boletos');
    const btnPaymentMethods = document.getElementById('btn-payment-methods');

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
        const modals = [userDataModal, quantityModal, manualModal, chestModal, luckyQuantityModal, myTicketsModal, paymentMethodsModal];
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
            userNameInput.style.borderColor = '#22c55e';
            userLastnameInput.style.borderColor = '#22c55e';
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

    btnSearchTickets.addEventListener('click', lookupTickets);
    lookupPhoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') lookupTickets();
    });

    // Close all modals generic
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        });
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };

    // 2. User Data Form Logic
    userPhoneInput.addEventListener('blur', () => {
        const phone = userPhoneInput.value.replace(/\D/g, '');
        if (phone.length === 10) {
            checkMockUser(phone);
        }
    });

    btnConfirmUserData.addEventListener('click', () => {
        if (validateUserData()) {
            userDataModal.classList.remove('active');
            // Proceed to Original Flow
            openQuantityModal(currentMode);
        }
    });

    // 3. Confirm Quantity
    btnConfirmQuantity.addEventListener('click', () => {
        const qty = parseInt(ticketQuantityInput.value);
        if (qty > 0 && qty <= 500) {
            targetQuantity = qty;
            quantityModal.classList.remove('active');
            startSelectionFlow();
        } else {
            alert('Por favor ingresa una cantidad válida (1-500)');
        }
    });

    // Manual Search Add
    btnSearchAdd.addEventListener('click', addManualTicket);
    manualSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addManualTicket();
    });

    // Finish Selection Manually
    btnFinishManual.addEventListener('click', () => {
        proceedToPayment();
    });

    // Cart Button -> Checkout (WhatsApp)
    btnViewCart.addEventListener('click', () => {
        proceedToPayment();
    });
    // Finish Selection Manually (This listener is now replaced by direct assignment in openManualModal and showLuckySummary)
    // btnFinishManual.addEventListener('click', () => {
    //     manualModal.classList.remove('active');
    //     // Flow Ends here -> User goes to Cart
    //     alert('Selección guardada. Ve al carrito para pagar.');
    // });

    // Cart Button -> Checkout (WhatsApp) (This listener is now removed)
    // btnViewCart.addEventListener('click', () => {
    //     proceedToPayment();
    // });

    // Chest Interaction (Only for Lucky Mode triggered automatically)
    // Removed old click listener to avoid conflict, logic is now centralized

    // --- Logic Functions ---

    // --- Smart Form Logic ---
    userPhoneInput.addEventListener('input', handlePhoneInput);

    async function handlePhoneInput(e) {
        const phone = e.target.value.replace(/\D/g, ''); // Numeric only
        if (phone.length === 10) {
            // Check DB
            await checkUserDB(phone);
        } else {
            // Reset/Disable if number incomplete
            userNameInput.disabled = true;
            userLastnameInput.disabled = true;
            userStateInput.disabled = true;
            userNameInput.value = '';
            userLastnameInput.value = '';
            userStateInput.value = '';
            userNameInput.style.borderColor = '';
        }
    }

    async function checkUserDB(phone) {
        if (!window.sbClient) return;

        userNameInput.placeholder = "Buscando...";

        const { data, error } = await window.sbClient
            .from('tickets')
            .select('client_name, client_state')
            .eq('client_phone', phone)
            .limit(1)
            .single();

        // Default: Keep disabled until we know result (or unlock in 'else')
        // Actually user logic: "If found, keep locked. If not found, unlock."

        if (data) {
            if (data.client_name) {
                const parts = data.client_name.split(' ');
                userNameInput.value = parts[0];
                userLastnameInput.value = parts.slice(1).join(' ');
            }
            userStateInput.value = data.client_state || '';

            // Visual feedback of success
            userNameInput.style.borderColor = '#22c55e';
            // Found -> KEEP DISABLED
            userNameInput.disabled = true;
            userLastnameInput.disabled = true;
            userStateInput.disabled = true;
        } else {
            // Not found, clear (in case of retry) and focus
            userNameInput.value = '';
            userLastnameInput.value = '';
            userStateInput.value = '';
            // NOT Found -> UNLOCK
            userNameInput.disabled = false;
            userLastnameInput.disabled = false;
            userStateInput.disabled = false;

            userNameInput.focus();
            userNameInput.style.borderColor = '';
        }

        userNameInput.placeholder = "Nombre(s)";
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
            ? '¿Cuántos boletos quieres elegir manuelmente?'
            : '¿Cuántos boletos quieres que la suerte elija por ti?';
        ticketQuantityInput.value = 1;
        openModal(quantityModal);
        ticketQuantityInput.focus();
    }

    function startSelectionFlow() {
        if (currentMode === 'manual') {
            openManualModal();
        } else if (currentMode === 'lucky') {
            startLuckyChestSequence();
        }
    }

    // --- Manual Selection Logic ---
    function openManualModal() {
        manualModal.classList.add('active');

        // Ensure UI elements are visible (in case they were hidden by Lucky Summary)
        document.querySelector('.manual-tracker').style.display = 'block';
        document.querySelector('.search-box').style.display = 'block';
        if (mosaicContainer) mosaicContainer.style.display = 'block';

        manualModal.querySelector('h3').textContent = 'Selecciona tus boletos'; // Reset title

        updateManualTracker();
        manualSearchInput.value = '';
        manualSearchInput.focus();
        manualSelectedList.innerHTML = '';
        selectedTickets = [];

        // Update Button Text for Direct Checkout
        btnFinishManual.textContent = "Apartar y Pagar";
        btnFinishManual.disabled = true;

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

        searchMessage.textContent = 'Verificando...';

        // Supabase Availability Check
        if (window.sbClient) {
            const { data } = await window.sbClient
                .from('tickets')
                .select('ticket_number')
                .eq('ticket_number', formattedTicket)
                .single();

            if (data) {
                searchMessage.textContent = 'Este boleto ya está ocupado.';
                searchMessage.className = 'status-message status-error';
                return;
            }
        }

        selectedTickets.push(formattedTicket);
        renderTicketPill(formattedTicket, true);
        updateManualTracker();
        // updateCart(); // Removed for direct checkout

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

    function startLuckyChestSequence() {
        if (chestModal) openModal(chestModal);
        chestContainer.style.display = 'block';
        chestContainer.classList.remove('chest-open');

        // Clear previous particles
        const particlesContainer = document.querySelector('.particles');
        if (particlesContainer) particlesContainer.innerHTML = '';

        // Initialize Three.js Chest with a small delay
        requestAnimationFrame(() => {
            if (window.init3DChest) {
                window.init3DChest();
            } else {
                console.error("Critical: logic chest3d.js not loaded.");
                alert("Error: No se ha cargado el módulo del cofre 3D (chest3d.js).");
            }
        });

        // Interaction Handler
        const onChestClick = () => {
            chestContainer.removeEventListener('click', onChestClick); // Execute once

            // Hide instruction text
            const instructionText = chestContainer.querySelector('.chest-instruction');
            if (instructionText) instructionText.style.display = 'none';

            // Start 3D Spin Animation
            if (window.start3DSpin) {
                window.start3DSpin(() => {
                    // Callback when chest is fully open
                    generateLuckyNumbers();
                    createAdvancedParticles(); // Keep DOM particles for now
                });
            }
        };

        chestContainer.addEventListener('click', onChestClick);
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

    async function generateLuckyNumbers() {
        selectedTickets = [];
        let attempts = 0;
        const maxAttempts = 300; // Más intentos para mayor densidad de ventas
        const target = parseInt(targetQuantity);
        console.log(`[LUCKY] Iniciando generación de ${target} boletos...`);

        while (selectedTickets.length < target && attempts < maxAttempts) {
            attempts++;
            let stillNeeded = target - selectedTickets.length;

            // Generar una lista de candidatos locales
            let candidates = new Set();
            let localAttempts = 0;
            while (candidates.size < stillNeeded && localAttempts < 1000) {
                let candidate = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                if (!selectedTickets.includes(candidate)) {
                    candidates.add(candidate);
                }
                localAttempts++;
            }

            let candidateArray = Array.from(candidates);

            if (window.sbClient && candidateArray.length > 0) {
                try {
                    const { data: taken, error } = await window.sbClient
                        .from('tickets')
                        .select('ticket_number')
                        .in('ticket_number', candidateArray);

                    if (!error) {
                        const takenSet = new Set((taken || []).map(t => t.ticket_number));
                        const available = candidateArray.filter(t => !takenSet.has(t));
                        if (available.length > 0) selectedTickets.push(...available);
                    } else {
                        selectedTickets.push(...candidateArray);
                    }
                } catch (err) {
                    selectedTickets.push(...candidateArray);
                }
            } else {
                selectedTickets.push(...candidateArray);
            }
            console.log(`[LUCKY] Intento ${attempts}: ${selectedTickets.length}/${target}`);
        }

        // --- SEGURO TOTAL: Si después de los intentos sigue faltando alguno (extrema mala suerte/red lenta) ---
        if (selectedTickets.length < target) {
            console.warn(`[LUCKY] Generación incompleta tras DB (${selectedTickets.length}/${target}). Forzando completado local.`);
            while (selectedTickets.length < target) {
                let candidate = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                if (!selectedTickets.includes(candidate)) {
                    selectedTickets.push(candidate);
                }
            }
        }

        // --- Uniqueness & Clip ---
        selectedTickets = [...new Set(selectedTickets)];
        if (selectedTickets.length > target) {
            selectedTickets = selectedTickets.slice(0, target);
        }

        console.log(`Generación terminada: ${selectedTickets.length} boletos.`);

        // Animate based on quantity
        if (target <= 5) {
            animateSingleTickets(selectedTickets);
        } else {
            animateBatchTickets(selectedTickets);
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

        manualModal.querySelector('h3').textContent = '¡Tus Números de la Suerte!';

        manualSelectedList.innerHTML = '';
        tickets.forEach(t => renderTicketPill(t, false));

        btnFinishManual.textContent = "Apartar y Pagar";
        btnFinishManual.disabled = false;
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
        tryAgainBtn.innerText = '¿No te gustaron? Inténtalo de nuevo 🔄';
        tryAgainBtn.onclick = () => {
            closeModal(manualModal);
            startLuckyChestSequence();
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

        btnFinishManual.textContent = 'Procesando...';
        btnFinishManual.disabled = true;

        // 1. Insert into Supabase
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
            for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                const { error } = await window.sbClient.from('tickets').insert(chunk);
                if (error) {
                    console.error("Chunk insert error:", error);
                    alert('Ocurrió un error al apartar. Algunos boletos no se guardaron. Intenta nuevamente.');
                    btnFinishManual.textContent = 'Apartar y Pagar';
                    btnFinishManual.disabled = false;
                    return;
                }
            }
        }

        // 2. WhatsApp Redirection (Updated Number)
        const total = selectedTickets.length * TICKET_PRICE;
        let message = `¡Hola! Quiero proceder al pago de mis boletos.\n\n`;
        message += `👤 *Datos del Usuario*:\nName: ${currentUser.name} ${currentUser.lastname}\nPhone: ${currentUser.phone}\nState: ${currentUser.state}\n\n`;
        message += `🎫 *Boletos Apartados* (${selectedTickets.length}):\n${selectedTickets.join(', ')}\n\n`;
        message += `💰 *Total a Pagar*: $${total} MXN`;

        const phoneNum = '526444627178'; // Corrected
        const url = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(message)}`;
        const directUrl = `whatsapp://send?phone=${phoneNum}&text=${encodeURIComponent(message)}`;

        // Attempt direct protocol
        window.location.href = directUrl;

        // Fallback to web link if protocol isn't handled after a short delay
        setTimeout(() => {
            window.location.href = url;
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
                            <strong style="font-size: 1.1rem; color: #ffd700;">#${ticket.ticket_number}</strong>
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
    const targetTime = new Date('December 24, 2025 20:00:00').getTime();

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
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const navMenu = document.getElementById('nav-menu');
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
