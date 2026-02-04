import { StyleSheet } from 'react-native';

export const rentalCalendarStyles = StyleSheet.create({
overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '90%' },
    inlineContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700' },
    close: { fontSize: 22, color: '#666' },
    legend: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, marginBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
    legendBox: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
    legendText: { fontSize: 12, color: '#666' },
    summary: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginTop: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancel: { backgroundColor: '#f0f0f0', marginRight: 8 },
    confirm: { backgroundColor: '#007bff' },
});
