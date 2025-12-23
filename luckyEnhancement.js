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

        // 1. Create/Get Layout Container (The "Two Boxes" Wrapper)
        let layoutContainer = document.getElementById('lucky-layout-container');
        if (!layoutContainer) {
            layoutContainer = document.createElement('div');
            layoutContainer.id = 'lucky-layout-container';
            layoutContainer.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 15px; margin-top: 10px;';

            // Insert after Title (h3) and before close button (or reorganize)
            // Existing structure: span.close-modal, h3, div.chest-container, p#chest-tap-instruction
            // We want to wrap the content or insert between.
            // Let's hide the original h3 and handle titles inside our boxes for cleaner look
            const originalTitle = modalContent.querySelector('h3');
            if (originalTitle) originalTitle.style.display = 'none'; // Hide generic title

            // Move chest container into the second box later
        }

        // 2. Quantity Box (Top)
        let quantityBox = document.getElementById('lucky-quantity-box');
        if (!quantityBox) {
            quantityBox = document.createElement('div');
            quantityBox.id = 'lucky-quantity-box';
            quantityBox.className = 'lucky-box'; // Add class for potential css
            quantityBox.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--primary);
                border-radius: 15px;
                padding: 15px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            `;
            quantityBox.innerHTML = `
                <label style="color: var(--primary); font-weight: bold; font-size: 1rem;">1. Elige cantidad de boletos:</label>
                <input type="number" id="lucky-quantity-input" min="1" max="500" value="1" 
                    style="width: 100px; padding: 12px; border: 2px solid var(--primary); border-radius: 12px; text-align: center; font-size: 1.5rem; font-weight: bold; background: rgba(0,0,0,0.2); color: var(--text);">
            `;
            layoutContainer.appendChild(quantityBox);
        }

        // 3. Heart Box (Bottom)
        let heartBox = document.getElementById('lucky-heart-box');
        if (!heartBox) {
            heartBox = document.createElement('div');
            heartBox.id = 'lucky-heart-box';
            heartBox.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--primary);
                border-radius: 15px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 300px;
                position: relative;
            `;

            // Add label
            const label = document.createElement('div');
            label.style.cssText = 'color: var(--primary); font-weight: bold; font-size: 1rem; margin-bottom: 5px;';
            label.innerText = '2. Toca el corazón:';
            heartBox.appendChild(label);

            // Move existing chestContainer into this box
            // chestContainer is passed as argument, usually existing in DOM
            if (chestContainer && chestContainer.parentNode !== heartBox) {
                heartBox.appendChild(chestContainer);
            }

            layoutContainer.appendChild(heartBox);
        }

        // Inject Layout into Modal
        // We append if not exists
        if (!modalContent.contains(layoutContainer)) {
            // Insert after close button
            const closeBtn = modalContent.querySelector('.close-modal');
            if (closeBtn && closeBtn.nextSibling) {
                modalContent.insertBefore(layoutContainer, closeBtn.nextSibling);
            } else {
                modalContent.appendChild(layoutContainer);
            }
        }

        // Reset State
        const luckyQtyInput = document.getElementById('lucky-quantity-input');
        luckyQtyInput.value = 1;
        luckyQtyInput.focus();

        // Ensure instruction text is updated/hidden as needed
        if (window.updateChestInstruction) window.updateChestInstruction(''); // Clear old floating text

        // Remove old listeners
        if (chestContainer._onChestClick) {
            chestContainer.removeEventListener('click', chestContainer._onChestClick);
            chestContainer._onChestClick = null;
        }

        // 4. One-Step Interaction Logic
        // When heart is clicked, it READS the input value right then.
        const onChestClick = function () {
            const qty = parseInt(luckyQtyInput.value);

            if (isNaN(qty) || qty < 1 || qty > 500) {
                alert('Por favor ingresa una cantidad válida (1-500)');
                luckyQtyInput.focus();
                return;
            }

            // Valid Quantity - Proceed
            if (setQuantityFn) setQuantityFn(qty);
            else window.targetQuantity = qty;

            // Remove listener so you can't click again while animating
            chestContainer.removeEventListener('click', onChestClick);
            chestContainer._onChestClick = null;

            if (window.startHeartBreak) {
                window.startHeartBreak(function () {
                    generateLuckyNumbersFn();
                    createAdvancedParticlesFn();

                    // Optional: Reset UI after animation/generation if needed?
                    // User usually goes to "Floating Cart" or checks out.
                    // But if they stay, we might want to reset.
                    // For now, let main.js handle flow (it usually shows summary or adds to cart)
                });
            }
        };

        chestContainer._onChestClick = onChestClick;
        chestContainer.addEventListener('click', onChestClick);
    };
})();
