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
io.on('connection', (socket) => {
    socket.on('enviarLocalizacao', (dados) => {
        frota[socket.id] = {
            id: socket.id,
            usuario: dados.usuario || "Motorista",
            veiculo: dados.veiculo || "onibus",
            lat: dados.latitude || dados.lat,
            lng: dados.longitude || dados.lng
        };
        io.emit('frota_atualizada', frota);
    });
    socket.on('disconnect', () => {
        delete frota[socket.id];
        io.emit('frota_atualizada', frota);
    });
});
server.listen(process.env.PORT || 3000, '0.0.0.0');
