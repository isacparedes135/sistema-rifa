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

        // 0. Inject Custom Styles for Input Cleaning (Spinners) & Animations
        if (!document.getElementById('lucky-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'lucky-custom-styles';
            style.innerHTML = `
                /* Remove Arrows/Spinners */
                #lucky-quantity-input::-webkit-outer-spin-button,
                #lucky-quantity-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                #lucky-quantity-input {
                    -moz-appearance: textfield;
                }
                
                /* Premium Input Focus */
                #lucky-quantity-input:focus {
                    outline: none;
                    box-shadow: 0 0 15px rgba(255, 0, 85, 0.5);
                    border-color: #ff0055 !important;
                }

                /* Placeholder Animation */
                @keyframes pulse-text {
                    0% { opacity: 0.7; }
                    50% { opacity: 1; }
                    100% { opacity: 0.7; }
                }
                .pulse-anim { animation: pulse-text 2s infinite; }
            `;
            document.head.appendChild(style);
        }

        // 1. Create/Get Layout Container
        let layoutContainer = document.getElementById('lucky-layout-container');
        if (!layoutContainer) {
            layoutContainer = document.createElement('div');
            layoutContainer.id = 'lucky-layout-container';
            layoutContainer.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 5px;';

            const originalTitle = modalContent.querySelector('h3');
            if (originalTitle) originalTitle.style.display = 'none';
        }

        // 2. Quantity Box (Styled & Premium)
        let quantityBox = document.getElementById('lucky-quantity-box');
        if (!quantityBox) {
            quantityBox = document.createElement('div');
            quantityBox.id = 'lucky-quantity-box';
            quantityBox.style.cssText = `
                background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
            `;

            // Custom Input Design
            quantityBox.innerHTML = `
                <label style="
                    color: var(--primary); 
                    font-weight: 700; 
                    font-size: 0.85rem; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                    opacity: 0.9;
                ">Elige cantidad de boletos</label>
                
                <div style="position: relative; display: inline-block;">
                    <input type="number" id="lucky-quantity-input" min="1" max="500" placeholder="0" 
                        style="
                            width: 100px; 
                            padding: 10px; 
                            border: 2px solid rgba(255,255,255,0.2); 
                            border-radius: 12px; 
                            text-align: center; 
                            font-size: 1.8rem; 
                            font-weight: 800; 
                            background: rgba(0,0,0,0.3); 
                            color: #fff;
                            transition: all 0.3s ease;
                        ">
                    <span style="
                        position: absolute; 
                        right: 10px; 
                        top: 50%; 
                        transform: translateY(-50%); 
                        font-size: 0.8rem; 
                        color: rgba(255,255,255,0.3); 
                        pointer-events: none;
                    ">boletos</span>
                </div>
            `;
            layoutContainer.appendChild(quantityBox);
        }

        // 3. Heart Box (More Compact)
        let heartBox = document.getElementById('lucky-heart-box');
        if (!heartBox) {
            heartBox = document.createElement('div');
            heartBox.id = 'lucky-heart-box';
            heartBox.style.cssText = `
                background: transparent;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0 0 15px 15px;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 180px; /* Reduced from 220px */
                position: relative;
                overflow: hidden;
            `;

            // Placeholder Text
            const placeholder = document.createElement('div');
            placeholder.id = 'lucky-heart-placeholder';
            placeholder.innerText = 'Escribe un número arriba...';
            placeholder.className = 'pulse-anim';
            placeholder.style.cssText = `
                color: var(--text-muted);
                font-size: 0.9rem;
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

            // Wrapper
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
                justify-content: center; /* Vertically center heart */
            `;

            if (chestContainer) {
                // Ensure chest container fits well
                chestContainer.style.width = '100%';
                chestContainer.style.height = '140px'; // Explicit height for canvas container
                heartWrapper.appendChild(chestContainer);

                const tapLabel = document.createElement('p');
                tapLabel.innerText = '¡Toca para girar!';
                tapLabel.style.cssText = 'color: var(--primary); font-weight: bold; margin-top: -5px; text-align: center; font-size: 0.9rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);';
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
        luckyQtyInput.value = '';
        placeholder.style.opacity = '1';
        heartWrapper.style.opacity = '0';
        heartWrapper.style.transform = 'scale(0.8) translateY(20px)';
        heartWrapper.style.pointerEvents = 'none';

        // Input Listener
        luckyQtyInput.oninput = function () {
            const val = parseInt(this.value);
            if (!isNaN(val) && val > 0) {
                placeholder.style.opacity = '0';
                heartWrapper.style.opacity = '1';
                heartWrapper.style.transform = 'scale(1) translateY(0)';
                heartWrapper.style.pointerEvents = 'auto';
            } else {
                placeholder.style.opacity = '1';
                heartWrapper.style.opacity = '0';
                heartWrapper.style.transform = 'scale(0.8) translateY(20px)';
                heartWrapper.style.pointerEvents = 'none';
            }
        };

        luckyQtyInput.focus();

        if (window.updateChestInstruction) window.updateChestInstruction('');
        const oldInstruction = document.getElementById('chest-tap-instruction');
        if (oldInstruction) oldInstruction.style.display = 'none';

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
