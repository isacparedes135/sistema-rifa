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
    window.initLuckyEnhancement = function (chestModal, chestContainer, generateLuckyNumbersFn, createAdvancedParticlesFn, setQuantityFn) {
        const modalContent = chestModal.querySelector('.modal-content');

        // 0. Inject Styles
        if (!document.getElementById('lucky-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'lucky-custom-styles';
            style.innerHTML = `
                /* Remove Spinners */
                #lucky-quantity-input::-webkit-outer-spin-button,
                #lucky-quantity-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #lucky-quantity-input {
                    -moz-appearance: textfield;
                }
                .pulse-anim { animation: pulse-text 2s infinite; }
                @keyframes pulse-text { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `;
            document.head.appendChild(style);
        }

        // 1. FRESH START: Remove existing layout if present to prevent stale state
        let existingLayout = document.getElementById('lucky-layout-container');
        if (existingLayout) {
            // Note: chestContainer is inside here, we must preserve it before removing layout
            // But chestContainer is passed as argument, so checking if it is still child
            if (existingLayout.contains(chestContainer)) {
                // Move chestContainer out temporarily to body or fragment to save it?
                // Actually, Three.js might lose context if detached for long? 
                // Let's just append it to modalContent temporarily
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
            
            <input type="number" id="lucky-quantity-input" min="1" max="500" placeholder="#" 
                style="
                    width: 90px; 
                    padding: 10px; 
                    border: 2px solid var(--primary); 
                    border-radius: 10px; 
                    text-align: center; 
                    font-size: 1.5rem; 
                    font-weight: 800; 
                    background: #ffffff; /* Solid White Background */
                    color: #333333; /* Dark Text */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    transition: all 0.2s ease;
                ">
        `;
        layoutContainer.appendChild(quantityBox);

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
        const luckyQtyInput = document.getElementById('lucky-quantity-input');
        const heartWrapperRef = document.getElementById('lucky-heart-wrapper');
        const placeholderRef = document.getElementById('lucky-heart-placeholder');

        luckyQtyInput.value = '';

        luckyQtyInput.oninput = function () {
            const val = parseInt(this.value);
            if (!isNaN(val) && val > 0) {
                placeholderRef.style.opacity = '0';
                setTimeout(() => { if (placeholderRef.style.opacity === '0') placeholderRef.style.display = 'none'; }, 300);

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

        luckyQtyInput.focus();

        if (window.updateChestInstruction) window.updateChestInstruction('');
        const oldInstruction = document.getElementById('chest-tap-instruction');
        if (oldInstruction) oldInstruction.style.display = 'none';

        const onChestClick = function () {
            const qty = parseInt(luckyQtyInput.value);
            console.log('[LUCKY] Heart Triggered. Qty:', qty);

            if (isNaN(qty) || qty < 1 || qty > 500) {
                luckyQtyInput.focus();
                return;
            }

            // Critical: Set quantity
            if (setQuantityFn) {
                console.log('[LUCKY] calling setQuantityFn...');
                setQuantityFn(qty);
            } else {
                console.warn('[LUCKY] setQuantityFn missing, using window.targetQuantity');
                window.targetQuantity = qty;
            }

            const tapLabel = document.getElementById('lucky-tap-label');
            if (tapLabel) tapLabel.style.display = 'none';

            chestContainer.removeEventListener('click', onChestClick);
            chestContainer._onChestClick = null;

            if (window.startHeartBreak) {
                window.startHeartBreak(function () {
                    console.log('[LUCKY] Break finished. Generating numbers...');
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
