import React, { useState, useEffect } from 'react';
import {View,
    Text,
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
import { adminUsersStyles } from '../styles/screens/adminUsersStyles';

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
            <View style={adminUsersStyles.userCard}>
                {/* Header */}
                <View style={adminUsersStyles.userHeader}>
                    <View style={adminUsersStyles.userHeaderLeft}>
                        <Text style={adminUsersStyles.userName}>{item.full_name || 'Sin nombre'}</Text>
                        <Text style={adminUsersStyles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={adminUsersStyles.badges}>
                        {item.is_admin && (
                            <View style={[adminUsersStyles.badge, { backgroundColor: '#8B5CF6' }]}>
                                <Text style={adminUsersStyles.badgeText}>Admin</Text>
                            </View>
                        )}
                        {item.problematic_user && (
                            <View style={[adminUsersStyles.badge, { backgroundColor: '#EF4444' }]}>
                                <Text style={adminUsersStyles.badgeText}>⚠️</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info Grid */}
                <View style={adminUsersStyles.infoGrid}>
                    <View style={adminUsersStyles.infoItem}>
                        <Ionicons name="checkmark-circle" size={16} color={verificationColors[verificationStatus]} />
                        <Text style={[adminUsersStyles.infoText, { color: verificationColors[verificationStatus] }]}>
                            {verificationLabels[verificationStatus]}
                        </Text>
                    </View>
                    <View style={adminUsersStyles.infoItem}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={adminUsersStyles.infoText}>{item.city || 'Sin ubicación'}</Text>
                    </View>
                </View>

                <View style={adminUsersStyles.infoGrid}>
                    <View style={adminUsersStyles.infoItem}>
                        <Ionicons name="calendar" size={16} color="#6B7280" />
                        <Text style={adminUsersStyles.infoText}>
                            {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </Text>
                    </View>
                    <View style={adminUsersStyles.infoItem}>
                        <Ionicons name="alert-circle" size={16} color="#6B7280" />
                        <Text style={adminUsersStyles.infoText}>
                            {item.dispute_count || 0} disputas
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={adminUsersStyles.actions}>
                    <TouchableOpacity
                        style={[adminUsersStyles.actionButton, item.is_admin && adminUsersStyles.actionButtonActive]}
                        onPress={() => toggleAdmin(item.id, item.is_admin)}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color={item.is_admin ? '#fff' : '#8B5CF6'}
                        />
                        <Text style={[adminUsersStyles.actionButtonText, item.is_admin && adminUsersStyles.actionButtonTextActive]}>
                            {item.is_admin ? 'Remover Admin' : 'Hacer Admin'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[adminUsersStyles.actionButton, item.problematic_user && adminUsersStyles.actionButtonDanger]}
                        onPress={() => toggleProblematicUser(item.id, item.problematic_user)}
                    >
                        <Ionicons
                            name="warning"
                            size={18}
                            color={item.problematic_user ? '#fff' : '#EF4444'}
                        />
                        <Text style={[adminUsersStyles.actionButtonText, item.problematic_user && adminUsersStyles.actionButtonTextActive]}>
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
        <SafeAreaView style={adminUsersStyles.container}>
            {/* Header */}
            <View style={adminUsersStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={adminUsersStyles.headerTitle}>Gestión de Usuarios</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={adminUsersStyles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={adminUsersStyles.searchInput}
                    placeholder="Buscar por nombre, email o ciudad..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={adminUsersStyles.filtersContainer}
                contentContainerStyle={adminUsersStyles.filtersContent}
            >
                <TouchableOpacity
                    style={[adminUsersStyles.filterButton, filter === 'all' && adminUsersStyles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[adminUsersStyles.filterText, filter === 'all' && adminUsersStyles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminUsersStyles.filterButton, filter === 'admins' && adminUsersStyles.filterButtonActive]}
                    onPress={() => setFilter('admins')}
                >
                    <Text style={[adminUsersStyles.filterText, filter === 'admins' && adminUsersStyles.filterTextActive]}>
                        Admins
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminUsersStyles.filterButton, filter === 'verified' && adminUsersStyles.filterButtonActive]}
                    onPress={() => setFilter('verified')}
                >
                    <Text style={[adminUsersStyles.filterText, filter === 'verified' && adminUsersStyles.filterTextActive]}>
                        Verificados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminUsersStyles.filterButton, filter === 'pending' && adminUsersStyles.filterButtonActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[adminUsersStyles.filterText, filter === 'pending' && adminUsersStyles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[adminUsersStyles.filterButton, filter === 'problematic' && adminUsersStyles.filterButtonActive]}
                    onPress={() => setFilter('problematic')}
                >
                    <Text style={[adminUsersStyles.filterText, filter === 'problematic' && adminUsersStyles.filterTextActive]}>
                        Problemáticos
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Stats Summary */}
            <View style={adminUsersStyles.statsContainer}>
                <View style={adminUsersStyles.statItem}>
                    <Text style={adminUsersStyles.statValue}>{filteredUsers.length}</Text>
                    <Text style={adminUsersStyles.statLabel}>Total</Text>
                </View>
                <View style={adminUsersStyles.statItem}>
                    <Text style={adminUsersStyles.statValue}>
                        {filteredUsers.filter(u => u.is_admin).length}
                    </Text>
                    <Text style={adminUsersStyles.statLabel}>Admins</Text>
                </View>
                <View style={adminUsersStyles.statItem}>
                    <Text style={adminUsersStyles.statValue}>
                        {filteredUsers.filter(u => u.verification_status === 'approved').length}
                    </Text>
                    <Text style={adminUsersStyles.statLabel}>Verificados</Text>
                </View>
                <View style={adminUsersStyles.statItem}>
                    <Text style={adminUsersStyles.statValue}>
                        {filteredUsers.filter(u => u.problematic_user).length}
                    </Text>
                    <Text style={adminUsersStyles.statLabel}>Problemáticos</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                contentContainerStyle={adminUsersStyles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadUsers} />
                }
                ListEmptyComponent={
                    <View style={adminUsersStyles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                        <Text style={adminUsersStyles.emptyText}>No hay usuarios</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}



