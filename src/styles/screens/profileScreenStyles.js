import { StyleSheet, Platform, StatusBar } from 'react-native';

export const profileScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerContainer: {
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 5,
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    username: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 10,
    },
    memberSince: {
        fontSize: 12,
        color: '#aaa',
    },
    languageSwitcherSection: {
        marginBottom: 20,
    },
    languageSwitcherContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        elevation: 2,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2c4455',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 15,
        gap: 8,
    },
    editProfileIcon: {
        fontSize: 16,
    },
    editProfileText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
    },
    ratingsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ratingSection: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        elevation: 1,
    },
    roleTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
        color: '#555',
    },
    ratingBox: {
        alignItems: 'center',
    },
    ratingValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c4455',
        marginBottom: 5,
    },
    ratingLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
});

