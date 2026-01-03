// Variável global para armazenar as linhas dos trajetos
let trilhasAtivas = {};

function syncFirebase() {
    db.ref('familia').on('value', snap => {
        const familia = snap.val();
        for (let id in familia) {
            const u = familia[id];
            const cor = cores[Math.abs(id.length) % cores.length];
            const km = calcularDistancia(u.trajetos);

            if (marcadores[id]) {
                marcadores[id].setLatLng([u.lat, u.lng]);
                document.getElementById(`km-${id}`).innerText = `${km} km hoje`;
            } else {
                // Criar o marcador com evento de CLIQUE
                marcadores[id] = L.marker([u.lat, u.lng], {
                    icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<div class="user-bubble" style="background:${cor}">${id.substring(0,1).toUpperCase()}</div>
                               <div class="user-tag"><b>${id}</b> • <span id="km-${id}">${km} km hoje</span></div>`,
                        iconSize: [50, 50], iconAnchor: [25, 50]
                    })
                }).addTo(map).on('click', () => focarEHistorico(id, u.trajetos, cor, [u.lat, u.lng]));
            }
        }
    });
}

// Função que puxa a localização e o histórico ao clicar
function focarEHistorico(nome, trajetos, cor, posicaoAtual) {
    // 1. Puxa a localização atual (Centraliza o mapa nele)
    map.flyTo(posicaoAtual, 16, { animate: true, duration: 1.5 });

    // 2. Gerencia o Histórico (Trilha)
    if (trilhasAtivas[nome]) {
        // Se já estiver mostrando a trilha, remove ao clicar de novo (Toggle)
        map.removeLayer(trilhasAtivas[nome]);
        delete trilhasAtivas[nome];
    } else {
        // Se não houver trilha, desenha ela no mapa
        if (!trajetos) return;

        const pontos = Object.values(trajetos).map(p => [p.lat, p.lng]);
        
        // Desenha uma linha suave mostrando por onde ele passou
        trilhasAtivas[nome] = L.polyline(pontos, {
            color: cor,
            weight: 5,
            opacity: 0.6,
            dashArray: '10, 10', // Linha tracejada para ficar moderno
            lineJoin: 'round'
        }).addTo(map);

        // Ajusta o zoom para mostrar o trajeto inteiro
        map.fitBounds(trilhasAtivas[nome].getBounds(), { padding: [50, 50] });
    }
}
