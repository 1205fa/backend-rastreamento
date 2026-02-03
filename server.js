const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

// Rota para o cliente acessar o mapa
app.get('/', (req, res) => res.sendFile(__dirname + '/mapa.html'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let frota = {}; // Guarda todos os motoristas online

io.on('connection', (socket) => {
    console.log('Dispositivo conectado:', socket.id);

    // Recebe dados do motorista (incluindo o tipo de veículo escolhido)
    socket.on('enviarLocalizacao', (dados) => {
        frota[socket.id] = {
            id: socket.id,
            usuario: dados.usuario || "Motorista",
            veiculo: dados.veiculo || "onibus", // Recebe: moto, carro ou onibus
            lat: dados.latitude,
            lng: dados.longitude
        };
        // Envia a lista completa de motoristas para todos os clientes
        io.emit('frota_atualizada', frota);
    });

    // Se o motorista sair, o servidor limpa o ícone dele na hora
    socket.on('disconnect', () => {
        delete frota[socket.id];
        io.emit('frota_atualizada', frota);
        console.log('Motorista offline:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Sistema VIP rodando na porta ${PORT}`));