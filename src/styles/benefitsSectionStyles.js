import { StyleSheet } from 'react-native';

export const benefitsSectionStyles = StyleSheet.create({
    container: {
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: '#F8F9FA',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#2c4455',
        textAlign: 'center',
        marginBottom: 24,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    benefitCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2c4455',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    benefitIcon: {
        fontSize: 36,
    },
    benefitTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 6,
    },
    benefitSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2c4455',
        textAlign: 'center',
        marginBottom: 8,
    },
    benefitDescription: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
    },
});

