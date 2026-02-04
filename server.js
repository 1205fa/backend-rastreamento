const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

// Serve o mapa na rota principal
app.get('/', (req, res) => res.sendFile(__dirname + '/mapa.html'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let frota = {}; 

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // ESCUTA O MOTORISTA
    socket.on('enviarLocalizacao', (dados) => {
        console.log(`Dados recebidos de ${dados.usuario}:`, dados);
        
        frota[socket.id] = {
            id: socket.id,
            usuario: dados.usuario || "Motorista",
            veiculo: dados.veiculo || "onibus",
            lat: dados.latitude,
            lng: dados.longitude
        };

        // Grita para o mapa.html atualizar
        io.emit('frota_atualizada', frota);
    });

    socket.on('disconnect', () => {
        delete frota[socket.id];
        io.emit('frota_atualizada', frota);
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});