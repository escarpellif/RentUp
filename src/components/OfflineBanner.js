// ============================================
// OFFLINE BANNER COMPONENT
// Banner que aparece quando não há conexão de internet
// ============================================

import React from 'react';
import {View, Text, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineBannerStyles } from '../styles/components/offlineBannerStyles';

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
                offlineBannerStyles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <View style={offlineBannerStyles.content}>
                <Text style={offlineBannerStyles.icon}>📡</Text>
                <View style={offlineBannerStyles.textContainer}>
                    <Text style={offlineBannerStyles.title}>Sin Conexión</Text>
                    <Text style={offlineBannerStyles.subtitle}>Verifica tu internet</Text>
                </View>
            </View>
        </Animated.View>
    );
};



export default OfflineBanner;

