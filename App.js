import React, { useState, useEffect } from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './supabase';

// Importar i18n
import './src/i18n';

// Importar Splash Screen Animado
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';

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
import UserNotificationsScreen from './src/screens/UserNotificationsScreen';
import ChatsListScreen from './src/screens/ChatsListScreen';
import ChatConversationScreen from './src/screens/ChatConversationScreen';
import MyRentalsScreen from './src/screens/MyRentalsScreen';
import StaticContentScreen from './src/screens/StaticContentScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminDisputesScreen from './src/screens/AdminDisputesScreen';
import DisputeDetailsScreen from './src/screens/DisputeDetailsScreen';
import AdminRentalsScreen from './src/screens/AdminRentalsScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminItemsScreen from './src/screens/AdminItemsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);

    useEffect(() => {
        // Timer mínimo de 3 segundos para o splash screen
        const splashTimer = setTimeout(() => {
            setMinSplashTimeElapsed(true);
        }, 3000); // 3 segundos

        return () => clearTimeout(splashTimer);
    }, []);

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
                // Se fez logout, também desativa modo visitante
                if (!session) {
                    setIsGuest(false);
                }
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    // Função para entrar como visitante
    const handleGuestLogin = () => {
        setIsGuest(true);
        setLoading(false);
    };

    // Mostrar splash enquanto está carregando OU enquanto não passou o tempo mínimo
    if (loading || !minSplashTimeElapsed) {
        return <AnimatedSplashScreen />;
    }

    // Se estiver logado OU em modo visitante, exibe o Stack Navigator com as telas do app
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

                    <Stack.Screen name="Home">
                        {(props) => <MainMarketplace {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="AddItem">
                        {(props) => <TipsBeforeAddingScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="AddItemForm">
                        {(props) => <AddItemFormScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="EditItem">
                        {(props) => <EditItemScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="ItemDetails">
                        {(props) => <ItemDetailsScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="RequestRental">
                        {(props) => <RequestRentalScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="Profile">
                        {(props) => <ProfileScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="MyAds">
                        {(props) => <MyAdsScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="EditProfile">
                        {(props) => <EditProfileScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="DocumentVerification">
                        {(props) => <DocumentVerificationScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminVerifications">
                        {(props) => <AdminVerificationsScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="UserNotifications">
                        {(props) => <UserNotificationsScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="ChatsList">
                        {(props) => <ChatsListScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="ChatConversation">
                        {(props) => <ChatConversationScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="MyRentals">
                        {(props) => <MyRentalsScreen {...props} session={session} isGuest={isGuest} />}
                    </Stack.Screen>

                    <Stack.Screen name="StaticContent">
                        {(props) => <StaticContentScreen {...props} />}
                    </Stack.Screen>

                    {/* Admin Screens */}
                    <Stack.Screen name="AdminDashboard">
                        {(props) => <AdminDashboardScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminDisputes">
                        {(props) => <AdminDisputesScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="DisputeDetails">
                        {(props) => <DisputeDetailsScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminRentals">
                        {(props) => <AdminRentalsScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminUsers">
                        {(props) => <AdminUsersScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="AdminItems">
                        {(props) => <AdminItemsScreen {...props} session={session} />}
                    </Stack.Screen>

                    <Stack.Screen name="VerificationApprovalScreen">
                        {(props) => <AdminVerificationsScreen {...props} session={session} />}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    // Se não estiver logado, exibe apenas a tela de autenticação
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
}

// Registrar o componente para Expo
AppRegistry.registerComponent('main', () => App);
