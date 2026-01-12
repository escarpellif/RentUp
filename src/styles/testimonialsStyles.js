import { StyleSheet } from 'react-native';

export const testimonialsStyles = StyleSheet.create({
    container: {
        paddingVertical: 30,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c4455',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    testimonialCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginVertical: 5,
    },
    quoteIcon: {
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    quoteText: {
        fontSize: 48,
        color: '#4CAF50',
        fontWeight: 'bold',
        lineHeight: 48,
    },
    testimonialText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 15,
        fontStyle: 'italic',
    },
    ratingContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 4,
    },
    heart: {
        fontSize: 16,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 15,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 4,
    },
    authorLocation: {
        fontSize: 13,
        color: '#666',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
        transition: 'all 0.3s ease',
    },
    paginationDotActive: {
        width: 24,
        backgroundColor: '#10B981',
    },
});

