import { StyleSheet } from 'react-native';

export const photoCarouselStyles = StyleSheet.create({
container: {
        width: '100%',
        height: 300,
        backgroundColor: '#000',
    },
    scrollView: {
        width: '100%',
        height: 300,
    },
    imageContainer: {
        width: width,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 24,
    },
    counterContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    counterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
