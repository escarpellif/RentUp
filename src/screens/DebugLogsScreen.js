// ============================================
// DEBUG LOGS SCREEN
// Tela para visualizar logs salvos
// ============================================

import React, { useState, useEffect } from 'react';
import {View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logger from '../services/LoggerService';
import { debugLogsStyles } from '../styles/screens/debugLogsStyles';

export default function DebugLogsScreen({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const [logsData, statsData] = await Promise.all([
                Logger.getLogs(),
                Logger.getLogStats(),
            ]);
            setLogs(logsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = () => {
        Alert.alert(
            '🗑️ Limpar Logs',
            'Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpar',
                    style: 'destructive',
                    onPress: async () => {
                        await Logger.clearLogs();
                        loadLogs();
                        Alert.alert('✅ Sucesso', 'Logs limpos com sucesso!');
                    },
                },
            ]
        );
    };

    const handleExportLogs = async () => {
        try {
            const logsJson = await Logger.exportLogs();

            if (logsJson) {
                // Compartilhar logs
                await Share.share({
                    message: logsJson,
                    title: 'ALUKO - Logs do App',
                });
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível exportar os logs');
        }
    };

    const getLogColor = (level) => {
        switch (level) {
            case 'ERROR':
                return '#EF4444';
            case 'WARN':
                return '#F59E0B';
            case 'INFO':
                return '#3B82F6';
            case 'DEBUG':
                return '#6B7280';
            default:
                return '#333';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={debugLogsStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={debugLogsStyles.loadingText}>Cargando logs...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={debugLogsStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={debugLogsStyles.header}>
                <TouchableOpacity
                    style={debugLogsStyles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={debugLogsStyles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={debugLogsStyles.headerTitle}>Debug Logs</Text>
                <View style={debugLogsStyles.headerSpacer} />
            </View>

            {/* Stats Card */}
            {stats && (
                <View style={debugLogsStyles.statsCard}>
                    <Text style={debugLogsStyles.statsTitle}>📊 Estatísticas</Text>
                    <View style={debugLogsStyles.statsRow}>
                        <View style={debugLogsStyles.statItem}>
                            <Text style={debugLogsStyles.statNumber}>{stats.total}</Text>
                            <Text style={debugLogsStyles.statLabel}>Total</Text>
                        </View>
                        <View style={debugLogsStyles.statItem}>
                            <Text style={[debugLogsStyles.statNumber, { color: '#EF4444' }]}>
                                {stats.errors}
                            </Text>
                            <Text style={debugLogsStyles.statLabel}>Erros</Text>
                        </View>
                        <View style={debugLogsStyles.statItem}>
                            <Text style={[debugLogsStyles.statNumber, { color: '#F59E0B' }]}>
                                {stats.warns}
                            </Text>
                            <Text style={debugLogsStyles.statLabel}>Avisos</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            <View style={debugLogsStyles.actionsContainer}>
                <TouchableOpacity
                    style={[debugLogsStyles.actionButton, debugLogsStyles.exportButton]}
                    onPress={handleExportLogs}
                >
                    <Text style={debugLogsStyles.actionButtonText}>📤 Exportar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[debugLogsStyles.actionButton, debugLogsStyles.clearButton]}
                    onPress={handleClearLogs}
                >
                    <Text style={debugLogsStyles.actionButtonText}>🗑️ Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[debugLogsStyles.actionButton, debugLogsStyles.refreshButton]}
                    onPress={loadLogs}
                >
                    <Text style={debugLogsStyles.actionButtonText}>🔄 Atualizar</Text>
                </TouchableOpacity>
            </View>

            {/* Logs List */}
            <ScrollView style={debugLogsStyles.logsContainer}>
                {logs.length === 0 ? (
                    <View style={debugLogsStyles.emptyState}>
                        <Text style={debugLogsStyles.emptyStateEmoji}>📝</Text>
                        <Text style={debugLogsStyles.emptyStateText}>
                            Nenhum log registrado ainda
                        </Text>
                    </View>
                ) : (
                    logs.map((log, index) => (
                        <View key={index} style={debugLogsStyles.logItem}>
                            {/* Header do Log */}
                            <View style={debugLogsStyles.logHeader}>
                                <Text
                                    style={[
                                        debugLogsStyles.logLevel,
                                        { color: getLogColor(log.level) },
                                    ]}
                                >
                                    {log.level}
                                </Text>
                                <Text style={debugLogsStyles.logTimestamp}>
                                    {formatTimestamp(log.timestamp)}
                                </Text>
                            </View>

                            {/* Mensagem */}
                            <Text style={debugLogsStyles.logMessage}>{log.message}</Text>

                            {/* Contexto */}
                            {log.context && Object.keys(log.context).length > 0 && (
                                <View style={debugLogsStyles.logContext}>
                                    <Text style={debugLogsStyles.logContextTitle}>Contexto:</Text>
                                    <Text style={debugLogsStyles.logContextText}>
                                        {JSON.stringify(log.context, null, 2)}
                                    </Text>
                                </View>
                            )}

                            {/* Error Details */}
                            {log.error && (
                                <View style={debugLogsStyles.logError}>
                                    <Text style={debugLogsStyles.logErrorTitle}>Erro:</Text>
                                    <Text style={debugLogsStyles.logErrorText}>
                                        {log.error.name}: {log.error.message}
                                    </Text>
                                    {log.error.stack && (
                                        <Text style={debugLogsStyles.logErrorStack}>
                                            {log.error.stack}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}



