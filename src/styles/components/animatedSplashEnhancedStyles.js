import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, FontWeights } from '../../constants/theme';

export const animatedSplashEnhancedStyles = StyleSheet.create({
container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    circleOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: '#10B981',
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderTopColor: 'transparent',
        borderRightColor: '#10B98150',
        borderBottomColor: '#10B98150',
        position: 'absolute',
    },
    circleMiddle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#F0FDF4',
        position: 'absolute',
    },
    logoContainer: {
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 45,
        zIndex: 10,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logo: {
        width: 70,
        height: 70,
    },
    appName: {
        position: 'absolute',
        bottom: 180,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c4455',
        letterSpacing: 1,
    },
    tagline: {
        position: 'absolute',
        bottom: 150,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});
