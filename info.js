document.addEventListener('DOMContentLoaded', () => {
    const btnSearchTickets = document.getElementById('btn-search-tickets');
    const lookupPhoneInput = document.getElementById('lookup-phone');
    const lookupResults = document.getElementById('lookup-results');

    async function lookupTickets() {
        const phone = lookupPhoneInput.value.trim().replace(/\D/g, '');
        if (phone.length < 10) {
            alert('Ingresa tu teléfono de 10 dígitos.');
            return;
        }

        lookupResults.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Buscando...</p>';

        if (!window.sbClient) {
            alert('Error de conexión con la base de datos.');
            return;
        }

        try {
            const { data, error } = await window.sbClient
                .from('tickets')
                .select('*')
                .eq('client_phone', phone)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                lookupResults.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--primary);">No se encontraron boletos para este número.</p>';
            } else {
                lookupResults.innerHTML = '';
                data.forEach(ticket => {
                    const item = document.createElement('div');
                    item.className = 'lookup-item';

                    const statusText = ticket.status === 'paid' ? 'Pagado' : 'Apartado';
                    const statusClass = ticket.status === 'paid' ? 'status-paid' : 'status-reserved';

                    item.innerHTML = `
                        <div>
                            <strong style="font-size: 1.2rem; color: var(--primary); display:block; margin-bottom: 5px;">#${ticket.ticket_number}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(ticket.created_at).toLocaleDateString()}</div>
                        </div>
                        <span class="ticket-status-badge ${statusClass}">${statusText}</span>
                    `;
                    lookupResults.appendChild(item);
                });
            }
        } catch (err) {
            console.error(err);
            lookupResults.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #ff4444;">Error al consultar. Intenta más tarde.</p>';
        }
    }

    if (btnSearchTickets) {
        btnSearchTickets.addEventListener('click', lookupTickets);
    }

    if (lookupPhoneInput) {
        lookupPhoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') lookupTickets();
        });
    }

    // Scroll to section if hash exists
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }
});
