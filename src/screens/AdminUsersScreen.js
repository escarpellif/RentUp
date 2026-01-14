import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

export default function AdminUsersScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadUsers();
    }, [filter]);

    const loadUsers = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter === 'admins') {
                query = query.eq('is_admin', true);
            } else if (filter === 'verified') {
                query = query.eq('verification_status', 'approved');
            } else if (filter === 'pending') {
                query = query.eq('verification_status', 'pending');
            } else if (filter === 'problematic') {
                query = query.eq('problematic_user', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            Alert.alert('Error', 'No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    };

    const toggleAdmin = async (userId, isCurrentlyAdmin) => {
        Alert.alert(
            isCurrentlyAdmin ? 'Remover Admin' : 'Hacer Admin',
            `¿Estás seguro que deseas ${isCurrentlyAdmin ? 'remover privilegios de admin' : 'hacer admin'} a este usuario?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ is_admin: !isCurrentlyAdmin })
                                .eq('id', userId);

                            if (error) throw error;

                            Alert.alert('Éxito', 'Privilegios actualizados');
                            loadUsers();
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('Error', 'No se pudo actualizar');
                        }
                    },
                },
            ]
        );
    };

    const toggleProblematicUser = async (userId, isCurrentlyProblematic) => {
        Alert.alert(
            isCurrentlyProblematic ? 'Desmarcar Problemático' : 'Marcar Problemático',
            `¿Estás seguro?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ problematic_user: !isCurrentlyProblematic })
                                .eq('id', userId);

                            if (error) throw error;

                            Alert.alert('Éxito', 'Usuario actualizado');
                            loadUsers();
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('Error', 'No se pudo actualizar');
                        }
                    },
                },
            ]
        );
    };

    const renderUser = ({ item }) => {
        const verificationColors = {
            approved: '#10B981',
            pending: '#F59E0B',
            rejected: '#EF4444',
            null: '#9CA3AF',
        };

        const verificationLabels = {
            approved: 'Verificado',
            pending: 'Pendiente',
            rejected: 'Rechazado',
            null: 'Sin verificar',
        };

        const verificationStatus = item.verification_status || null;

        return (
            <View style={styles.userCard}>
                {/* Header */}
                <View style={styles.userHeader}>
                    <View style={styles.userHeaderLeft}>
                        <Text style={styles.userName}>{item.full_name || 'Sin nombre'}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={styles.badges}>
                        {item.is_admin && (
                            <View style={[styles.badge, { backgroundColor: '#8B5CF6' }]}>
                                <Text style={styles.badgeText}>Admin</Text>
                            </View>
                        )}
                        {item.problematic_user && (
                            <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                                <Text style={styles.badgeText}>⚠️</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Ionicons name="checkmark-circle" size={16} color={verificationColors[verificationStatus]} />
                        <Text style={[styles.infoText, { color: verificationColors[verificationStatus] }]}>
                            {verificationLabels[verificationStatus]}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>{item.city || 'Sin ubicación'}</Text>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="alert-circle" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>
                            {item.dispute_count || 0} disputas
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, item.is_admin && styles.actionButtonActive]}
                        onPress={() => toggleAdmin(item.id, item.is_admin)}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color={item.is_admin ? '#fff' : '#8B5CF6'}
                        />
                        <Text style={[styles.actionButtonText, item.is_admin && styles.actionButtonTextActive]}>
                            {item.is_admin ? 'Remover Admin' : 'Hacer Admin'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, item.problematic_user && styles.actionButtonDanger]}
                        onPress={() => toggleProblematicUser(item.id, item.problematic_user)}
                    >
                        <Ionicons
                            name="warning"
                            size={18}
                            color={item.problematic_user ? '#fff' : '#EF4444'}
                        />
                        <Text style={[styles.actionButtonText, item.problematic_user && styles.actionButtonTextActive]}>
                            {item.problematic_user ? 'OK' : 'Problemático'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.city?.toLowerCase().includes(query)
        );
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, email o ciudad..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'admins' && styles.filterButtonActive]}
                    onPress={() => setFilter('admins')}
                >
                    <Text style={[styles.filterText, filter === 'admins' && styles.filterTextActive]}>
                        Admins
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'verified' && styles.filterButtonActive]}
                    onPress={() => setFilter('verified')}
                >
                    <Text style={[styles.filterText, filter === 'verified' && styles.filterTextActive]}>
                        Verificados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'problematic' && styles.filterButtonActive]}
                    onPress={() => setFilter('problematic')}
                >
                    <Text style={[styles.filterText, filter === 'problematic' && styles.filterTextActive]}>
                        Problemáticos
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{filteredUsers.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredUsers.filter(u => u.is_admin).length}
                    </Text>
                    <Text style={styles.statLabel}>Admins</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredUsers.filter(u => u.verification_status === 'approved').length}
                    </Text>
                    <Text style={styles.statLabel}>Verificados</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {filteredUsers.filter(u => u.problematic_user).length}
                    </Text>
                    <Text style={styles.statLabel}>Problemáticos</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadUsers} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No hay usuarios</Text>
                    </View>
                }
            />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    filtersContainer: {
        maxHeight: 50,
        marginBottom: 16,
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    list: {
        padding: 16,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userHeaderLeft: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    infoText: {
        fontSize: 13,
        color: '#6B7280',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8B5CF6',
        backgroundColor: '#fff',
    },
    actionButtonActive: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    actionButtonDanger: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    actionButtonTextActive: {
        color: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
});

