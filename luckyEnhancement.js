// Lucky Heart Modal Enhancement
// This file modifies the lucky heart flow to combine quantity selection with heart modal

(function () {
    // Wait for DOM and main.js
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.startLuckyChestSequence === 'undefined') {
            console.log('Lucky enhancement: waiting for main.js...');
        }
    });

    // Global function to be called from main.js
    window.initLuckyEnhancement = function (chestModal, chestContainer, generateLuckyNumbersFn, createAdvancedParticlesFn, setQuantityFn) {
        const modalContent = chestModal.querySelector('.modal-content');

        // 1. Create/Get Layout Container
        let layoutContainer = document.getElementById('lucky-layout-container');
        if (!layoutContainer) {
            layoutContainer = document.createElement('div');
            layoutContainer.id = 'lucky-layout-container';
            layoutContainer.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 5px;';

            const originalTitle = modalContent.querySelector('h3');
            if (originalTitle) originalTitle.style.display = 'none';
        }

        // 2. Quantity Box (Compact)
        let quantityBox = document.getElementById('lucky-quantity-box');
        if (!quantityBox) {
            quantityBox = document.createElement('div');
            quantityBox.id = 'lucky-quantity-box';
            quantityBox.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--primary);
                border-radius: 15px;
                padding: 10px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            `;
            quantityBox.innerHTML = `
                <label style="color: var(--primary); font-weight: bold; font-size: 0.95rem;">Elige cantidad de boletos:</label>
                <input type="number" id="lucky-quantity-input" min="1" max="500" placeholder="#" 
                    style="width: 80px; padding: 8px; border: 2px solid var(--primary); border-radius: 10px; text-align: center; font-size: 1.3rem; font-weight: bold; background: rgba(0,0,0,0.2); color: var(--text);">
            `;
            layoutContainer.appendChild(quantityBox);
        }

        // 3. Heart Box (Compact & Animated)
        let heartBox = document.getElementById('lucky-heart-box');
        if (!heartBox) {
            heartBox = document.createElement('div');
            heartBox.id = 'lucky-heart-box';
            heartBox.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--primary);
                border-radius: 15px;
                padding: 5px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 220px;
                position: relative;
                overflow: hidden;
            `;

            // Placeholder Text
            const placeholder = document.createElement('div');
            placeholder.id = 'lucky-heart-placeholder';
            placeholder.innerText = 'Selecciona una cantidad arriba...';
            placeholder.style.cssText = `
                color: var(--text-muted);
                font-size: 1rem;
                font-style: italic;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                text-align: center;
                opacity: 1;
                transition: opacity 0.3s ease;
            `;
            heartBox.appendChild(placeholder);

            // Container for Heart (Wrapper for animation)
            const heartWrapper = document.createElement('div');
            heartWrapper.id = 'lucky-heart-wrapper';
            heartWrapper.style.cssText = `
                width: 100%;
                height: 100%;
                opacity: 0;
                transform: scale(0.8) translateY(20px);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;

            // Move existing chestContainer into wrapper
            if (chestContainer) {
                heartWrapper.appendChild(chestContainer);

                // Add explicit tap instruction label inside wrapper
                const tapLabel = document.createElement('p');
                tapLabel.innerText = '¡Toca el corazón!';
                tapLabel.style.cssText = 'color: var(--primary); font-weight: bold; margin-top: 5px; text-align: center; font-size: 1rem;';
                heartWrapper.appendChild(tapLabel);
            }
            heartBox.appendChild(heartWrapper);

            layoutContainer.appendChild(heartBox);
        }

        // Inject Layout
        if (!modalContent.contains(layoutContainer)) {
            const closeBtn = modalContent.querySelector('.close-modal');
            if (closeBtn && closeBtn.nextSibling) {
                modalContent.insertBefore(layoutContainer, closeBtn.nextSibling);
            } else {
                modalContent.appendChild(layoutContainer);
            }
        }

        // Logic
        const luckyQtyInput = document.getElementById('lucky-quantity-input');
        const placeholder = document.getElementById('lucky-heart-placeholder');
        const heartWrapper = document.getElementById('lucky-heart-wrapper');

        // Initial Reset
        luckyQtyInput.value = ''; // Start empty
        placeholder.style.opacity = '1';
        heartWrapper.style.opacity = '0';
        heartWrapper.style.transform = 'scale(0.8) translateY(20px)';
        heartWrapper.style.pointerEvents = 'none';

        // Input Listener
        luckyQtyInput.oninput = function () {
            const val = parseInt(this.value);
            if (!isNaN(val) && val > 0) {
                // Show Heart
                placeholder.style.opacity = '0';
                heartWrapper.style.opacity = '1';
                heartWrapper.style.transform = 'scale(1) translateY(0)';
                heartWrapper.style.pointerEvents = 'auto';
            } else {
                // Hide Heart
                placeholder.style.opacity = '1';
                heartWrapper.style.opacity = '0';
                heartWrapper.style.transform = 'scale(0.8) translateY(20px)';
                heartWrapper.style.pointerEvents = 'none';
            }
        };

        luckyQtyInput.focus();

        // Clear instructions from main.js if any
        if (window.updateChestInstruction) window.updateChestInstruction('');
        const oldInstruction = document.getElementById('chest-tap-instruction');
        if (oldInstruction) oldInstruction.style.display = 'none';

        // One-Step Interaction
        const onChestClick = function () {
            const qty = parseInt(luckyQtyInput.value);
            if (isNaN(qty) || qty < 1 || qty > 500) {
                luckyQtyInput.focus();
                return;
            }

            if (setQuantityFn) setQuantityFn(qty);
            else window.targetQuantity = qty;

            chestContainer.removeEventListener('click', onChestClick);
            chestContainer._onChestClick = null;

            if (window.startHeartBreak) {
                window.startHeartBreak(function () {
                    generateLuckyNumbersFn();
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
