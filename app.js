// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPwwAWS2aiEqeFJX1ARgRmHzFEj5RCpiw",
    databaseURL: "https://rastreador-familia-6fe52-default-rtdb.firebaseio.com/",
    projectId: "rastreador-familia-6fe52",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map, meuNome, marcadores = {}, rastrosAtivos = {};
const coresVip = ['#6c5ce7', '#00b894', '#ff7675', '#0984e3', '#f1c40f'];

// Função de Login
function fazerLogin() {
    const nome = document.getElementById('nameInput').value.trim();
    if (nome) {
        localStorage.setItem('life_vip_nome', nome);
        document.getElementById('login-screen').style.display = 'none';
        meuNome = nome;
        iniciarApp();
    }
}

function iniciarApp() {
    // Configura o mapa e usa o estilo Voyager (agradável)
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0,0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // FORÇAR CARREGAMENTO AUTOMÁTICO
    setTimeout(() => { map.invalidateSize(); }, 500);

    conectarFirebase();
    iniciarGPS();
}

function calcularKM(trajetos) {
    if (!trajetos) return "0.0";
    const pts = Object.values(trajetos);
    let dist = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        dist += L.latLng(pts[i].lat, pts[i].lng).distanceTo(L.latLng(pts[i+1].lat, pts[i+1].lng));
    }
    return (dist / 1000).toFixed(1);
}

function conectarFirebase() {
    db.ref('familia').on('value', snap => {
        const familia = snap.val();
        for (let id in familia) {
            const u = familia[id];
            const cor = coresVip[Math.abs(id.length) % coresVip.length];
            const km = calcularKM(u.trajetos);

            if (marcadores[id]) {
                marcadores[id].setLatLng([u.lat, u.lng]);
                document.getElementById(`km-${id}`).innerText = `${km} km`;
            } else {
                marcadores[id] = L.marker([u.lat, u.lng], {
                    icon: L.divIcon({
                        className: 'marcador-vip',
                        html: `<div class="bolha-usuario" style="background:${cor}">${id.substring(0,1).toUpperCase()}</div>
                               <div class="etiqueta-info"><b>${id}</b> • <span id="km-${id}">${km} km</span></div>`,
                        iconSize: [45, 45], iconAnchor: [22, 45]
                    })
                }).addTo(map).on('click', () => verHistorico(id, u.trajetos, cor, [u.lat, u.lng]));
            }
        }
    });
}

function verHistorico(nome, trajetos, cor, pos) {
    // Puxa a localização dele no mapa
    map.flyTo(pos, 16);

    // Se já tiver rastro no mapa, remove para não poluir
    if (rastrosAtivos[nome]) {
        map.removeLayer(rastrosAtivos[nome]);
        delete rastrosAtivos[nome];
    } else if (trajetos) {
        // Puxa o histórico e desenha a linha
        const pontos = Object.values(trajetos).map(p => [p.lat, p.lng]);
        rastrosAtivos[nome] = L.polyline(pontos, {color: cor, weight: 5, opacity: 0.5, dashArray: '10, 10'}).addTo(map);
    }
}

function iniciarGPS() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const ref = db.ref('familia/' + meuNome);
        ref.update({ lat: latitude, lng: longitude });
        ref.child('trajetos').push({ lat: latitude, lng: longitude, t: Date.now() });
        
        if (map.getZoom() < 10) map.setView([latitude, longitude], 15);
    }, null, { enableHighAccuracy: true });
}

function focarGeral() {
    const grupo = new L.featureGroup(Object.values(marcadores));
    if (grupo.getLayers().length > 0) map.fitBounds(grupo.getBounds().pad(0.3));
}

// Verifica login ao abrir
window.onload = () => {
    const salvo = localStorage.getItem('life_vip_nome');
    if (salvo) {
        document.getElementById('login-screen').style.display = 'none';
        meuNome = salvo;
        iniciarApp();
    }
};
