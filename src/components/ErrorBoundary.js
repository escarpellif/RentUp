// ============================================
// ERROR BOUNDARY
// Captura erros do React e previne crashes
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Logger from '../services/LoggerService';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Atualizar estado para renderizar fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log do erro
        console.error('🔴 Error Boundary capturou erro:', error, errorInfo);

        // Salvar erro no estado
        this.setState({
            error,
            errorInfo,
        });

        // Log estruturado
        Logger.error(
            'React Error Boundary',
            {
                screen: 'Unknown', // Pode melhorar detectando a tela
                componentStack: errorInfo.componentStack,
            },
            error
        );
    }

    handleRestart = () => {
        // Reset do estado
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // UI de fallback amigável
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.emoji}>😕</Text>
                        <Text style={styles.title}>Oops! Algo deu errado</Text>
                        <Text style={styles.message}>
                            Desculpe, ocorreu um erro inesperado. Nosso time foi notificado e vamos corrigir isso.
                        </Text>

                        {/* Botões de ação */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleRestart}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Tentar Novamente</Text>
                        </TouchableOpacity>

                        {/* Detalhes do erro (apenas em desenvolvimento) */}
                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorDetailsContainer}>
                                <Text style={styles.errorDetailsTitle}>
                                    Detalhes do Erro (Dev Mode):
                                </Text>
                                <Text style={styles.errorDetailsText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorDetailsText}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            );
        }

        // Renderizar children normalmente
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorDetailsContainer: {
        marginTop: 30,
        width: '100%',
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    errorDetailsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 8,
    },
    errorDetailsText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
});

export default ErrorBoundary;

