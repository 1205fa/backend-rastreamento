const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

// Rota principal serve o mapa
app.get('/', (req, res) => res.sendFile(__dirname + '/mapa.html'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let frota = {}; 

io.on('connection', (socket) => {
    console.log('Conectado:', socket.id);

    socket.on('enviarLocalizacao', (dados) => {
        frota[socket.id] = {
            id: socket.id,
            usuario: dados.usuario || "Motorista",
            veiculo: dados.veiculo || "onibus",
            lat: dados.latitude,
            lng: dados.longitude
        };
        io.emit('frota_atualizada', frota);
    });

    socket.on('disconnect', () => {
        delete frota[socket.id];
        io.emit('frota_atualizada', frota);
        console.log('Offline:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Sistema rodando na porta ${PORT}`));