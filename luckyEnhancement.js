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

        // 3. Create Heart Box (Large) - Now the main focus
        let heartBox = document.createElement('div');
        heartBox.id = 'lucky-heart-box';
        heartBox.style.cssText = `
            background: transparent;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 350px; /* Increased height */
            position: relative;
            overflow: visible;
        `;

        // Wrapper
        const heartWrapper = document.createElement('div');
        heartWrapper.id = 'lucky-heart-wrapper';
        heartWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        // Setup Chest Container
        if (chestContainer) {
            chestContainer.style.width = '100%';
            chestContainer.style.height = '100%';
            chestContainer.style.transform = 'scale(1.4)'; // Slightly larger
            heartWrapper.appendChild(chestContainer);

            const tapLabel = document.createElement('p');
            tapLabel.id = 'lucky-tap-label';
            tapLabel.innerText = '¡Toca el corazón para abrir!';
            tapLabel.className = 'pulse-anim';
            tapLabel.style.cssText = 'color: var(--primary); font-weight: bold; margin-top: -20px; text-align: center; font-size: 1.2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 5; position: relative; font-family: "Outfit", sans-serif;';
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

        // 4. Logic - No input needed, just click handler
        if (window.updateChestInstruction) window.updateChestInstruction('');
        const oldInstruction = document.getElementById('chest-tap-instruction');
        if (oldInstruction) oldInstruction.style.display = 'none';

        const onChestClick = function () {
            // Use window.targetQuantity which was set by the dropdown modal
            const qty = window.targetQuantity || initialQty || 1;
            console.log('[LUCKY] Heart Triggered. Qty:', qty);

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
