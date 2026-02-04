import React, { useState, useEffect } from 'react';
import {View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../utils/errorHandler';
import { fetchWithRetry, withTimeout } from '../utils/apiHelpers';
import { adminDashboardStyles } from '../styles/screens/adminDashboardStyles';

export default function AdminDashboardScreen({ navigation, session }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalItems: 0,
        activeRentals: 0,
        pendingRentals: 0,
        completedRentals: 0,
        openDisputes: 0,
        pendingVerifications: 0,
        totalRevenue: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Usar fetchWithRetry para todas as queries
            const result = await fetchWithRetry(async () => {
                // Total de usuários
                const usersQuery = supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });
                const usersResult = await withTimeout(usersQuery, 10000);

                // Total de itens
                const itemsQuery = supabase
                    .from('items')
                    .select('*', { count: 'exact', head: true });
                const itemsResult = await withTimeout(itemsQuery, 10000);

                // Locações ativas
                const activeQuery = supabase
                    .from('rentals')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');
                const activeResult = await withTimeout(activeQuery, 10000);

                // Locações pendentes
                const pendingQuery = supabase
                    .from('rentals')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                const pendingResult = await withTimeout(pendingQuery, 10000);

                // Locações completadas
                const completedQuery = supabase
                    .from('rentals')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed');
                const completedResult = await withTimeout(completedQuery, 10000);

                // Disputas abertas
                const disputesQuery = supabase
                    .from('rental_disputes')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open');
                const disputesResult = await withTimeout(disputesQuery, 10000);

                // Verificações pendentes
                const verificationsQuery = supabase
                    .from('user_verifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('verification_status', 'pending');
                const verificationsResult = await withTimeout(verificationsQuery, 10000);

                // Receita total
                const revenueQuery = supabase
                    .from('rentals')
                    .select('service_fee')
                    .eq('status', 'completed');
                const revenueResult = await withTimeout(revenueQuery, 10000);

                const totalRevenue = revenueResult.data?.reduce((sum, r) => sum + (r.service_fee || 0), 0) || 0;

                return {
                    totalUsers: usersResult.count || 0,
                    totalItems: itemsResult.count || 0,
                    activeRentals: activeResult.count || 0,
                    pendingRentals: pendingResult.count || 0,
                    completedRentals: completedResult.count || 0,
                    openDisputes: disputesResult.count || 0,
                    pendingVerifications: verificationsResult.count || 0,
                    totalRevenue: totalRevenue,
                };
            }, 2);

            setStats(result);

        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            handleApiError(error, () => loadDashboardData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const StatCard = ({ icon, title, value, color, onPress }) => (
        <TouchableOpacity
            style={[adminDashboardStyles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
        >
            <View style={adminDashboardStyles.statIconContainer}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={adminDashboardStyles.statContent}>
                <Text style={adminDashboardStyles.statValue}>{value}</Text>
                <Text style={adminDashboardStyles.statTitle}>{title}</Text>
            </View>
        </TouchableOpacity>
    );

    const QuickAction = ({ icon, title, color, onPress }) => (
        <TouchableOpacity style={adminDashboardStyles.actionButton} onPress={onPress}>
            <View style={[adminDashboardStyles.actionIconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={adminDashboardStyles.actionTitle}>{title}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={adminDashboardStyles.container}>
                <View style={adminDashboardStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={adminDashboardStyles.loadingText}>Cargando datos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={adminDashboardStyles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={adminDashboardStyles.header}>
                    <TouchableOpacity
                        style={adminDashboardStyles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={adminDashboardStyles.headerCenter}>
                        <Text style={adminDashboardStyles.headerTitle}>Panel de Admin</Text>
                        <Text style={adminDashboardStyles.headerSubtitle}>ALUKO Dashboard</Text>
                    </View>
                    <TouchableOpacity
                        style={adminDashboardStyles.notificationButton}
                        onPress={() => navigation.navigate('AdminNotifications')}
                    >
                        <Ionicons name="notifications" size={24} color="#3B82F6" />
                        {stats.pendingVerifications + stats.openDisputes > 0 && (
                            <View style={adminDashboardStyles.notificationBadge}>
                                <Text style={adminDashboardStyles.notificationBadgeText}>
                                    {stats.pendingVerifications + stats.openDisputes}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Estatísticas Principais */}
                <View style={adminDashboardStyles.section}>
                    <Text style={adminDashboardStyles.sectionTitle}>📊 Estadísticas Generales</Text>

                    <View style={adminDashboardStyles.statsGrid}>
                        <StatCard
                            icon="people"
                            title="Total Usuarios"
                            value={stats.totalUsers}
                            color="#3B82F6"
                            onPress={() => navigation.navigate('AdminUsers')}
                        />
                        <StatCard
                            icon="grid"
                            title="Total Artículos"
                            value={stats.totalItems}
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('AdminItems')}
                        />
                        <StatCard
                            icon="time"
                            title="Locaciones Activas"
                            value={stats.activeRentals}
                            color="#10B981"
                            onPress={() => navigation.navigate('AdminRentals', { filter: 'active' })}
                        />
                        <StatCard
                            icon="hourglass"
                            title="Pendientes Aprobación"
                            value={stats.pendingRentals}
                            color="#F59E0B"
                            onPress={() => navigation.navigate('AdminRentals', { filter: 'pending' })}
                        />
                        <StatCard
                            icon="checkmark-circle"
                            title="Completadas"
                            value={stats.completedRentals}
                            color="#06B6D4"
                            onPress={() => navigation.navigate('AdminRentals', { filter: 'completed' })}
                        />
                        <StatCard
                            icon="alert-circle"
                            title="Disputas Abiertas"
                            value={stats.openDisputes}
                            color="#EF4444"
                            onPress={() => navigation.navigate('AdminDisputes')}
                        />
                        <StatCard
                            icon="shield-checkmark"
                            title="Verificaciones Pendientes"
                            value={stats.pendingVerifications}
                            color="#F97316"
                            onPress={() => navigation.navigate('VerificationApprovalScreen')}
                        />
                        <StatCard
                            icon="cash"
                            title="Receita Total"
                            value={`€${stats.totalRevenue.toFixed(2)}`}
                            color="#14B8A6"
                        />
                    </View>
                </View>

                {/* Ações Rápidas */}
                <View style={adminDashboardStyles.section}>
                    <Text style={adminDashboardStyles.sectionTitle}>⚡ Acciones Rápidas</Text>

                    <View style={adminDashboardStyles.actionsGrid}>
                        <QuickAction
                            icon="shield-checkmark"
                            title="Aprobar Verificaciones"
                            color="#F97316"
                            onPress={() => navigation.navigate('VerificationApprovalScreen')}
                        />
                        <QuickAction
                            icon="alert-circle"
                            title="Gestionar Disputas"
                            color="#EF4444"
                            onPress={() => navigation.navigate('AdminDisputes')}
                        />
                        <QuickAction
                            icon="people"
                            title="Gestionar Usuarios"
                            color="#3B82F6"
                            onPress={() => navigation.navigate('AdminUsers')}
                        />
                        <QuickAction
                            icon="bar-chart"
                            title="Ver Reportes"
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('AdminReports')}
                        />
                        <QuickAction
                            icon="settings"
                            title="Configuración"
                            color="#6B7280"
                            onPress={() => navigation.navigate('AdminSettings')}
                        />
                        <QuickAction
                            icon="megaphone"
                            title="Enviar Notificación"
                            color="#14B8A6"
                            onPress={() => navigation.navigate('AdminBroadcast')}
                        />
                    </View>
                </View>

                {/* Informações do Sistema */}
                <View style={adminDashboardStyles.section}>
                    <Text style={adminDashboardStyles.sectionTitle}>ℹ️ Información del Sistema</Text>
                    <View style={adminDashboardStyles.infoCard}>
                        <View style={adminDashboardStyles.infoRow}>
                            <Text style={adminDashboardStyles.infoLabel}>Versión:</Text>
                            <Text style={adminDashboardStyles.infoValue}>1.1.0</Text>
                        </View>
                        <View style={adminDashboardStyles.infoRow}>
                            <Text style={adminDashboardStyles.infoLabel}>Última actualización:</Text>
                            <Text style={adminDashboardStyles.infoValue}>14/01/2026</Text>
                        </View>
                        <View style={adminDashboardStyles.infoRow}>
                            <Text style={adminDashboardStyles.infoLabel}>Estado:</Text>
                            <View style={adminDashboardStyles.statusBadge}>
                                <View style={adminDashboardStyles.statusDot} />
                                <Text style={adminDashboardStyles.statusText}>Operacional</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}



