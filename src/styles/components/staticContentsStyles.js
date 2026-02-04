import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, FontWeights } from '../../constants/theme';

export const staticContentsStyles = StyleSheet.create({
headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#10B981',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        letterSpacing: 1,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2c4455',
    },
});
