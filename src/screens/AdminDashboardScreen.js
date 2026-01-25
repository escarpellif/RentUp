import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
        >
            <View style={styles.statIconContainer}>
                <Ionicons name={icon} size={32} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </TouchableOpacity>
    );

    const QuickAction = ({ icon, title, color, onPress }) => (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Cargando datos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Panel de Admin</Text>
                        <Text style={styles.headerSubtitle}>ALUKO Dashboard</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('AdminNotifications')}
                    >
                        <Ionicons name="notifications" size={24} color="#3B82F6" />
                        {stats.pendingVerifications + stats.openDisputes > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {stats.pendingVerifications + stats.openDisputes}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Estatísticas Principais */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Estadísticas Generales</Text>

                    <View style={styles.statsGrid}>
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
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>

                    <View style={styles.actionsGrid}>
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
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ Información del Sistema</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Versión:</Text>
                            <Text style={styles.infoValue}>1.1.0</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Última actualización:</Text>
                            <Text style={styles.infoValue}>14/01/2026</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Estado:</Text>
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Operacional</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    notificationBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    statsGrid: {
        gap: 12,
    },
    statCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    statIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statContent: {
        flex: 1,
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    actionIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
});

