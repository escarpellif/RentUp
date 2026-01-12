// ============================================
// MY ADS SCREEN
// Tela para mostrar apenas os anúncios do usuário logado
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';
import ItemCard from '../components/ItemCard';
import { myAdsScreenStyles as styles } from '../styles/screens/myAdsScreenStyles';

export default function MyAdsScreen({ navigation, session }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = session.user.id;

  useEffect(() => {
    fetchMyItems();
  }, []);

  // Recarregar quando a tela voltar ao foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyItems();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchMyItems() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching my items:', error);
      Alert.alert(t('common.error'), t('items.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyItems();
  };

  const handleItemPress = (item) => {
    // Passar o objeto item completo, não apenas o id
    navigation.navigate('ItemDetails', { item: item });
  };

  const handleEditItem = (item) => {
    // Passar o objeto item completo, não apenas o id
    navigation.navigate('EditItem', { item: item });
  };

  const handleDeleteItem = async (item) => {
    Alert.alert(
      t('items.deleteConfirm'),
      `${t('items.deleteMessage')} "${item.title}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('items.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              Alert.alert(t('common.success'), t('items.deleteSuccess'));
              fetchMyItems();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert(t('common.error'), t('items.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (item) => {
    const newStatus = !(item.is_active ?? true);
    const statusText = newStatus ? 'activar' : 'pausar';

    Alert.alert(
      newStatus ? 'Activar Anuncio' : 'Pausar Anuncio',
      `¿Deseas ${statusText} "${item.title}"?${!newStatus ? '\n\nEl anuncio aparecerá como NO DISPONIBLE.' : '\n\nEl anuncio volverá a estar DISPONIBLE.'}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('items')
                .update({ is_active: newStatus })
                .eq('id', item.id);

              if (error) throw error;

              Alert.alert(
                t('common.success'),
                newStatus ? 'Anuncio activado correctamente' : 'Anuncio pausado correctamente'
              );
              fetchMyItems();
            } catch (error) {
              console.error('Error toggling item status:', error);
              Alert.alert(t('common.error'), 'No se pudo cambiar el estado del anuncio');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c4455" />
        <Text style={styles.loadingText}>{t('items.loadingAds')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      {/* Header Verde - Mesmo layout do Marketplace */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          {/* Botão Voltar + Título */}
          <View style={styles.leftHeader}>
            <TouchableOpacity
              style={styles.backButtonCircle}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('menu.myAds')}</Text>
          </View>

          {/* ALUKO à Direita */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/app-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>ALUKO</Text>
          </View>
        </View>

        {/* Botão Adicionar Anúncio */}
        <View style={styles.addButtonRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>{t('items.addItem')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>{t('items.noAds')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('items.noAdsSubtitle')}
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('AddItem')}
            >
              <Text style={styles.addFirstButtonText}>{t('items.createFirstAd')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            <Text style={styles.itemCount}>
              {items.length} {items.length === 1 ? t('items.adsCount') : t('items.adsCountPlural')}
            </Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemWrapper}>
                <ItemCard
                  item={item}
                  onPress={() => handleItemPress(item)}
                  fullWidth={true}
                  userId={userId}
                />
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditItem(item)}
                  >
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionText}>{t('items.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.pauseButton]}
                    onPress={() => handleToggleActive(item)}
                  >
                    <Text style={styles.actionIcon}>{(item.is_active ?? true) ? '⏸️' : '▶️'}</Text>
                    <Text style={styles.actionText}>
                      {(item.is_active ?? true) ? 'Pausar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteItem(item)}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={styles.actionText}>{t('items.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


