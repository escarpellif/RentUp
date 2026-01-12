import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View style={[styles.contentContainer, { opacity: fadeValue }]}>
                {/* Logo com batimento */}
                <Animated.View style={{ transform: [{ scale: heartbeatValue }] }}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Nome do App */}
                <Text style={styles.appName}>ALUKO</Text>
                <Text style={styles.tagline}>Posee menos, accede a más.</Text>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
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

export default AnimatedSplashScreen;
