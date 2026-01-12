import { StyleSheet } from 'react-native';

export const footerStyles = StyleSheet.create({
    footerContainer: {
        backgroundColor: '#1F2937',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        textAlign: 'center',
    },
    socialContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 25,
    },
    linksSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    linksColumn: {
        flex: 1,
        paddingHorizontal: 10,
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 12,
    },
    linkButton: {
        paddingVertical: 8,
    },
    linkText: {
        fontSize: 14,
        color: '#D1D5DB',
        lineHeight: 20,
    },
    bottomSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        letterSpacing: 1,
        marginBottom: 5,
    },
    tagline: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    copyrightContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    copyrightText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 5,
    },
    versionText: {
        fontSize: 10,
        color: '#4B5563',
    },
});

