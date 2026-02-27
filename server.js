const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => res.sendFile(__dirname + '/mapa.html'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let frota = {}; 
let totalPessoas = 0;

function calcularDistancia(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999; 
    const R = 6371e3; 
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

io.on('connection', (socket) => {
    totalPessoas++;
    io.emit('atualizar_contador', totalPessoas);

    socket.on('enviarLocalizacao', (dados) => {
        const agora = Date.now();
        const novaLat = dados.latitude || dados.lat;
        const novaLng = dados.longitude || dados.lng;
        const anterior = frota[socket.id] || {};
        
        const dist = calcularDistancia(anterior.lat, anterior.lng, novaLat, novaLng);

        // REGRA DA ÂNCORA (5 metros)
        if (dist > 5) {
            let velocidade = 0;
            if (anterior.timestamp) {
                // Cálculo: Distância (m) / Tempo (s) * 3.6 = km/h
                const tempoSegundos = (agora - anterior.timestamp) / 1000;
                velocidade = (dist / tempoSegundos) * 3.6; 
            }

            frota[socket.id] = {
                id: socket.id,
                usuario: dados.usuario || "Motorista",
                veiculo: dados.veiculo || "onibus",
                lat: novaLat,
                lng: novaLng,
                vel: velocidade.toFixed(1), // Salva a velocidade com 1 casa decimal
                timestamp: agora
            };

            io.emit('frota_atualizada', frota);
            console.log(`📍 ${dados.usuario} | Dist: ${dist.toFixed(1)}m | Vel: ${velocidade.toFixed(1)} km/h`);
        } else {
            console.log(`⚓ ÂNCORA: ${dados.usuario || 'Motorista'} parado.`);
        }
    });

    socket.on('disconnect', () => {
        totalPessoas--;
        delete frota[socket.id];
        io.emit('atualizar_contador', totalPessoas);
        io.emit('frota_atualizada', frota);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n>>> SISTEMA VIP RODANDO NA PORTA ${PORT}`);
    console.log(`>>> ÂNCORA E VELOCÍMETRO ATIVOS\n`);
});
