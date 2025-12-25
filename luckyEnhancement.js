// Lucky Heart Modal Enhancement
// This file modifies the lucky heart flow to combine quantity selection with heart modal

(function () {
    // Wait for DOM
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.startLuckyChestSequence === 'undefined') {
            console.log('Lucky enhancement: waiting for main.js...');
        }
    });

    // Global function to be called from main.js
    window.initLuckyEnhancement = function (chestModal, chestContainer, generateLuckyNumbersFn, createAdvancedParticlesFn, setQuantityFn, initialQty = null) {
        const modalContent = chestModal.querySelector('.modal-content');

        // 0. Inject Styles
        if (!document.getElementById('lucky-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'lucky-custom-styles';
            style.innerHTML = `
                /* Clean animations */
                .pulse-anim { animation: pulse-text 2s infinite; }
                @keyframes pulse-text { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `;
            document.head.appendChild(style);
        }

        // 1. FRESH START: Remove existing layout if present
        let existingLayout = document.getElementById('lucky-layout-container');
        if (existingLayout) {
            if (existingLayout.contains(chestContainer)) {
                modalContent.appendChild(chestContainer);
            }
            existingLayout.remove();
        }

        // Hide original title if visible
        const originalTitle = modalContent.querySelector('h3');
        if (originalTitle) originalTitle.style.display = 'none';

        // 2. Create Layout Container
        let layoutContainer = document.createElement('div');
        layoutContainer.id = 'lucky-layout-container';
        layoutContainer.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 5px;';

        // 3. Create Quantity Box (Horizontal)
        let quantityBox = document.createElement('div');
        quantityBox.id = 'lucky-quantity-box';
        quantityBox.style.cssText = `
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 15px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 20px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        `;

        quantityBox.innerHTML = `
            <label style="
                color: var(--primary); 
                font-weight: 700; 
                font-size: 1rem; 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                margin: 0;
                text-align: right;
            ">Elige cantidad<br>de boletos:</label>
            
            <select id="lucky-quantity-select" 
                style="
                    width: 140px; 
                    padding: 8px 12px; 
                    border: 2px solid var(--primary); 
                    border-radius: 10px; 
                    text-align: center; 
                    font-size: 1.1rem; 
                    font-weight: 700; 
                    background: #ffffff; 
                    color: #333333; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    outline: none;
                    cursor: pointer;
                    font-family: 'Outfit', sans-serif;
                ">
                <option value="" disabled selected>Selecciona...</option>
            </select>
        `;
        layoutContainer.appendChild(quantityBox);

        // POPULATE SELECT
        const luckySelect = layoutContainer.querySelector('#lucky-quantity-select');
        const amounts = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            15, 20, 25, 30,
            40, 50, 60, 70, 80, 90, 100,
            150, 200, 250, 300, 500
        ];
        amounts.forEach(amt => {
            const opt = document.createElement('option');
            opt.value = amt;
            // Matches format: "10 Boletos - $10"
            opt.textContent = `${amt} Boleto${amt > 1 ? 's' : ''} - $${amt}`;
            luckySelect.appendChild(opt);
        });

        // 4. Create Heart Box (Large)
        let heartBox = document.createElement('div');
        heartBox.id = 'lucky-heart-box';
        heartBox.style.cssText = `
            background: transparent;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            position: relative;
            overflow: visible;
        `;

        // Placeholder
        const placeholder = document.createElement('div');
        placeholder.id = 'lucky-heart-placeholder';
        placeholder.innerText = 'Escribe un número arriba...';
        placeholder.className = 'pulse-anim';
        placeholder.style.cssText = `
            color: var(--text-muted);
            font-size: 1.1rem;
            font-style: italic;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            text-align: center;
            opacity: 1;
            transition: opacity 0.3s ease;
            z-index: 10;
        `;
        heartBox.appendChild(placeholder);

        // Wrapper
        const heartWrapper = document.createElement('div');
        heartWrapper.id = 'lucky-heart-wrapper';
        heartWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        // Setup Chest Container
        if (chestContainer) {
            chestContainer.style.width = '100%';
            chestContainer.style.height = '100%';
            chestContainer.style.transform = 'scale(1.3)'; // Magnify
            heartWrapper.appendChild(chestContainer);

            const tapLabel = document.createElement('p');
            tapLabel.id = 'lucky-tap-label';
            tapLabel.innerText = '¡Toca para abrir!';
            tapLabel.style.cssText = 'color: var(--primary); font-weight: bold; margin-top: -20px; text-align: center; font-size: 1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 5; position: relative;';
            heartWrapper.appendChild(tapLabel);
        }
        heartBox.appendChild(heartWrapper);
        layoutContainer.appendChild(heartBox);

        // Inject Layout
        const closeBtn = modalContent.querySelector('.close-modal');
        if (closeBtn && closeBtn.nextSibling) {
            modalContent.insertBefore(layoutContainer, closeBtn.nextSibling);
        } else {
            modalContent.appendChild(layoutContainer);
        }

        // Logic
        const luckySelectRef = document.getElementById('lucky-quantity-select');
        const heartWrapperRef = document.getElementById('lucky-heart-wrapper');
        const placeholderRef = document.getElementById('lucky-heart-placeholder');

        luckySelectRef.onchange = function () {
            const val = parseInt(this.value);
            if (!isNaN(val) && val > 0) {
                if (placeholderRef.style.display !== 'none') {
                    placeholderRef.style.opacity = '0';
                    setTimeout(() => { if (placeholderRef.style.opacity === '0') placeholderRef.style.display = 'none'; }, 300);
                }

                heartWrapperRef.style.opacity = '1';
                heartWrapperRef.style.transform = 'scale(1) translateY(0)';
                heartWrapperRef.style.pointerEvents = 'auto';
            } else {
                placeholderRef.style.display = 'block';
                requestAnimationFrame(() => { placeholderRef.style.opacity = '1'; });

                heartWrapperRef.style.opacity = '0';
                heartWrapperRef.style.transform = 'scale(0.8) translateY(20px)';
                heartWrapperRef.style.pointerEvents = 'none';
            }
        };

        // PREFILL LOGIC
        if (initialQty) {
            luckySelectRef.value = initialQty;
            // Manually trigger visual update
            if (luckySelectRef.value == initialQty) {
                luckySelectRef.onchange.call(luckySelectRef);
            }
        } else {
            // luckySelect.focus(); // Focus on select not always great on mobile, let user click
        }

        if (window.updateChestInstruction) window.updateChestInstruction('');
        const oldInstruction = document.getElementById('chest-tap-instruction');
        if (oldInstruction) oldInstruction.style.display = 'none';

        const onChestClick = function () {
            const qty = parseInt(luckySelectRef.value);
            console.log('[LUCKY] Heart Triggered. Qty:', qty);

            const tapLabel = document.getElementById('lucky-tap-label');
            if (tapLabel) tapLabel.style.display = 'none';

            chestContainer.removeEventListener('click', onChestClick);
            chestContainer._onChestClick = null;

            if (window.startHeartBreak) {
                window.startHeartBreak(function () {
                    console.log('[LUCKY] Break finished. Generating numbers...');
                    if (isNaN(qty) || qty < 1 || qty > 500) {
                        luckySelectRef.focus();
                        return;
                    }
                    generateLuckyNumbersFn(qty);
                    createAdvancedParticlesFn();
                });
            }
        };

        if (chestContainer._onChestClick) {
            chestContainer.removeEventListener('click', chestContainer._onChestClick);
        }
        chestContainer._onChestClick = onChestClick;
        chestContainer.addEventListener('click', onChestClick);
    };
})();
