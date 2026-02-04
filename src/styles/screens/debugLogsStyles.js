import { StyleSheet, Platform } from 'react-native';

export const debugLogsStyles = StyleSheet.create({
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
