// ============================================
// OFFLINE BANNER COMPONENT
// Banner que aparece quando não há conexão de internet
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineBanner = () => {
    const { isConnected } = useNetworkStatus();
    const [slideAnim] = React.useState(new Animated.Value(-50));

    React.useEffect(() => {
        if (!isConnected) {
            // Slide down
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            // Slide up
            Animated.spring(slideAnim, {
                toValue: -50,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        }
    }, [isConnected]);

    if (isConnected) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={styles.content}>
                <Text style={styles.icon}>📡</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Sin Conexión</Text>
                    <Text style={styles.subtitle}>Verifica tu internet</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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

export default OfflineBanner;

