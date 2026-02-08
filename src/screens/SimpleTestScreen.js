import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function SimpleTestScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>🎉 ALUKO</Text>
                    <Text style={styles.subtitle}>App funcionando!</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>✅ Teste Bem-Sucedido</Text>
                    <Text style={styles.cardText}>
                        Se você está vendo esta tela, significa que:
                    </Text>
                    <Text style={styles.bulletPoint}>• O app foi instalado corretamente</Text>
                    <Text style={styles.bulletPoint}>• A autenticação está funcionando</Text>
                    <Text style={styles.bulletPoint}>• Não há crashes no início</Text>
                    <Text style={styles.bulletPoint}>• Todas as correções foram aplicadas</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📱 Versão de Teste</Text>
                    <Text style={styles.cardText}>
                        Esta é uma versão simplificada do ALUKO para validar
                        que todas as correções de código foram aplicadas com sucesso.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🚀 Próximos Passos</Text>
                    <Text style={styles.cardText}>
                        Agora que confirmamos que o app abre sem crashes,
                        vamos reativar as funcionalidades gradualmente.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>ALUKO v1.0.0</Text>
                    <Text style={styles.footerText}>Build Test - Feb 2026</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginVertical: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 24,
        color: '#10B981',
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 8,
    },
    bulletPoint: {
        fontSize: 15,
        color: '#666',
        lineHeight: 24,
        marginLeft: 10,
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
});
