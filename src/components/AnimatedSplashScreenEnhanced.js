import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Easing, Text } from 'react-native';

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
        <View style={styles.container}>
            {/* Círculo externo girando */}
            <Animated.View 
                style={[
                    styles.circleOuter,
                    { transform: [{ rotate }] }
                ]}
            />

            {/* Círculo do meio (opcional) */}
            <View style={styles.circleMiddle} />

            {/* Logo/Ícone fixo com pulse */}
            <Animated.View 
                style={[
                    styles.logoContainer,
                    { transform: [{ scale: scaleValue }] }
                ]}
            >
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Nome do App (opcional) */}
            <Text style={styles.appName}>RentUp</Text>
            <Text style={styles.tagline}>Posee menos, Accede a más</Text>
        </View>
    );
};

const styles = StyleSheet.create({
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

export default AnimatedSplashScreenEnhanced;

