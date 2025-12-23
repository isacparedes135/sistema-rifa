// Lucky Heart Modal Enhancement
// This file modifies the lucky heart flow to combine quantity selection with heart modal

(function () {
    // Wait for DOM and main.js to load
    document.addEventListener('DOMContentLoaded', function () {
        // Override the startLuckyChestSequence if it exists
        if (typeof window.startLuckyChestSequence === 'undefined') {
            console.log('Lucky enhancement: waiting for main.js...');
        }
    });

    // Global function to be called from main.js
    // Global function to be called from main.js
    window.initLuckyEnhancement = function (chestModal, chestContainer, generateLuckyNumbersFn, createAdvancedParticlesFn, setQuantityFn) {
        // Inject quantity input UI into chest modal
        let quantitySection = document.getElementById('lucky-quantity-section');
        if (!quantitySection) {
            const modalContent = chestModal.querySelector('.modal-content');
            quantitySection = document.createElement('div');
            quantitySection.id = 'lucky-quantity-section';
            quantitySection.style.cssText = 'width:100%;text-align:center;margin-bottom:15px;margin-top:10px;';
            quantitySection.innerHTML = `
                <h3 style="color:var(--primary);margin-bottom:10px;font-size:1.1rem;">¿Cuántos boletos quieres?</h3>
                <div style="display:flex;gap:10px;justify-content:center;align-items:center;">
                    <input type="number" id="lucky-quantity-input" min="1" max="500" value="1" 
                        style="width:80px;padding:10px;border:2px solid var(--primary);border-radius:10px;text-align:center;font-size:1.2rem;font-weight:bold;">
                    <button id="btn-confirm-lucky-qty" class="btn-primary" style="padding:10px 20px;">¡Girar!</button>
                </div>
            `;
            // Insert after close button
            const closeBtn = modalContent.querySelector('.close-modal');
            if (closeBtn && closeBtn.nextSibling) {
                modalContent.insertBefore(quantitySection, closeBtn.nextSibling);
            } else {
                modalContent.insertBefore(quantitySection, modalContent.firstChild);
            }
        }

        // Show and reset
        quantitySection.style.display = 'block';
        const luckyQtyInput = document.getElementById('lucky-quantity-input');
        luckyQtyInput.value = 1;

        // Update instruction
        if (window.updateChestInstruction) {
            window.updateChestInstruction('Ingresa cantidad y presiona ¡Girar!');
        }

        // Remove any existing heart click listeners
        if (chestContainer._onChestClick) {
            chestContainer.removeEventListener('click', chestContainer._onChestClick);
            chestContainer._onChestClick = null;
        }

        // Setup confirm button
        const btnConfirmLucky = document.getElementById('btn-confirm-lucky-qty');
        btnConfirmLucky.onclick = function () {
            const qty = parseInt(luckyQtyInput.value);
            if (qty > 0 && qty <= 500) {
                if (setQuantityFn) setQuantityFn(qty);
                else window.targetQuantity = qty;
                quantitySection.style.display = 'none';

                if (window.updateChestInstruction) {
                    window.updateChestInstruction('¡Toca el corazón!');
                }

                // Enable heart click now
                const onChestClick = function () {
                    chestContainer.removeEventListener('click', onChestClick);
                    chestContainer._onChestClick = null;
                    if (window.updateChestInstruction) window.updateChestInstruction('');
                    if (window.startHeartBreak) {
                        window.startHeartBreak(function () {
                            generateLuckyNumbersFn();
                            createAdvancedParticlesFn();
                        });
                    }
                };
                chestContainer._onChestClick = onChestClick;
                chestContainer.addEventListener('click', onChestClick);
            } else {
                alert('Por favor ingresa una cantidad válida (1-500)');
            }
        };

        // Focus input after a delay
        setTimeout(function () { luckyQtyInput.focus(); }, 100);
    };
})();
