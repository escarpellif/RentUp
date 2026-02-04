// ============================================
// ERROR BOUNDARY
// Captura erros do React e previne crashes
// ============================================

import React from 'react';
import {View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Logger from '../services/LoggerService';
import { errorBoundaryStyles } from '../styles/components/errorBoundaryStyles';

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
                <View style={errorBoundaryStyles.container}>
                    <View style={errorBoundaryStyles.content}>
                        <Text style={errorBoundaryStyles.emoji}>😕</Text>
                        <Text style={errorBoundaryStyles.title}>Oops! Algo deu errado</Text>
                        <Text style={errorBoundaryStyles.message}>
                            Desculpe, ocorreu um erro inesperado. Nosso time foi notificado e vamos corrigir isso.
                        </Text>

                        {/* Botões de ação */}
                        <TouchableOpacity
                            style={errorBoundaryStyles.button}
                            onPress={this.handleRestart}
                            activeOpacity={0.8}
                        >
                            <Text style={errorBoundaryStyles.buttonText}>Tentar Novamente</Text>
                        </TouchableOpacity>

                        {/* Detalhes do erro (apenas em desenvolvimento) */}
                        {__DEV__ && this.state.error && (
                            <ScrollView style={errorBoundaryStyles.errorDetailsContainer}>
                                <Text style={errorBoundaryStyles.errorDetailsTitle}>
                                    Detalhes do Erro (Dev Mode):
                                </Text>
                                <Text style={errorBoundaryStyles.errorDetailsText}>
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text style={errorBoundaryStyles.errorDetailsText}>
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



export default ErrorBoundary;

