import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase';

// Importar i18n
import './src/i18n';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MainMarketplace from './src/screens/MainMarketplace';
import TipsBeforeAddingScreen from './src/screens/TipsBeforeAddingScreen';
import AddItemFormScreen from './src/screens/AddItemFormScreen';
import EditItemScreen from './src/screens/EditItemScreen';
import ItemDetailsScreen from './src/screens/ItemDetailsScreen';
import RequestRentalScreen from './src/screens/RequestRentalScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import DocumentVerificationScreen from './src/screens/DocumentVerificationScreen';
import AdminVerificationsScreen from './src/screens/AdminVerificationsScreen';
import MyAdsScreen from './src/screens/MyAdsScreen';

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
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="HomeScreen">
                        {(props) => <HomeScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="Home">
                        {(props) => <MainMarketplace {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AddItem">
                        {(props) => <TipsBeforeAddingScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AddItemForm">
                        {(props) => <AddItemFormScreen {...props} session={session} />}
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

                    <Stack.Screen name="MyAds">
                        {(props) => <MyAdsScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="EditProfile">
                        {(props) => <EditProfileScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="DocumentVerification">
                        {(props) => <DocumentVerificationScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminVerifications">
                        {(props) => <AdminVerificationsScreen {...props} session={session} />}
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

