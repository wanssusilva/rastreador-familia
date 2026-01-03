// CONFIGURAÇÃO OFICIAL FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBPwwAWS2aiEqeFJX1ARgRmHzFEj5RCpiw",
    databaseURL: "https://rastreador-familia-6fe52-default-rtdb.firebaseio.com/",
    projectId: "rastreador-familia-6fe52",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map, meuNome, marcadores = {};
const cores = ['#6c5ce7', '#00b894', '#ff7675', '#0984e3', '#f1c40f'];

// 1. Verificar se o usuário já tem nome
window.onload = () => {
    meuNome = localStorage.getItem('life_vip_user');
    if (meuNome) {
        document.getElementById('login-screen').style.display = 'none';
        iniciarApp();
    }
};

function entrarNoApp() {
    const nome = document.getElementById('nameInput').value.trim();
    if (nome) {
        localStorage.setItem('life_vip_user', nome);
        location.reload();
    }
}

// 2. Inicializar Mapa e GPS
function iniciarApp() {
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0,0], 2);
    
    // Tile Voyager: Carregamento rápido e visual limpo
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // Forçar o mapa a carregar as imagens instantaneamente
    setTimeout(() => { map.invalidateSize(); }, 500);

    syncFirebase();
    trackGPS();
}

// 3. Cálculo de Distância (KM)
function calcularDistancia(trajetos) {
    if (!trajetos) return "0.0";
    let distTotal = 0;
    const pts = Object.values(trajetos);
    for (let i = 0; i < pts.length - 1; i++) {
        distTotal += L.latLng(pts[i].lat, pts[i].lng).distanceTo(L.latLng(pts[i+1].lat, pts[i+1].lng));
    }
    return (distTotal / 1000).toFixed(1);
}

// 4. Sincronização em Tempo Real com Firebase
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
                marcadores[id] = L.marker([u.lat, u.lng], {
                    icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<div class="user-bubble" style="background:${cor}">${id.substring(0,1).toUpperCase()}</div>
                               <div class="user-tag"><b>${id}</b> • <span id="km-${id}">${km} km hoje</span></div>`,
                        iconSize: [50, 50], iconAnchor: [25, 50]
                    })
                }).addTo(map);
            }
        }
    });
}

// 5. Enviar Localização para o Firebase
function trackGPS() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const ref = db.ref('familia/' + meuNome);
        
        ref.update({ lat: latitude, lng: longitude, t: Date.now() });
        ref.child('trajetos').push({ lat: latitude, lng: longitude, t: Date.now() });

        // Ajusta o mapa na primeira vez
        if (map.getZoom() < 10) map.setView([latitude, longitude], 15);
    }, null, { enableHighAccuracy: true });
}

function focarFamilia() {
    const grupo = new L.featureGroup(Object.values(marcadores));
    if (grupo.getLayers().length > 0) map.fitBounds(grupo.getBounds().pad(0.3));
}
