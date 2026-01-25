// ============================================
// FEATURE FLAGS HOOK
// Sistema de controle remoto de features
// Kill switch para produção
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

// Cache global de feature flags
const featureFlagsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const subscribers = new Map();

/**
 * Hook para verificar se uma feature está habilitada
 *
 * @param {string} flagName - Nome da feature flag
 * @param {boolean} defaultValue - Valor padrão se flag não existir
 * @returns {Object} { enabled: boolean, loading: boolean, refresh: function }
 *
 * @example
 * const { enabled, loading } = useFeatureFlag('new_payment_system', false);
 *
 * if (loading) return <Loading />;
 * if (!enabled) return <OldPaymentUI />;
 * return <NewPaymentUI />;
 */
export const useFeatureFlag = (flagName, defaultValue = false) => {
    const [enabled, setEnabled] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    const checkFlag = useCallback(async (forceRefresh = false) => {
        try {
            // Verificar cache
            if (!forceRefresh) {
                const cached = featureFlagsCache.get(flagName);
                if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                    setEnabled(cached.value);
                    setLoading(false);
                    return cached.value;
                }
            }

            // Buscar do banco
            const { data, error } = await supabase
                .from('feature_flags')
                .select('enabled, rollout_percentage')
                .eq('name', flagName)
                .single();

            if (error || !data) {
                console.warn(`⚠️ Feature flag "${flagName}" não encontrada, usando default: ${defaultValue}`);
                setEnabled(defaultValue);
                setLoading(false);

                // Cache do default
                featureFlagsCache.set(flagName, {
                    value: defaultValue,
                    timestamp: Date.now()
                });

                return defaultValue;
            }

            // Verificar rollout percentage
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const userHash = hashUserId(userId);
            const inRollout = userHash % 100 < data.rollout_percentage;

            const isEnabled = data.enabled && inRollout;

            // Atualizar cache
            featureFlagsCache.set(flagName, {
                value: isEnabled,
                timestamp: Date.now()
            });

            setEnabled(isEnabled);
            setLoading(false);

            console.log(`🚩 Feature flag "${flagName}": ${isEnabled ? 'ON' : 'OFF'} (rollout: ${data.rollout_percentage}%)`);

            // Notificar subscribers
            notifySubscribers(flagName, isEnabled);

            return isEnabled;
        } catch (error) {
            console.error('❌ Erro ao verificar feature flag:', error);
            setEnabled(defaultValue);
            setLoading(false);
            return defaultValue;
        }
    }, [flagName, defaultValue]);

    useEffect(() => {
        checkFlag();

        // Subscrever para atualizações em tempo real
        const subscription = supabase
            .channel(`feature_flags:${flagName}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'feature_flags',
                    filter: `name=eq.${flagName}`
                },
                (payload) => {
                    console.log('🔄 Feature flag atualizada:', payload);
                    checkFlag(true); // Force refresh
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [checkFlag, flagName]);

    return {
        enabled,
        loading,
        refresh: () => checkFlag(true)
    };
};

/**
 * Hook para carregar múltiplas feature flags de uma vez
 *
 * @param {Array<string>} flagNames - Array de nomes de flags
 * @returns {Object} { flags: Map, loading: boolean, refresh: function }
 *
 * @example
 * const { flags, loading } = useFeatureFlags(['chat', 'payment', 'ai']);
 *
 * if (flags.get('chat')) {
 *     return <ChatFeature />;
 * }
 */
export const useFeatureFlags = (flagNames) => {
    const [flags, setFlags] = useState(new Map());
    const [loading, setLoading] = useState(true);

    const loadFlags = useCallback(async (forceRefresh = false) => {
        try {
            const flagsMap = new Map();

            // Carregar todas de uma vez
            const { data, error } = await supabase
                .from('feature_flags')
                .select('name, enabled, rollout_percentage')
                .in('name', flagNames);

            if (error) throw error;

            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;
            const userHash = hashUserId(userId);

            for (const flagName of flagNames) {
                const flagData = data?.find(f => f.name === flagName);

                if (!flagData) {
                    flagsMap.set(flagName, false);
                    continue;
                }

                const inRollout = userHash % 100 < flagData.rollout_percentage;
                const isEnabled = flagData.enabled && inRollout;

                flagsMap.set(flagName, isEnabled);

                // Cache individual
                featureFlagsCache.set(flagName, {
                    value: isEnabled,
                    timestamp: Date.now()
                });
            }

            setFlags(flagsMap);
            setLoading(false);

            console.log('🚩 Feature flags carregadas:', Object.fromEntries(flagsMap));
        } catch (error) {
            console.error('❌ Erro ao carregar feature flags:', error);
            setLoading(false);
        }
    }, [flagNames]);

    useEffect(() => {
        loadFlags();
    }, [loadFlags]);

    return {
        flags,
        loading,
        refresh: () => loadFlags(true)
    };
};

/**
 * Componente de Feature Toggle
 *
 * @example
 * <FeatureToggle flag="new_payment">
 *     <NewPaymentUI />
 * </FeatureToggle>
 */
export const FeatureToggle = ({ flag, children, fallback = null }) => {
    const { enabled, loading } = useFeatureFlag(flag, false);

    if (loading) {
        return fallback;
    }

    return enabled ? children : fallback;
};

/**
 * HOC para proteger componentes com feature flag
 *
 * @example
 * const PaymentScreen = withFeatureFlag('new_payment', OldPaymentScreen)(NewPaymentScreen);
 */
export const withFeatureFlag = (flagName, FallbackComponent = null) => (Component) => {
    return (props) => {
        const { enabled, loading } = useFeatureFlag(flagName, false);

        if (loading) {
            return FallbackComponent ? <FallbackComponent {...props} /> : null;
        }

        if (!enabled) {
            return FallbackComponent ? <FallbackComponent {...props} /> : null;
        }

        return <Component {...props} />;
    };
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Hash simples e consistente de user ID
 * Garante que mesmo usuário sempre cai no mesmo percentual
 */
const hashUserId = (userId) => {
    if (!userId) return 0;

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash);
};

/**
 * Notificar todos os subscribers de uma flag
 */
const notifySubscribers = (flagName, newValue) => {
    const subs = subscribers.get(flagName) || [];
    subs.forEach(callback => callback(newValue));
};

/**
 * Subscrever para mudanças em uma flag
 *
 * @example
 * subscribeToFlag('payment', (enabled) => {
 *     console.log('Payment flag mudou:', enabled);
 * });
 */
export const subscribeToFlag = (flagName, callback) => {
    if (!subscribers.has(flagName)) {
        subscribers.set(flagName, []);
    }
    subscribers.get(flagName).push(callback);

    // Retornar função de unsubscribe
    return () => {
        const subs = subscribers.get(flagName) || [];
        const index = subs.indexOf(callback);
        if (index > -1) {
            subs.splice(index, 1);
        }
    };
};

/**
 * Limpar cache de feature flags
 * (útil após logout ou para forçar refresh)
 */
export const clearFeatureFlagsCache = () => {
    featureFlagsCache.clear();
    console.log('🗑️ Cache de feature flags limpo');
};

/**
 * Pré-carregar feature flags
 * (útil para carregar antes de renderizar)
 */
export const preloadFeatureFlags = async (flagNames) => {
    try {
        const { data } = await supabase
            .from('feature_flags')
            .select('name, enabled, rollout_percentage')
            .in('name', flagNames);

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        const userHash = hashUserId(userId);

        data?.forEach(flag => {
            const inRollout = userHash % 100 < flag.rollout_percentage;
            const isEnabled = flag.enabled && inRollout;

            featureFlagsCache.set(flag.name, {
                value: isEnabled,
                timestamp: Date.now()
            });
        });

        console.log('✅ Feature flags pré-carregadas');
    } catch (error) {
        console.error('❌ Erro ao pré-carregar flags:', error);
    }
};

// ============================================
// ADMIN HELPERS (Apenas para tela de admin)
// ============================================

/**
 * Listar todas as feature flags (admin)
 */
export const getAllFeatureFlags = async () => {
    const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
};

/**
 * Atualizar feature flag (admin)
 */
export const updateFeatureFlag = async (flagName, updates) => {
    const { error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('name', flagName);

    if (error) throw error;

    // Limpar cache
    featureFlagsCache.delete(flagName);

    console.log(`✅ Feature flag "${flagName}" atualizada`);
};

/**
 * Kill switch de emergência (admin)
 */
export const emergencyDisableFeature = async (flagName, reason) => {
    const { error } = await supabase.rpc('emergency_disable_feature', {
        p_flag_name: flagName,
        p_reason: reason
    });

    if (error) throw error;

    // Limpar cache
    featureFlagsCache.delete(flagName);

    console.log(`🚨 Feature "${flagName}" DESABILITADA (emergência)`);
};

/**
 * Obter histórico de mudanças (admin)
 */
export const getFeatureFlagHistory = async (flagName = null, limit = 50) => {
    let query = supabase
        .from('feature_flags_history')
        .select(`
            *,
            profiles:changed_by(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (flagName) {
        query = query.eq('flag_name', flagName);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
};

export default {
    useFeatureFlag,
    useFeatureFlags,
    FeatureToggle,
    withFeatureFlag,
    clearFeatureFlagsCache,
    preloadFeatureFlags,
    getAllFeatureFlags,
    updateFeatureFlag,
    emergencyDisableFeature,
    getFeatureFlagHistory
};

