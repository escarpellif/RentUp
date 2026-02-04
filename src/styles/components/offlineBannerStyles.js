import { StyleSheet } from 'react-native';

export const offlineBannerStyles = StyleSheet.create({
container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#EF4444',
        paddingTop: 40, // Para status bar
        paddingBottom: 10,
        paddingHorizontal: 16,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    textContainer: {
        flexDirection: 'column',
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
    },
});
