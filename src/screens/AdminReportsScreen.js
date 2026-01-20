import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminReportsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        // Usuarios
        totalUsers: 0,
        newUsersThisMonth: 0,
        verifiedUsers: 0,
        problematicUsers: 0,

        // Artículos
        totalItems: 0,
        activeItems: 0,
        pausedItems: 0,

        // Locaciones
        totalRentals: 0,
        activeRentals: 0,
        completedRentals: 0,
        cancelledRentals: 0,

        // Financeiro
        totalRevenue: 0,
        revenueThisMonth: 0,
        averageRentalValue: 0,

        // Disputas
        totalDisputes: 0,
        openDisputes: 0,
        resolvedDisputes: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);

            // Usuarios
            const { data: users } = await supabase.from('profiles').select('*');
            const { data: newUsers } = await supabase
                .from('profiles')
                .select('*')
                .gte('created_at', new Date(new Date().setDate(1)).toISOString());

            // Artículos
            const { data: items } = await supabase.from('items').select('*');

            // Locaciones
            const { data: rentals } = await supabase.from('rentals').select('*');

            // Disputas
            const { data: disputes } = await supabase.from('rental_disputes').select('*');

            // Calcular revenue
            const totalRevenue = rentals?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
            const revenueThisMonth = rentals?.filter(r =>
                new Date(r.created_at) >= new Date(new Date().setDate(1))
            ).reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

            setStats({
                totalUsers: users?.length || 0,
                newUsersThisMonth: newUsers?.length || 0,
                verifiedUsers: users?.filter(u => u.verification_status === 'approved').length || 0,
                problematicUsers: users?.filter(u => u.problematic_user).length || 0,

                totalItems: items?.length || 0,
                activeItems: items?.filter(i => i.is_active && !i.is_paused).length || 0,
                pausedItems: items?.filter(i => i.is_paused).length || 0,

                totalRentals: rentals?.length || 0,
                activeRentals: rentals?.filter(r => r.status === 'active').length || 0,
                completedRentals: rentals?.filter(r => r.status === 'completed').length || 0,
                cancelledRentals: rentals?.filter(r => r.status === 'cancelled').length || 0,

                totalRevenue: totalRevenue,
                revenueThisMonth: revenueThisMonth,
                averageRentalValue: rentals?.length ? totalRevenue / rentals.length : 0,

                totalDisputes: disputes?.length || 0,
                openDisputes: disputes?.filter(d => d.status === 'open').length || 0,
                resolvedDisputes: disputes?.filter(d => d.status === 'resolved').length || 0,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon, color, onPress }) => (
        <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.statCardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <Text style={styles.statValue}>{value}</Text>
            </View>
            <Text style={styles.statTitle}>{title}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
    );

    const Section = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reportes y Estadísticas</Text>
                <TouchableOpacity onPress={loadStats}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadStats} />
                }
            >
                {/* Resumen Financiero */}
                <Section title="💰 Resumen Financiero">
                    <View style={styles.financialSummary}>
                        <View style={styles.financialCard}>
                            <Text style={styles.financialLabel}>Ingresos Totales</Text>
                            <Text style={styles.financialValue}>€{stats.totalRevenue.toFixed(2)}</Text>
                        </View>
                        <View style={styles.financialCard}>
                            <Text style={styles.financialLabel}>Este Mes</Text>
                            <Text style={[styles.financialValue, { color: '#10B981' }]}>
                                €{stats.revenueThisMonth.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.financialCard}>
                            <Text style={styles.financialLabel}>Valor Promedio</Text>
                            <Text style={styles.financialValue}>€{stats.averageRentalValue.toFixed(2)}</Text>
                        </View>
                    </View>
                </Section>

                {/* Usuarios */}
                <Section title="👥 Usuarios">
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Usuarios"
                            value={stats.totalUsers}
                            icon="people"
                            color="#3B82F6"
                            onPress={() => navigation.navigate('AdminUsers')}
                        />
                        <StatCard
                            title="Nuevos (Este Mes)"
                            value={stats.newUsersThisMonth}
                            icon="person-add"
                            color="#10B981"
                        />
                        <StatCard
                            title="Verificados"
                            value={stats.verifiedUsers}
                            subtitle={`${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(0)}% del total`}
                            icon="checkmark-circle"
                            color="#06B6D4"
                        />
                        <StatCard
                            title="Problemáticos"
                            value={stats.problematicUsers}
                            icon="warning"
                            color="#EF4444"
                            onPress={() => navigation.navigate('AdminUsers', { filter: 'problematic' })}
                        />
                    </View>
                </Section>

                {/* Artículos */}
                <Section title="📦 Artículos">
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Artículos"
                            value={stats.totalItems}
                            icon="cube"
                            color="#8B5CF6"
                            onPress={() => navigation.navigate('AdminItems')}
                        />
                        <StatCard
                            title="Activos"
                            value={stats.activeItems}
                            subtitle={`${((stats.activeItems / stats.totalItems) * 100).toFixed(0)}% del total`}
                            icon="checkmark-circle"
                            color="#10B981"
                        />
                        <StatCard
                            title="Pausados"
                            value={stats.pausedItems}
                            icon="pause-circle"
                            color="#F59E0B"
                        />
                        <StatCard
                            title="Promedio por Usuario"
                            value={(stats.totalItems / stats.totalUsers).toFixed(1)}
                            icon="stats-chart"
                            color="#06B6D4"
                        />
                    </View>
                </Section>

                {/* Locaciones */}
                <Section title="🔄 Locaciones">
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Locaciones"
                            value={stats.totalRentals}
                            icon="repeat"
                            color="#3B82F6"
                            onPress={() => navigation.navigate('AdminRentals')}
                        />
                        <StatCard
                            title="Activas"
                            value={stats.activeRentals}
                            icon="time"
                            color="#10B981"
                            onPress={() => navigation.navigate('AdminRentals', { filter: 'active' })}
                        />
                        <StatCard
                            title="Completadas"
                            value={stats.completedRentals}
                            subtitle={`${((stats.completedRentals / stats.totalRentals) * 100).toFixed(0)}% del total`}
                            icon="checkmark-done"
                            color="#06B6D4"
                        />
                        <StatCard
                            title="Canceladas"
                            value={stats.cancelledRentals}
                            icon="close-circle"
                            color="#EF4444"
                        />
                    </View>
                </Section>

                {/* Disputas */}
                <Section title="⚠️ Disputas">
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Disputas"
                            value={stats.totalDisputes}
                            icon="alert-circle"
                            color="#F59E0B"
                            onPress={() => navigation.navigate('AdminDisputes')}
                        />
                        <StatCard
                            title="Abiertas"
                            value={stats.openDisputes}
                            icon="flag"
                            color="#EF4444"
                            onPress={() => navigation.navigate('AdminDisputes', { filter: 'open' })}
                        />
                        <StatCard
                            title="Resueltas"
                            value={stats.resolvedDisputes}
                            subtitle={`${((stats.resolvedDisputes / stats.totalDisputes) * 100).toFixed(0)}% del total`}
                            icon="checkmark-circle"
                            color="#10B981"
                        />
                        <StatCard
                            title="Tasa de Éxito"
                            value={`${stats.totalDisputes ? ((stats.resolvedDisputes / stats.totalDisputes) * 100).toFixed(0) : 0}%`}
                            icon="trophy"
                            color="#8B5CF6"
                        />
                    </View>
                </Section>

                {/* KPIs */}
                <Section title="📊 Indicadores Clave">
                    <View style={styles.kpiContainer}>
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Tasa de Conversión</Text>
                            <Text style={styles.kpiValue}>
                                {((stats.completedRentals / stats.totalUsers) * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.kpiDescription}>Locaciones por usuario</Text>
                        </View>

                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Tasa de Activación</Text>
                            <Text style={styles.kpiValue}>
                                {((stats.activeItems / stats.totalItems) * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.kpiDescription}>Artículos activos</Text>
                        </View>

                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Tasa de Disputa</Text>
                            <Text style={styles.kpiValue}>
                                {((stats.totalDisputes / stats.totalRentals) * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.kpiDescription}>Disputas por locación</Text>
                        </View>
                    </View>
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
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
    financialSummary: {
        flexDirection: 'row',
        gap: 12,
    },
    financialCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        textAlign: 'center',
    },
    financialValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    kpiContainer: {
        gap: 12,
    },
    kpiCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    kpiLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 4,
    },
    kpiDescription: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});

