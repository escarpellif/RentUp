import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Easing } from 'react-native';

const AnimatedSplashScreen = () => {
    const rotateValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animação de rotação contínua
        Animated.loop(
            Animated.timing(rotateValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [rotateValue]);

    const rotate = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Círculo girando */}
            <Animated.View 
                style={[
                    styles.circle,
                    { transform: [{ rotate }] }
                ]}
            >
                <View style={styles.circleInner} />
            </Animated.View>

            {/* Logo/Ícone fixo no centro */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/app-icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
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
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#10B981',
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderTopColor: 'transparent',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 40,
        zIndex: 10,
    },
    logo: {
        width: 60,
        height: 60,
    },
});

export default AnimatedSplashScreen;

