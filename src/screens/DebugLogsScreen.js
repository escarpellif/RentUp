// ============================================
// DEBUG LOGS SCREEN
// Tela para visualizar logs salvos
// ============================================

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Share,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logger from '../services/LoggerService';

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Cargando logs...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Debug Logs</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Stats Card */}
            {stats && (
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>📊 Estatísticas</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                                {stats.errors}
                            </Text>
                            <Text style={styles.statLabel}>Erros</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                                {stats.warns}
                            </Text>
                            <Text style={styles.statLabel}>Avisos</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.exportButton]}
                    onPress={handleExportLogs}
                >
                    <Text style={styles.actionButtonText}>📤 Exportar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.clearButton]}
                    onPress={handleClearLogs}
                >
                    <Text style={styles.actionButtonText}>🗑️ Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.refreshButton]}
                    onPress={loadLogs}
                >
                    <Text style={styles.actionButtonText}>🔄 Atualizar</Text>
                </TouchableOpacity>
            </View>

            {/* Logs List */}
            <ScrollView style={styles.logsContainer}>
                {logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>📝</Text>
                        <Text style={styles.emptyStateText}>
                            Nenhum log registrado ainda
                        </Text>
                    </View>
                ) : (
                    logs.map((log, index) => (
                        <View key={index} style={styles.logItem}>
                            {/* Header do Log */}
                            <View style={styles.logHeader}>
                                <Text
                                    style={[
                                        styles.logLevel,
                                        { color: getLogColor(log.level) },
                                    ]}
                                >
                                    {log.level}
                                </Text>
                                <Text style={styles.logTimestamp}>
                                    {formatTimestamp(log.timestamp)}
                                </Text>
                            </View>

                            {/* Mensagem */}
                            <Text style={styles.logMessage}>{log.message}</Text>

                            {/* Contexto */}
                            {log.context && Object.keys(log.context).length > 0 && (
                                <View style={styles.logContext}>
                                    <Text style={styles.logContextTitle}>Contexto:</Text>
                                    <Text style={styles.logContextText}>
                                        {JSON.stringify(log.context, null, 2)}
                                    </Text>
                                </View>
                            )}

                            {/* Error Details */}
                            {log.error && (
                                <View style={styles.logError}>
                                    <Text style={styles.logErrorTitle}>Erro:</Text>
                                    <Text style={styles.logErrorText}>
                                        {log.error.name}: {log.error.message}
                                    </Text>
                                    {log.error.stack && (
                                        <Text style={styles.logErrorStack}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    backArrow: {
        fontSize: 22,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    statsCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    exportButton: {
        backgroundColor: '#3B82F6',
    },
    clearButton: {
        backgroundColor: '#EF4444',
    },
    refreshButton: {
        backgroundColor: '#10B981',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    logsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyStateEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
    },
    logItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E8E8E8',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    logLevel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    logTimestamp: {
        fontSize: 11,
        color: '#999',
    },
    logMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    logContext: {
        backgroundColor: '#F8F9FA',
        padding: 8,
        borderRadius: 4,
        marginTop: 8,
    },
    logContextTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    logContextText: {
        fontSize: 10,
        color: '#666',
        fontFamily: 'monospace',
    },
    logError: {
        backgroundColor: '#FEE2E2',
        padding: 8,
        borderRadius: 4,
        marginTop: 8,
    },
    logErrorTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 4,
    },
    logErrorText: {
        fontSize: 11,
        color: '#991B1B',
        marginBottom: 4,
    },
    logErrorStack: {
        fontSize: 9,
        color: '#991B1B',
        fontFamily: 'monospace',
    },
});

