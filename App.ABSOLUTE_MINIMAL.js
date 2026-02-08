import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

console.log('🚀 [APP] Versão MÍNIMA ABSOLUTA - Sem dependências complexas');

export default function App() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('✅ [APP] Pronto!');
            setReady(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!ready) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>ALUKO</Text>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.subtitle}>Carregando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>ALUKO</Text>
            <Text style={styles.success}>App Funcionando!</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>✅ Teste Bem-Sucedido</Text>
                <Text style={styles.text}>Se você está vendo esta tela:</Text>
                <Text style={styles.bullet}>• App instalado corretamente</Text>
                <Text style={styles.bullet}>• Build process OK</Text>
                <Text style={styles.bullet}>• Estilos corrigidos (sem width: '100%')</Text>
                <Text style={styles.bullet}>• SEM CRASH!</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📱 Próximo Passo</Text>
                <Text style={styles.text}>
                    Confirme que funcionou e vamos ativar
                    as funcionalidades completas do app!
                </Text>
            </View>

            <Text style={styles.footer}>Version Code 9 - Feb 2026</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginTop: 20,
    },
    success: {
        fontSize: 24,
        color: '#10B981',
        fontWeight: '600',
        marginBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginVertical: 10,
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    text: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 8,
    },
    bullet: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginLeft: 10,
    },
    footer: {
        fontSize: 12,
        color: '#999',
        marginTop: 30,
    },
});
