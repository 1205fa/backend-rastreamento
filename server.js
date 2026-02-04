const express = require('express'); // Faltava essa linha!
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

// Rota para abrir o mapa
app.get('/', (req, res) => res.sendFile(__dirname + '/mapa.html'));

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

let frota = {}; 

io.on('connection', (socket) => {
    console.log('Dispositivo conectado:', socket.id);

    socket.on('enviarLocalizacao', (dados) => {
        // Salva na memória garantindo que pegue lat/lng de qualquer jeito
        frota[socket.id] = {
            id: socket.id,
            usuario: dados.usuario || "Motorista",
            veiculo: dados.veiculo || "onibus",
            lat: dados.latitude || dados.lat,
            lng: dados.longitude || dados.lng
        };
        
        // Avisa todos os mapas (passageiros)
        io.emit('frota_atualizada', frota);
    });

    socket.on('disconnect', () => {
        delete frota[socket.id];
        io.emit('frota_atualizada', frota);
        console.log('Dispositivo desconectado');
    });
});

// Porta dinâmica para o Render ou 3000 local
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Servidor VIP rodando na porta ${PORT}`);
});

