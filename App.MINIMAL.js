import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase';

console.log('🚀 [APP] Versão ULTRA simplificada - Apenas Login e Home');

// Importar APENAS Splash, Auth e Home
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);

    useEffect(() => {
        const splashTimer = setTimeout(() => {
            setMinSplashTimeElapsed(true);
        }, 2000);
        return () => clearTimeout(splashTimer);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('[Auth] Erro:', error);
                    setSession(null);
                } else {
                    setSession(session);
                }
                setLoading(false);
            } catch (error) {
                console.error('[Auth] Erro crítico:', error);
                setSession(null);
                setLoading(false);
            }
        };

        initAuth();

        try {
            const { data: authListener } = supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                    setLoading(false);
                    if (!session) {
                        setIsGuest(false);
                    }
                }
            );

            return () => {
                try {
                    authListener.subscription.unsubscribe();
                } catch (error) {
                    console.error('[Auth] Erro ao desinscrever:', error);
                }
            };
        } catch (error) {
            console.error('[Auth] Erro ao configurar listener:', error);
        }
    }, []);

    const handleGuestLogin = () => {
        setIsGuest(true);
        setLoading(false);
    };

    if (loading || !minSplashTimeElapsed) {
        return <AnimatedSplashScreen />;
    }

    // Se logado ou visitante: APENAS HomeScreen
    if ((session?.user) || isGuest) {
        return (
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="HomeScreen">
                        {(props) => <HomeScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    // Se não logado: APENAS AuthScreen
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
}
