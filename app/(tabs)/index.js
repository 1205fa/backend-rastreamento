import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'; 

// ✅ SEU SERVIDOR NA NUVEM
const ENDERECO_SERVIDOR = 'https://backend-rastreamento-1.onrender.com'; 

const socket = io(ENDERECO_SERVIDOR);

export default function App() {
  const [nome, setNome] = useState(''); // Começa vazio pra pessoa digitar
  const [rastreando, setRastreando] = useState(false);
  const [tipoVeiculo, setTipoVeiculo] = useState('onibus'); 
  const [pacotes, setPacotes] = useState(0); 
  const locationSubscription = useRef(null);

  useEffect(() => {
    pedirPermissao();
  }, []);

  const pedirPermissao = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos do GPS para rastrear!');
    }
  };

  const iniciarRastreamento = async () => {
    if (nome.trim() === '') {
        Alert.alert('Atenção', 'Por favor, digite seu nome ou placa!');
        return;
    }

    setRastreando(true);
    setPacotes(0); 

    locationSubscription.current = await Location.watchPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000, 
      distanceInterval: 2 
    }, (location) => {
      
      setPacotes(prev => prev + 1);

      const dados = {
        usuario: nome, // Manda o nome que você digitou
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        tipo: tipoVeiculo
      };

      socket.emit('enviarLocalizacao', dados);
    });
  };

  const pararRastreamento = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setRastreando(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* ScrollView permite rolar a tela se o teclado cobrir algo */}
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.titulo}>Rastreamento</Text>
            <Text style={styles.subtitulo}>Sistema VIP</Text>
          </View>
          <FontAwesome5 name="satellite-dish" size={30} color="#00ffcc" />
        </View>

        {/* 1. CAMPO DE NOME (O QUE FALTOU!) */}
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Quem está dirigindo?</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Fabricio, Motorista 01, Placa ABC"
                placeholderTextColor="#666"
                value={nome}
                onChangeText={setNome}
                editable={!rastreando} // Trava o nome quando começa a rastrear
            />
        </View>

        {/* 2. BOTÕES DE VEÍCULO */}
        <Text style={styles.label}>Selecione seu Veículo:</Text>
        <View style={styles.gridVeiculos}>
          {['moto', 'carro', 'onibus'].map((v) => (
            <TouchableOpacity 
              key={v}
              onPress={() => !rastreando && setTipoVeiculo(v)} 
              style={[
                styles.botaoVeiculo, 
                tipoVeiculo === v ? styles.botaoAtivo : styles.botaoInativo
              ]}>
              <FontAwesome5 
                name={v === 'moto' ? 'motorcycle' : v === 'carro' ? 'car' : 'bus'} 
                size={24} 
                color={tipoVeiculo === v ? '#000' : '#fff'} 
              />
              <Text style={[
                styles.textoVeiculo, 
                { color: tipoVeiculo === v ? '#000' : '#fff' }
              ]}>
                {v.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. ÁREA DE STATUS */}
        <View style={[styles.card, rastreando ? styles.bordaVerde : styles.bordaCinza]}>
          <Text style={styles.cardTitulo}>STATUS DA CONEXÃO</Text>
          
          {rastreando ? (
            <View>
              <View style={styles.row}>
                <ActivityIndicator size="small" color="#00ffcc" style={{marginRight: 10}} />
                <Text style={styles.statusOn}>ONLINE</Text>
              </View>
              <Text style={styles.infoTexto}>Rastreando: <Text style={{fontWeight:'bold', color:'white'}}>{nome}</Text></Text>
              
              <View style={styles.contadorBox}>
                <Text style={styles.contadorLabel}>PACOTES ENVIADOS</Text>
                <Text style={styles.contadorNumero}>{pacotes}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.row}>
              <MaterialIcons name="portable-wifi-off" size={24} color="#ff4444" style={{marginRight: 10}} />
              <Text style={styles.statusOff}>OFFLINE</Text>
            </View>
          )}
        </View>

        {/* 4. BOTÃO GIGANTE DE AÇÃO */}
        <View style={styles.footer}>
          {!rastreando ? (
            <TouchableOpacity style={styles.botaoIniciar} onPress={iniciarRastreamento}>
              <Text style={styles.textoBotao}>INICIAR</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.botaoParar} onPress={pararRastreamento}>
              <Text style={styles.textoBotao}>PARAR</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 20 },
  titulo: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  subtitulo: { fontSize: 14, color: '#00ffcc' },
  label: { color: '#aaa', marginBottom: 10, fontSize: 16 },
  
  // Estilo do Input Novo
  inputContainer: { marginBottom: 20 },
  input: { 
      backgroundColor: '#1e1e1e', 
      color: 'white', 
      padding: 15, 
      borderRadius: 10, 
      borderWidth: 1, 
      borderColor: '#333',
      fontSize: 16
  },

  gridVeiculos: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  botaoVeiculo: { width: '30%', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  botaoAtivo: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
  botaoInativo: { backgroundColor: '#2a2a2a', borderColor: '#444' },
  textoVeiculo: { marginTop: 5, fontWeight: 'bold', fontSize: 12 },

  card: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 15, marginBottom: 20, borderLeftWidth: 5 },
  bordaVerde: { borderLeftColor: '#00ffcc' },
  bordaCinza: { borderLeftColor: '#444' },
  cardTitulo: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusOn: { color: '#00ffcc', fontSize: 20, fontWeight: 'bold' },
  statusOff: { color: '#ff4444', fontSize: 20, fontWeight: 'bold' },
  infoTexto: { color: '#ccc', marginBottom: 15 },

  contadorBox: { backgroundColor: '#000', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  contadorLabel: { color: '#00ffcc', fontSize: 12 },
  contadorNumero: { color: '#fff', fontSize: 32, fontWeight: 'bold' },

  footer: { marginTop: 10, marginBottom: 20 },
  botaoIniciar: { backgroundColor: '#00cc44', padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#00cc44', elevation: 10 },
  botaoParar: { backgroundColor: '#cc0000', padding: 20, borderRadius: 12, alignItems: 'center' },
  textoBotao: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});