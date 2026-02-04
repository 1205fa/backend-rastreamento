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
let totalPessoas = 0; // Variável nova para contar gente

io.on('connection', (socket) => {
    // 1. Aumenta o contador quando alguém entra
    totalPessoas++;
    console.log('Alguém entrou! Total: ' + totalPessoas);
    
    // 2. Avisa todo mundo qual o novo número
    io.emit('atualizar_contador', totalPessoas);

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
        // 3. Diminui o contador quando alguém sai
        totalPessoas--;
        delete frota[socket.id];
        
        // 4. Avisa que saiu gente e atualiza o mapa
        io.emit('atualizar_contador', totalPessoas);
        io.emit('frota_atualizada', frota);
        console.log('Alguém saiu. Total: ' + totalPessoas);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Servidor VIP rodando na porta ${PORT}`);
});
