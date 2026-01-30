import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

// ✅ LINK DO SERVIDOR NO RENDER (Sem o /atualizar no final)
const ENDERECO_SERVIDOR = 'https://backend-rastreamento-1.onrender.com'; 

const socket = io(ENDERECO_SERVIDOR);

export default function App() {
  const [localizacao, setLocalizacao] = useState(null);
  const [nome, setNome] = useState('');
  const [rastreando, setRastreando] = useState(false);
  const [tipoVeiculo, setTipoVeiculo] = useState('carro');

  useEffect(() => {
    pedirPermissao();
  }, []);

  const pedirPermissao = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos do GPS para funcionar!');
      return;
    }
  };

  const iniciarRastreamento = async () => {
    if (nome.trim() === '') {
      Alert.alert('Atenção', 'Digite seu nome para começar!');
      return;
    }

    setRastreando(true);

    await Location.watchPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 2000,
      distanceInterval: 5
    }, (location) => {
      
      const dados = {
        usuario: nome,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        tipo: tipoVeiculo
      };

      setLocalizacao(location.coords);
      socket.emit('enviarLocalizacao', dados);
    });
  };

  return (
    <View style={styles.container}>
      {/* ⚠️ SE ESTIVER ESCRITO "RASTREAMENTO 2.0", ESTÁ CERTO! */}
      <Text style={styles.titulo}>Rastreamento 2.0</Text>
      <Text style={styles.subtitulo}>AgendaSegura</Text>

      <View style={styles.inputBox}>
        <Text style={styles.label}>Seu Nome (Identificação):</Text>
        <TextInput 
          style={styles.input}
          placeholder="Ex: Fabricio"
          placeholderTextColor="#666"
          value={nome}
          onChangeText={setNome}
          editable={!rastreando}
        />
      </View>

      <Text style={styles.label}>Tipo de Veículo:</Text>
      <View style={styles.botoesContainer}>
        <TouchableOpacity 
          style={[styles.botaoTipo, tipoVeiculo === 'moto' && styles.botaoAtivo]} 
          onPress={() => setTipoVeiculo('moto')}>
          <Text style={styles.textoBotao}>🏍️ Moto</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.botaoTipo, tipoVeiculo === 'carro' && styles.botaoAtivo]} 
          onPress={() => setTipoVeiculo('carro')}>
          <Text style={styles.textoBotao}>🚗 Carro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.botaoTipo, tipoVeiculo === 'onibus' && styles.botaoAtivo]} 
          onPress={() => setTipoVeiculo('onibus')}>
          <Text style={styles.textoBotao}>🚌 Ônibus</Text>
        </TouchableOpacity>
      </View>

      {!rastreando ? (
        <TouchableOpacity style={styles.botaoIniciar} onPress={iniciarRastreamento}>
          <Text style={styles.textoIniciar}>INICIAR RASTREAMENTO</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.statusBox}>
          <ActivityIndicator size="large" color="#00ffcc" />
          <Text style={styles.statusTexto}>Enviando localização de:</Text>
          <Text style={styles.statusNome}>{nome}</Text>
        </View>
      )}

      <Text style={styles.footer}>Versão 2.0 - Neon Edition</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  titulo: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  subtitulo: { fontSize: 18, color: '#00ffcc', marginBottom: 30 },
  inputBox: { width: '100%', marginBottom: 20 },
  label: { color: '#ccc', marginBottom: 5, fontSize: 16 },
  input: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 8, fontSize: 18, borderWidth: 1, borderColor: '#555' },
  botoesContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  botaoTipo: { backgroundColor: '#333', padding: 10, borderRadius: 8, width: '30%', alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  botaoAtivo: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  textoBotao: { fontSize: 16, fontWeight: 'bold' },
  botaoIniciar: { backgroundColor: '#00ffcc', padding: 20, borderRadius: 12, width: '100%', alignItems: 'center', shadowColor: '#00ffcc', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  textoIniciar: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  statusBox: { alignItems: 'center', marginTop: 20 },
  statusTexto: { color: '#fff', marginTop: 10 },
  statusNome: { color: '#00ffcc', fontSize: 24, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 20, color: '#555' }
});