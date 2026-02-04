import { StyleSheet } from 'react-native';

export const animatedSplashStyles = StyleSheet.create({
container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logo: {
        width: 110,
        height: 110,
    },
    appName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
        letterSpacing: 3,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 16,
        color: '#fff',
        marginTop: 10,
        opacity: 0.95,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});
