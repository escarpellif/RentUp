// ============================================
// EXEMPLO PRÁTICO DE USO DE FEATURE FLAGS
// Mostra como proteger features com kill switch
// ============================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useFeatureFlag, FeatureToggle } from '../hooks/useFeatureFlag';

// ============================================
// EXEMPLO 1: Hook Simples
// ============================================

export function PaymentScreen() {
    const { enabled: newPaymentEnabled, loading } = useFeatureFlag('new_payment_system', false);

    if (loading) {
        return <LoadingScreen />;
    }

    // Se feature habilitada, mostrar novo sistema
    if (newPaymentEnabled) {
        return <NewPaymentUI />;
    }

    // Caso contrário, mostrar sistema antigo (fallback seguro)
    return <OldPaymentUI />;
}

// ============================================
// EXEMPLO 2: Componente FeatureToggle
// ============================================

export function ChatScreen() {
    return (
        <View>
            <FeatureToggle
                flag="chat_feature"
                fallback={<ChatDisabledMessage />}
            >
                <ChatUI />
            </FeatureToggle>
        </View>
    );
}

const ChatDisabledMessage = () => (
    <View style={{ padding: 20, alignItems: 'center' }}>
        <Text>🔧 Chat temporariamente desabilitado</Text>
        <Text>Voltaremos em breve!</Text>
    </View>
);

// ============================================
// EXEMPLO 3: Múltiplas Flags
// ============================================

export function MarketplaceScreen() {
    const { enabled: advancedSearchEnabled } = useFeatureFlag('advanced_search', false);
    const { enabled: aiRecommendationsEnabled } = useFeatureFlag('ai_recommendations', false);

    return (
        <View>
            {/* Busca normal sempre disponível */}
            <SearchBar />

            {/* Busca avançada apenas se flag habilitada */}
            {advancedSearchEnabled && (
                <AdvancedFilters />
            )}

            {/* Lista de itens */}
            <ItemList />

            {/* Recomendações AI apenas se habilitada */}
            {aiRecommendationsEnabled && (
                <AIRecommendations />
            )}
        </View>
    );
}

// ============================================
// EXEMPLO 4: Feature com Degradação Graciosa
// ============================================

export function DisputeScreen({ rentalId }) {
    const { enabled: autoResolutionEnabled } = useFeatureFlag('dispute_auto_resolution', false);

    const handleSubmitDispute = async (disputeData) => {
        try {
            // Criar disputa (sempre funciona)
            const dispute = await createDispute(disputeData);

            // Resolução automática apenas se feature habilitada
            if (autoResolutionEnabled) {
                try {
                    await autoResolveDispute(dispute.id);
                    Alert.alert('Sucesso', 'Disputa em análise automática');
                } catch (error) {
                    console.error('Auto-resolução falhou, continuando manual');
                    Alert.alert('Sucesso', 'Disputa criada. Análise manual.');
                }
            } else {
                Alert.alert('Sucesso', 'Disputa criada. Análise manual.');
            }
        } catch (error) {
            Alert.alert('Erro', error.message);
        }
    };

    return <DisputeForm onSubmit={handleSubmitDispute} />;
}

// ============================================
// EXEMPLO 5: Feature com A/B Testing
// ============================================

export function HomeScreen() {
    // 50% dos usuários veem novo layout
    const { enabled: newLayoutEnabled } = useFeatureFlag('new_home_layout', false);

    if (newLayoutEnabled) {
        return <NewHomeLayout />;
    }

    return <OldHomeLayout />;
}

// ============================================
// EXEMPLO 6: Feature com Rollout Gradual
// ============================================

/*
    Configuração no database:

    -- Dia 1: 5% rollout
    UPDATE feature_flags
    SET enabled = true, rollout_percentage = 5
    WHERE name = 'new_rental_flow';

    -- Se tudo OK, Dia 2: 25%
    UPDATE feature_flags
    SET rollout_percentage = 25
    WHERE name = 'new_rental_flow';

    -- Dia 3: 50%
    UPDATE feature_flags
    SET rollout_percentage = 50
    WHERE name = 'new_rental_flow';

    -- Dia 4: 100%
    UPDATE feature_flags
    SET rollout_percentage = 100
    WHERE name = 'new_rental_flow';
*/

export function RentalRequestScreen({ itemId }) {
    const { enabled: newFlowEnabled } = useFeatureFlag('new_rental_flow', false);

    if (newFlowEnabled) {
        return <NewRentalFlow itemId={itemId} />;
    }

    return <OldRentalFlow itemId={itemId} />;
}

// ============================================
// EXEMPLO 7: Feature Beta (Opt-in)
// ============================================

export function ProfileScreen({ userId }) {
    const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(false);
    const { enabled: insuranceEnabled } = useFeatureFlag('rental_insurance', false);

    // Usuário pode ativar features beta manualmente
    const handleToggleBeta = () => {
        setBetaFeaturesEnabled(!betaFeaturesEnabled);
    };

    return (
        <View>
            <Text>Configurações</Text>

            <TouchableOpacity onPress={handleToggleBeta}>
                <Text>Features Beta: {betaFeaturesEnabled ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>

            {/* Feature beta + flag remota */}
            {betaFeaturesEnabled && insuranceEnabled && (
                <InsuranceSettings />
            )}
        </View>
    );
}

// ============================================
// EXEMPLO 8: Feature com Fallback de Erro
// ============================================

export function VerificationScreen() {
    const { enabled: newVerificationEnabled, loading } = useFeatureFlag('new_verification_system', false);
    const [useOldSystem, setUseOldSystem] = useState(false);

    const handleVerificationError = (error) => {
        console.error('Nova verificação falhou:', error);

        Alert.alert(
            'Erro',
            'Ocorreu um problema. Deseja tentar o método antigo?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Usar Método Antigo',
                    onPress: () => setUseOldSystem(true)
                }
            ]
        );
    };

    if (loading) return <LoadingScreen />;

    // Se forçou sistema antigo ou flag desabilitada
    if (useOldSystem || !newVerificationEnabled) {
        return <OldVerificationUI />;
    }

    return (
        <NewVerificationUI
            onError={handleVerificationError}
            fallback={<OldVerificationUI />}
        />
    );
}

// ============================================
// EXEMPLO 9: Admin - Gerenciar Feature Flags
// ============================================

import {
    getAllFeatureFlags,
    updateFeatureFlag,
    emergencyDisableFeature,
    getFeatureFlagHistory
} from '../hooks/useFeatureFlag';

export function AdminFeatureFlagsScreen() {
    const [flags, setFlags] = useState([]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        const allFlags = await getAllFeatureFlags();
        setFlags(allFlags);

        const recentHistory = await getFeatureFlagHistory(null, 20);
        setHistory(recentHistory);
    };

    const handleToggleFlag = async (flagName, currentlyEnabled) => {
        try {
            await updateFeatureFlag(flagName, {
                enabled: !currentlyEnabled
            });

            Alert.alert('Sucesso', `Feature ${currentlyEnabled ? 'desabilitada' : 'habilitada'}`);
            loadFlags();
        } catch (error) {
            Alert.alert('Erro', error.message);
        }
    };

    const handleEmergencyDisable = async (flagName) => {
        Alert.alert(
            'KILL SWITCH',
            `Desabilitar "${flagName}" IMEDIATAMENTE?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'DESABILITAR',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await emergencyDisableFeature(
                                flagName,
                                'Desabilitado via kill switch por admin'
                            );

                            Alert.alert('🚨 DESABILITADO', 'Feature desligada com sucesso');
                            loadFlags();
                        } catch (error) {
                            Alert.alert('Erro', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateRollout = async (flagName, newPercentage) => {
        try {
            await updateFeatureFlag(flagName, {
                rollout_percentage: parseInt(newPercentage)
            });

            Alert.alert('Sucesso', `Rollout atualizado para ${newPercentage}%`);
            loadFlags();
        } catch (error) {
            Alert.alert('Erro', error.message);
        }
    };

    return (
        <ScrollView>
            <Text style={styles.title}>Feature Flags Management</Text>

            {flags.map(flag => (
                <View key={flag.id} style={styles.flagCard}>
                    <View style={styles.flagHeader}>
                        <Text style={styles.flagName}>{flag.name}</Text>
                        <Switch
                            value={flag.enabled}
                            onValueChange={() => handleToggleFlag(flag.name, flag.enabled)}
                        />
                    </View>

                    <Text style={styles.flagDescription}>{flag.description}</Text>

                    <View style={styles.rolloutContainer}>
                        <Text>Rollout: {flag.rollout_percentage}%</Text>
                        <Slider
                            value={flag.rollout_percentage}
                            onValueChange={(value) => handleUpdateRollout(flag.name, value)}
                            minimumValue={0}
                            maximumValue={100}
                            step={5}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.killSwitchButton}
                        onPress={() => handleEmergencyDisable(flag.name)}
                    >
                        <Text style={styles.killSwitchText}>🚨 KILL SWITCH</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Histórico Recente</Text>
            {history.map(entry => (
                <View key={entry.id} style={styles.historyEntry}>
                    <Text>{entry.flag_name}</Text>
                    <Text>{entry.action}</Text>
                    <Text>{new Date(entry.created_at).toLocaleString()}</Text>
                    <Text>Por: {entry.profiles?.username || 'Sistema'}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

// ============================================
// EXEMPLO 10: Pré-carregar Flags na Inicialização
// ============================================

import { preloadFeatureFlags } from '../hooks/useFeatureFlag';

// No App.js ou _layout.tsx
export function AppInitializer({ children }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            // Pré-carregar flags críticas
            await preloadFeatureFlags([
                'chat_system',
                'payment_system',
                'verification_system',
                'dispute_system'
            ]);

            setReady(true);
        };

        init();
    }, []);

    if (!ready) {
        return <SplashScreen />;
    }

    return children;
}

// ============================================
// BÔNUS: Componentes Placeholder
// ============================================

const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando...</Text>
    </View>
);

const NewPaymentUI = () => <Text>💳 Novo Sistema de Pagamento</Text>;
const OldPaymentUI = () => <Text>💰 Sistema de Pagamento Antigo</Text>;
const ChatUI = () => <Text>💬 Chat Habilitado</Text>;
const SearchBar = () => <Text>🔍 Busca</Text>;
const AdvancedFilters = () => <Text>🎛️ Filtros Avançados</Text>;
const ItemList = () => <Text>📦 Lista de Itens</Text>;
const AIRecommendations = () => <Text>🤖 Recomendações IA</Text>;

export default {
    PaymentScreen,
    ChatScreen,
    MarketplaceScreen,
    DisputeScreen,
    HomeScreen,
    RentalRequestScreen,
    ProfileScreen,
    VerificationScreen,
    AdminFeatureFlagsScreen,
    AppInitializer
};

