import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const adminReportsStyles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    financialSummary: {
        flexDirection: 'row',
        gap: 12,
    },
    financialCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    financialValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    kpiContainer: {
        gap: 12,
    },
    kpiCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    kpiLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 4,
    },
    kpiDescription: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});
