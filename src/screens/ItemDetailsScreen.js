import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../supabase';
import RentalCalendar from '../components/RentalCalendar';

const SUPABASE_URL = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';

export default function ItemDetailsScreen({ route, navigation }) {
    const { item } = route.params;
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/item_photos/${item.photo_url}`;

    const fetchOwnerProfile = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('username, full_name, rating_avg_locador, rating_count_locador')
            .eq('id', item.owner_id)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil do dono:', error);
        } else {
            setOwnerProfile(data);
        }
        setLoading(false);
    }, [item.owner_id]);

    // Busca reservas existentes para o item (assume tabela `bookings` com cols start_date, end_date, item_id)
    const fetchBookings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('start_date,end_date')
                .eq('item_id', item.id);

            if (error) {
                // Se tabela não existir ou houver erro, logamos e mantemos lista vazia
                console.warn('Não foi possível buscar bookings (pode não existir tabela):', error.message || error);
                setExistingBookings([]);
                return;
            }

            const mapped = (data || []).map(b => {
                // Normaliza para YYYY-MM-DD
                const s = b.start_date ? new Date(b.start_date).toISOString().slice(0, 10) : null;
                const e = b.end_date ? new Date(b.end_date).toISOString().slice(0, 10) : null;
                return { startDate: s, endDate: e };
            });
            setExistingBookings(mapped);
        } catch (err) {
            console.warn('Erro ao buscar bookings:', err.message || err);
            setExistingBookings([]);
        }
    }, [item.id]);

    useEffect(() => {
        fetchOwnerProfile();
        fetchBookings();
    }, [fetchOwnerProfile]);

    const handleContact = () => {
        Alert.alert(
            'Chat Interno',
            `Deseja iniciar uma conversa com ${ownerProfile?.full_name || 'o anunciante'}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Iniciar Chat',
                    onPress: () => {
                        Alert.alert('Em breve!', 'Sistema de chat será implementado.');
                    }
                }
            ]
        );
    };

    const handleRequestRental = () => {
        navigation.navigate('RequestRental', {
            item: item,
            ownerProfile: ownerProfile
        });
    };

    const handleSelectDates = (dates) => {
        // dates: { startDate, endDate, totalDays }
        // Encaminha para a tela de RequestRental com as datas selecionadas
        navigation.navigate('RequestRental', {
            item: item,
            ownerProfile: ownerProfile,
            bookingDates: dates,
        });
    };

    const renderStars = (rating, count) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={styles.starIcon}>⭐</Text>
                ))}
                <Text style={styles.ratingNumber}>
                    {rating > 0 ? parseFloat(rating).toFixed(1) : `(${count || 0} ${count === 1 ? 'avaliação' : 'avaliações'})`}
                </Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Imagem Principal */}
            <Image source={{ uri: imageUrl }} style={styles.mainImage} />

            {/* Informações Principais */}
            <View style={styles.contentContainer}>
                <Text style={styles.title}>{item.title}</Text>
                
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>€{parseFloat(item.price_per_day).toFixed(2)}</Text>
                    <Text style={styles.priceLabel}> / dia</Text>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.location}>📍 {item.location}</Text>
                </View>

                {/* Descrição */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descrição</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>

                {/* Informações do Dono */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Anunciante</Text>
                    {loading ? (
                        <Text>Carregando...</Text>
                    ) : (
                        <View style={styles.ownerCard}>
                            <View style={styles.ownerInfo}>
                                <Text style={styles.ownerName}>
                                    {ownerProfile?.full_name || 'Usuário'}
                                </Text>
                                {renderStars(ownerProfile?.rating_avg_locador || 0, ownerProfile?.rating_count_locador || 0)}
                            </View>
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={handleContact}
                            >
                                <Text style={styles.contactButtonText}>💬 Contato</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Informações Adicionais */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Disponível:</Text>
                        <Text style={styles.infoValue}>
                            {item.is_available ? '✅ Sim' : '❌ Não disponível'}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Anunciado em:</Text>
                        <Text style={styles.infoValue}>
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={handleRequestRental}
                    >
                        <Text style={styles.primaryButtonText}>
                            🔑 Solicitar Aluguel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#007bff', marginTop: 10 }]}
                        onPress={() => setCalendarVisible(true)}
                    >
                        <Text style={styles.primaryButtonText}>📅 Selecionar Datas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleContact}
                    >
                        <Text style={styles.secondaryButtonText}>
                            💬 Falar com Anunciante
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <RentalCalendar
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                existingBookings={existingBookings}
                onSelectDates={handleSelectDates}
            />

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mainImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 15,
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#28a745',
    },
    priceLabel: {
        fontSize: 18,
        color: '#6c757d',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    badge: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    location: {
        fontSize: 14,
        color: '#6c757d',
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#495057',
    },
    ownerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    ownerInfo: {
        flex: 1,
        marginRight: 15,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    contactButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        flexWrap: 'wrap',
    },
    starIcon: {
        fontSize: 16,
        marginRight: 2,
    },
    ratingNumber: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    actionButtons: {
        marginTop: 30,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#007bff',
    },
    secondaryButtonText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '600',
    },
});
