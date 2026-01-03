// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPwwAWS2aiEqeFJX1ARgRmHzFEj5RCpiw",
    databaseURL: "https://rastreador-familia-6fe52-default-rtdb.firebaseio.com/",
    projectId: "rastreador-familia-6fe52",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let map, meuNome, marcadores = {}, rastrosAtivos = {};
let seguindoUsuario = null; // Variável para saber quem o mapa está seguindo
const coresVip = ['#6c5ce7', '#00b894', '#ff7675', '#0984e3', '#f1c40f'];

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
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0,0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // Se o usuário arrastar o mapa manualmente, para de seguir automaticamente
    map.on('dragstart', () => {
        seguindoUsuario = null;
    });

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
                
                // SEGUIR MOVIMENTO: Se este usuário for o escolhido para seguir, move a câmera
                if (seguindoUsuario === id) {
                    map.panTo([u.lat, u.lng]);
                }
            } else {
                marcadores[id] = L.marker([u.lat, u.lng], {
                    icon: L.divIcon({
                        className: 'marcador-vip',
                        html: `<div class="bolha-usuario" style="background:${cor}">${id.substring(0,1).toUpperCase()}</div>
                               <div class="etiqueta-info"><b>${id}</b> • <span id="km-${id}">${km} km</span></div>`,
                        iconSize: [45, 45], iconAnchor: [22, 45]
                    })
                }).addTo(map).on('click', () => ativarSeguirEHistorico(id, u.trajetos, cor, [u.lat, u.lng]));
            }
        }
    });
}

function ativarSeguirEHistorico(id, trajetos, cor, pos) {
    // Define que agora o mapa deve seguir este usuário
    seguindoUsuario = id;
    
    // Amplia o mapa (zoom) para acompanhar o movimento de perto
    map.flyTo(pos, 17, { animate: true, duration: 1.5 });

    // Gerencia o rastro (Histórico)
    if (rastrosAtivos[id]) {
        map.removeLayer(rastrosAtivos[id]);
        delete rastrosAtivos[id];
    } else if (trajetos) {
        const pontos = Object.values(trajetos).map(p => [p.lat, p.lng]);
        rastrosAtivos[id] = L.polyline(pontos, {
            color: cor, 
            weight: 5, 
            opacity: 0.5, 
            dashArray: '10, 10'
        }).addTo(map);
    }
}

function iniciarGPS() {
    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const ref = db.ref('familia/' + meuNome);
        
        ref.update({ lat: latitude, lng: longitude });
        ref.child('trajetos').push({ lat: latitude, lng: longitude, t: Date.now() });
        
        // Se for a primeira vez ou se estiver seguindo a si mesmo, centraliza
        if (!seguindoUsuario || seguindoUsuario === meuNome) {
            if (map.getZoom() < 10) {
                map.setView([latitude, longitude], 17);
                seguindoUsuario = meuNome;
            }
        }
    }, null, { enableHighAccuracy: true, maximumAge: 0 });
}

function focarGeral() {
    seguindoUsuario = null; // Para de seguir alguém específico para ver todos
    const grupo = new L.featureGroup(Object.values(marcadores));
    if (grupo.getLayers().length > 0) map.fitBounds(grupo.getBounds().pad(0.3));
}

window.onload = () => {
    const salvo = localStorage.getItem('life_vip_nome');
    if (salvo) {
        document.getElementById('login-screen').style.display = 'none';
        meuNome = salvo;
        iniciarApp();
    }
};
