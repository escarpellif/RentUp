import React, { useEffect, useRef } from 'react';
import {View, Animated, Image, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animatedSplashStyles } from '../styles/components/animatedSplashStyles';

const AnimatedSplashScreen = () => {
    const heartbeatValue = useRef(new Animated.Value(1)).current;
    const fadeValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animação de batimento de coração
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartbeatValue, {
                    toValue: 1.1,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(heartbeatValue, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(heartbeatValue, {
                    toValue: 1.1,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(heartbeatValue, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                // Pausa entre batimentos
                Animated.delay(600),
            ])
        ).start();

        // Fade in inicial
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeValue, heartbeatValue]);

    return (
        <LinearGradient
            colors={['#10B981', '#059669']}
            style={animatedSplashStyles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View style={[animatedSplashStyles.contentContainer, { opacity: fadeValue }]}>
                {/* Logo com batimento */}
                <Animated.View style={{ transform: [{ scale: heartbeatValue }] }}>
                    <View style={animatedSplashStyles.logoContainer}>
                        <View style={animatedSplashStyles.logoCircle}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={animatedSplashStyles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Nome do App */}
                <Text style={animatedSplashStyles.appName}>ALUKO</Text>
                <Text style={animatedSplashStyles.tagline}>Posee menos, accede a más.</Text>
            </Animated.View>
        </LinearGradient>
    );
};



export default AnimatedSplashScreen;
