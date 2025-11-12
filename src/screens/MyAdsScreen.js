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
  RefreshControl
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
    navigation.navigate('ItemDetails', { itemId: item.id });
  };

  const handleEditItem = (item) => {
    navigation.navigate('EditItem', { itemId: item.id });
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
          }
        }
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('menu.myAds')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddItem')}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
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


