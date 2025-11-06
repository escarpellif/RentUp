import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../../supabase'; // Importe o cliente configurado

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Alterna entre Login e Cadastro

  // -------------------------
  // LÓGICA DE LOGIN (SIGN IN)
  // -------------------------
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Erro no Login', error.message);
    setLoading(false);
    // Se for sucesso, a sessão é salva e o app recarrega ou navega para a tela principal
  }

  // -------------------------
  // LÓGICA DE CADASTRO (SIGN UP)
  // -------------------------
  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Erro no Cadastro', error.message);
    if (!session) {
      Alert.alert(
        'Verifique o E-mail',
        'Confirme o link enviado para o seu e-mail para completar o cadastro.'
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Cadastre-se' : 'Fazer Login'}</Text>
      
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="E-mail"
        autoCapitalize={'none'}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry={true}
        placeholder="Senha"
        autoCapitalize={'none'}
      />

      <View style={styles.buttonContainer}>
        {isRegistering ? (
          <Button
            title={loading ? 'Cadastrando...' : 'Cadastrar'}
            onPress={signUpWithEmail}
            disabled={loading}
          />
        ) : (
          <Button
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={signInWithEmail}
            disabled={loading}
          />
        )}
      </View>
      
      <View style={styles.toggleContainer}>
        <Text onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleText}>
          {isRegistering ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  toggleContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});
