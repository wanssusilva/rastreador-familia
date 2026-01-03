// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPwwAWS2aiEqeFJX1ARgRmHzFEj5RCpiw",
    databaseURL: "https://rastreador-familia-6fe52-default-rtdb.firebaseio.com/",
    projectId: "rastreador-familia-6fe52",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map, myName, markers = {}, trails = {};
const userColors = ['#6c5ce7', '#ff7675', '#00b894', '#0984e3', '#fdcb6e'];

// Inicialização
window.onload = () => {
    myName = localStorage.getItem('life_vip_name');
    if (!myName) {
        myName = prompt("Digite seu nome para o grupo familiar:");
        if (myName) localStorage.setItem('life_vip_name', myName);
        else return location.reload();
    }
    
    if (Notification.permission !== "granted") {
        document.getElementById('notif-request').style.display = 'block';
    }
    
    iniciarMapa();
};

function ativarNotificacoes() {
    Notification.requestPermission().then(perm => {
        if (perm === "granted") {
            document.getElementById('notif-request').style.display = 'none';
            enviarPush("Sucesso!", "Notificações ativadas.");
        }
    });
}

function enviarPush(titulo, corpo) {
    if (Notification.permission === "granted") {
        new Notification(titulo, { body: corpo });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}

function iniciarMapa() {
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0,0], 15);
    
    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // AUTO-AJUSTE: Garante que o mapa carregue as imagens imediatamente
    tiles.on('load', () => {
        setTimeout(() => { map.invalidateSize(); }, 500);
    });

    syncData();
    trackMe();
}

// Cálculo de Quilômetros Percorridos no Dia
function calcularDistanciaTotal(trajetos) {
    if (!trajetos) return "0.00";
    const pts = Object.values(trajetos);
    let dist = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        dist += L.latLng(pts[i].lat, pts[i].lng).distanceTo(L.latLng(pts[i+1].lat, pts[i+1].lng));
    }
    return (dist / 1000).toFixed(2);
}

function syncData() {
    // Alerta de Novo Membro
    db.ref('familia').on('child_added', snap => {
        if (snap.key !== myName) enviarPush("VIP Tracker", `${snap.key} entrou no mapa.`);
    });

    db.ref('familia').on('value', snap => {
        const data = snap.val();
        for (let id in data) {
            const u = data[id];
            const cor = userColors[Math.abs(id.length) % userColors.length];
            const kmVal = calcularDistanciaTotal(u.trajetos);

            if (markers[id]) {
                markers[id].setLatLng([u.lat, u.lng]);
                document.getElementById(`km-${id}`).innerText = `${kmVal} km hoje`;
            } else {
                markers[id] = L.marker([u.lat, u.lng], {
                    icon: L.divIcon({
                        className: 'vip-marker',
                        html: `<div class="user-marker-container">
                                <div class="user-bubble" style="background:${cor}">${id.substring(0,2).toUpperCase()}</div>
                                <div class="user-info-box"><b>${id}</b>: <span id="km-${id}">${kmVal} km</span></div>
                               </div>`,
                        iconSize: [60, 60], iconAnchor: [30, 60]
                    })
                }).addTo(map).on('click', () => toggleTrail(id, u.trajetos, cor));
            }
        }
    });
}

function toggleTrail(id, trajetos, cor) {
    if (trails[id]) { map.removeLayer(trails[id]); delete trails[id]; return; }
    if (!trajetos) return;
    const path = Object.values(trajetos).map(p => [p.lat, p.lng]);
    trails[id] = L.polyline(path, {color: cor, weight: 4, opacity: 0.6, dashArray: '10, 15'}).addTo(map);
}

function trackMe() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const ref = db.ref('familia/' + myName);
        ref.update({ lat: latitude, lng: longitude });
        ref.child('trajetos').push({ lat: latitude, lng: longitude, t: Date.now() });
    }, null, { enableHighAccuracy: true });
}

function focarFamilia() {
    const group = new L.featureGroup(Object.values(markers));
    if (group.getLayers().length > 0) map.fitBounds(group.getBounds().pad(0.4));
}
