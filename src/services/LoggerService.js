    // ============================================
// LOGGER SERVICE
// Sistema centralizado de logs para produção
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const LOG_STORAGE_KEY = '@aluko_logs';
const MAX_LOGS = 100; // Máximo de logs armazenados

// Níveis de log
export const LogLevel = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

class LoggerService {
    constructor() {
        this.isProduction = !__DEV__;
        this.deviceInfo = null;
        this.initDeviceInfo();
    }

    // Inicializar informações do dispositivo
    async initDeviceInfo() {
        try {
            this.deviceInfo = {
                brand: Device.brand,
                modelName: Device.modelName,
                osName: Device.osName,
                osVersion: Device.osVersion,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                deviceType: Device.deviceType,
            };
        } catch (error) {
            console.error('Erro ao obter info do dispositivo:', error);
        }
    }

    // Criar objeto de log estruturado
    createLogEntry(level, message, context = {}, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...context,
                device: this.deviceInfo,
                platform: Platform.OS,
            },
        };

        // Adicionar stack trace se for erro
        if (error) {
            logEntry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        return logEntry;
    }

    // Salvar log no AsyncStorage
    async persistLog(logEntry) {
        try {
            // Buscar logs existentes
            const existingLogs = await this.getLogs();

            // Adicionar novo log no início
            const updatedLogs = [logEntry, ...existingLogs];

            // Manter apenas os últimos MAX_LOGS
            const trimmedLogs = updatedLogs.slice(0, MAX_LOGS);

            // Salvar
            await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
        } catch (error) {
            console.error('Erro ao persistir log:', error);
        }
    }

    // Buscar logs salvos
    async getLogs() {
        try {
            const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            return logsJson ? JSON.parse(logsJson) : [];
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            return [];
        }
    }

    // Limpar todos os logs
    async clearLogs() {
        try {
            await AsyncStorage.removeItem(LOG_STORAGE_KEY);
            console.log('📝 Logs limpos com sucesso');
        } catch (error) {
            console.error('Erro ao limpar logs:', error);
        }
    }

    // Exportar logs como JSON
    async exportLogs() {
        try {
            const logs = await this.getLogs();
            return JSON.stringify(logs, null, 2);
        } catch (error) {
            console.error('Erro ao exportar logs:', error);
            return null;
        }
    }

    // LOG ERROR (Crítico)
    async error(message, context = {}, error = null) {
        const logEntry = this.createLogEntry(LogLevel.ERROR, message, context, error);

        // Sempre mostrar no console em desenvolvimento
        if (__DEV__) {
            console.error('🔴 [ERROR]', message, context, error);
        }

        // Persistir em produção
        if (this.isProduction) {
            await this.persistLog(logEntry);
        }

        // TODO: Enviar para servidor em produção
        // await this.sendToServer(logEntry);

        return logEntry;
    }

    // LOG WARN (Aviso)
    async warn(message, context = {}) {
        const logEntry = this.createLogEntry(LogLevel.WARN, message, context);

        if (__DEV__) {
            console.warn('🟡 [WARN]', message, context);
        }

        if (this.isProduction) {
            await this.persistLog(logEntry);
        }

        return logEntry;
    }

    // LOG INFO (Informação)
    async info(message, context = {}) {
        const logEntry = this.createLogEntry(LogLevel.INFO, message, context);

        if (__DEV__) {
            console.log('🔵 [INFO]', message, context);
        }

        // Não persistir INFO em produção (muito volume)
        // Apenas em desenvolvimento

        return logEntry;
    }

    // LOG DEBUG (Desenvolvimento)
    async debug(message, context = {}) {
        const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context);

        if (__DEV__) {
            console.log('⚪ [DEBUG]', message, context);
        }

        // Apenas em desenvolvimento

        return logEntry;
    }

    // Enviar logs para servidor (implementar quando tiver API)
    async sendToServer(logEntry) {
        // TODO: Implementar quando tiver endpoint
        /*
        try {
            await fetch('https://api.aluko.com/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry),
            });
        } catch (error) {
            console.error('Erro ao enviar log para servidor:', error);
        }
        */
    }

    // Obter estatísticas de logs
    async getLogStats() {
        try {
            const logs = await this.getLogs();

            const stats = {
                total: logs.length,
                errors: logs.filter(l => l.level === LogLevel.ERROR).length,
                warns: logs.filter(l => l.level === LogLevel.WARN).length,
                info: logs.filter(l => l.level === LogLevel.INFO).length,
                lastError: logs.find(l => l.level === LogLevel.ERROR),
            };

            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return null;
        }
    }
}

// Exportar instância única (Singleton)
const Logger = new LoggerService();
export default Logger;

