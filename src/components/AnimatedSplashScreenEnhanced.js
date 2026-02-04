import React, { useEffect, useRef } from 'react';
import {View, Animated, Image, Easing, Text } from 'react-native';
import { animatedSplashEnhancedStyles } from '../styles/components/animatedSplashEnhancedStyles';

const AnimatedSplashScreenEnhanced = () => {
    const rotateValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Animação de rotação contínua do círculo
        Animated.loop(
            Animated.timing(rotateValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Animação de pulse sutil no logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [rotateValue, scaleValue]);

    const rotate = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={animatedSplashEnhancedStyles.container}>
            {/* Círculo externo girando */}
            <Animated.View 
                style={[
                    animatedSplashEnhancedStyles.circleOuter,
                    { transform: [{ rotate }] }
                ]}
            />

            {/* Círculo do meio (opcional) */}
            <View style={animatedSplashEnhancedStyles.circleMiddle} />

            {/* Logo/Ícone fixo com pulse */}
            <Animated.View 
                style={[
                    animatedSplashEnhancedStyles.logoContainer,
                    { transform: [{ scale: scaleValue }] }
                ]}
            >
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={animatedSplashEnhancedStyles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Nome do App (opcional) */}
            <Text style={animatedSplashEnhancedStyles.appName}>ALUKO</Text>
            <Text style={animatedSplashEnhancedStyles.tagline}>Posee menos, Accede a más</Text>
        </View>
    );
};



export default AnimatedSplashScreenEnhanced;

