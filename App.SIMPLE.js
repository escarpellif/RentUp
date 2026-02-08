import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Importar apenas a tela de teste simples
import SimpleTestScreen from './src/screens/SimpleTestScreen';

console.log('🚀 [APP] App.js carregado - Versão Simplificada para Teste');

export default function App() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Timer de 2 segundos para simular carregamento
        const timer = setTimeout(() => {
            console.log('✅ [APP] App pronto para exibir');
            setReady(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Tela de carregamento simples
    if (!ready) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingTitle}>ALUKO</Text>
                <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    // Tela de teste simples
    return <SimpleTestScreen />;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 40,
    },
    spinner: {
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
    },
});
