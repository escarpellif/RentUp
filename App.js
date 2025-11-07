import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase'; // Ajuste o caminho conforme sua estrutura

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen'; // Nova tela Home
import MainMarketplace from './src/screens/MainMarketplace'; // Tela que acabamos de criar
import AddItemScreen from './src/screens/AddItemScreen'; // Tela de cadastro de item
import EditItemScreen from './src/screens/EditItemScreen'; // Tela de edição de item
import ItemDetailsScreen from './src/screens/ItemDetailsScreen'; // Tela de detalhes do item
import RequestRentalScreen from './src/screens/RequestRentalScreen'; // Tela de solicitação de aluguel
import ProfileScreen from './src/screens/ProfileScreen'; // Tela de perfil do usuário

const Stack = createNativeStackNavigator();

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lógica para checar a sessão (mantida do seu código anterior)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setLoading(false);
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Se estiver logado, exibe o Stack Navigator com as telas do app
    if (session && session.user) {
        return (
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerShown: true,
                        headerTitle: '',
                        headerBackTitleVisible: false,
                        headerTransparent: true,
                        headerStyle: {
                            backgroundColor: 'transparent',
                        },
                        headerTintColor: '#007bff',
                        headerShadowVisible: false,
                    }}
                >
                    <Stack.Screen name="HomeScreen" options={{ headerShown: false }}>
                        {(props) => <HomeScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="Home" options={{ headerShown: false }}>
                        {(props) => <MainMarketplace {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AddItem">
                        {(props) => <AddItemScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="EditItem">
                        {(props) => <EditItemScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="ItemDetails">
                        {(props) => <ItemDetailsScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="RequestRental">
                        {(props) => <RequestRentalScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="Profile">
                        {(props) => <ProfileScreen {...props} session={session} />}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    // Se não estiver logado, exibe apenas a tela de autenticação
    return <AuthScreen />;
}

// Registrar o componente para Expo
AppRegistry.registerComponent('main', () => App);
