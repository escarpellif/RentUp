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

    if (error) Alert.alert('Error en el Login', error.message);
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

    if (error) Alert.alert('Error en el Registro', error.message);
    if (!session) {
      Alert.alert(
        'Verifica tu E-mail',
        'Confirma el enlace enviado a tu correo para completar el registro.'
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Regístrate' : 'Iniciar Sesión'}</Text>

      <TextInput
        style={styles.input}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="Correo Electrónico"
        autoCapitalize={'none'}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry={true}
        placeholder="Contraseña"
        autoCapitalize={'none'}
      />

      <View style={styles.buttonContainer}>
        {isRegistering ? (
          <Button
            title={loading ? 'Registrando...' : 'Registrarse'}
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
          {isRegistering ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Regístrate'}
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
