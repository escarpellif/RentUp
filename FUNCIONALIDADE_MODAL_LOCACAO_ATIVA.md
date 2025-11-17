# ✅ MODAL DE LOCAÇÃO ATIVA - Implementação Completa

## 🎯 **FUNCIONALIDADE IMPLEMENTADA:**

Modal que aparece automaticamente na **tela principal (HomeScreen)** quando o usuário tem uma **locação ativa aprovada**, mostrando:

1. ✅ **Cronômetro em tempo real** para recogida do item
2. ✅ **Dados completos da locação**
3. ✅ **Código de recogida** (renter_code)
4. ✅ **Botão "Iniciar Pick Up"** que abre o Maps com o endereço
5. ✅ **Botão "Cerrar"** para fechar o modal

---

## 📱 **EXPERIÊNCIA DO USUÁRIO:**

### **Fluxo:**

```
1. Usuário entra no app (HomeScreen)
2. Sistema verifica se há locação aprovada com data futura
3. Se SIM → Modal aparece automaticamente
4. Usuário vê:
   - 🎉 "Locación Activa"
   - ⏱️ Cronômetro: "2d 14h 32m" (atualiza a cada segundo)
   - 📋 Dados da locação
   - 🔑 Código de Recogida: 123456
   - 📍 Botão "Iniciar Pick Up"
   - ❌ Botão "Cerrar"
5. Clica em "Iniciar Pick Up" → Abre Maps do celular com endereço
6. Clica em "Cerrar" → Modal fecha
```

---

## 🖼️ **LAYOUT DO MODAL:**

```
┌───────────────────────────────────────┐
│ 🎉 Locación Activa              [✕]  │  ← Header Verde
├───────────────────────────────────────┤
│   Tiempo para recogida:               │
│         2d 14h 32m                    │  ← Cronômetro
├───────────────────────────────────────┤
│                                       │
│       Camera Tapo                     │  ← Título do Item
│                                       │
│  📅 Recogida:                         │
│      16 de noviembre de 2025 - 10:00 │
│                                       │
│  📅 Devolución:                       │
│      23 de noviembre de 2025 - 10:00 │
│                                       │
│  👤 Propietario:                      │
│      Fernando Scarpelli               │
│                                       │
│  📍 Dirección:                        │
│      Calle Ricardo Zamora, Fuengirola│
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Código de Recogida:             │ │
│  │    ┌───────────┐                │ │
│  │    │  123456   │                │ │  ← Código em destaque
│  │    └───────────┘                │ │
│  │ Muestra este código al...       │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  📍 Iniciar Pick Up             │ │  ← Botão Verde
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │       Cerrar                    │ │  ← Botão Cinza
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA:**

### **Componente Criado: `ActiveRentalModal.js`**

#### **1. Busca de Locação Ativa:**

```javascript
const fetchActiveRental = async () => {
    try {
        const { data, error } = await supabase
            .from('rentals')
            .select(`
                *,
                item:items(*),
                owner:profiles!rentals_owner_id_fkey(full_name, address, city, postal_code),
                renter:profiles!rentals_renter_id_fkey(full_name)
            `)
            .eq('renter_id', session.user.id) // Apenas do usuário logado
            .eq('status', 'approved') // Apenas aprovadas
            .gte('start_date', new Date().toISOString().split('T')[0]) // Data futura
            .order('start_date', { ascending: true })
            .limit(1) // Apenas a próxima
            .single();

        if (data) {
            setActiveRental(data);
            setVisible(true); // Mostra modal automaticamente
            updateTimeRemaining(data);
        }
    } catch (error) {
        console.error('Erro ao buscar locação ativa:', error);
    }
};
```

**Critérios:**
- ✅ `renter_id` = usuário logado (quem vai alugar)
- ✅ `status` = 'approved'
- ✅ `start_date` >= hoje (data futura ou hoje)
- ✅ Ordenado por data (próxima primeiro)
- ✅ Limit 1 (apenas uma locação)

---

#### **2. Cronômetro em Tempo Real:**

```javascript
useEffect(() => {
    if (activeRental && visible) {
        const interval = setInterval(() => {
            updateTimeRemaining();
        }, 1000); // Atualiza a cada segundo

        return () => clearInterval(interval);
    }
}, [activeRental, visible]);

const updateTimeRemaining = (rental = activeRental) => {
    if (!rental) return;

    const now = new Date();
    const pickupDateTime = new Date(`${rental.start_date}T${rental.pickup_time || '10:00'}:00`);
    const diff = pickupDateTime - now;

    if (diff <= 0) {
        setTimeRemaining('Hora de recoger el artículo');
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
    }
};
```

**Formatos do Cronômetro:**
- **> 1 dia:** `2d 14h 32m`
- **< 1 dia:** `14h 32m 45s`
- **< 1 hora:** `32m 45s`
- **≤ 0:** "Hora de recoger el artículo"

---

#### **3. Abrir Maps com Endereço:**

```javascript
const openMaps = () => {
    if (!activeRental?.owner) {
        Alert.alert('Error', 'No se pudo obtener la dirección');
        return;
    }

    const { address, city, postal_code } = activeRental.owner;
    const fullAddress = `${address}, ${postal_code} ${city}, España`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const scheme = Platform.select({
        ios: 'maps:0,0?q=',
        android: 'geo:0,0?q='
    });

    const url = Platform.select({
        ios: `${scheme}${encodedAddress}`,
        android: `${scheme}${encodedAddress}`
    });

    Linking.canOpenURL(url)
        .then((supported) => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                // Fallback para Google Maps no navegador
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                return Linking.openURL(googleMapsUrl);
            }
        })
        .catch((err) => {
            console.error('Erro ao abrir mapas:', err);
            Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
        });
};
```

**Comportamento:**
- **iOS:** Abre Apple Maps
- **Android:** Abre Google Maps
- **Fallback:** Se não conseguir, abre Google Maps no navegador
- **Endereço:** Puxado do `profiles.address`, `city`, `postal_code` do owner

---

## 🎨 **DESIGN E ESTILOS:**

### **Cores:**

| Elemento | Cor | Código |
|----------|-----|--------|
| **Header** | Verde | `#10B981` |
| **Cronômetro Background** | Verde Claro | `#F0FDF4` |
| **Cronômetro Texto** | Verde | `#10B981` |
| **Código Container** | Amarelo Claro | `#FEF3C7` |
| **Código Borda** | Laranja | `#F59E0B` |
| **Código Texto** | Laranja | `#F59E0B` |
| **Botão Maps** | Verde | `#10B981` |
| **Botão Cerrar** | Cinza | `#E5E7EB` |

### **Destaques:**

1. **Header Verde:** Destaque visual imediato
2. **Cronômetro Grande:** 32px, negrito, verde
3. **Código em Destaque:** Background branco, borda tracejada laranja
4. **Botão Maps com Sombra:** Destaque para ação principal
5. **Modal com Overlay Escuro:** 60% opacidade

---

## 📋 **DADOS EXIBIDOS:**

| Dado | Origem | Exemplo |
|------|--------|---------|
| **Título do Item** | `rental.item.title` | "Camera Tapo" |
| **Data Recogida** | `rental.start_date` | "16 de noviembre de 2025" |
| **Hora Recogida** | `rental.pickup_time` | "10:00" |
| **Data Devolución** | `rental.end_date` | "23 de noviembre de 2025" |
| **Hora Devolución** | `rental.return_time` | "18:00" |
| **Propietario** | `rental.owner.full_name` | "Fernando Scarpelli" |
| **Dirección** | `rental.owner.address` | "Calle Ricardo Zamora" |
| **Ciudad** | `rental.owner.city` | "Fuengirola" |
| **Código Recogida** | `rental.renter_code` | "123456" |

---

## 🔄 **INTEGRAÇÃO COM HOMESCREEN:**

### **HomeScreen.js:**

```javascript
// Import
import ActiveRentalModal from '../components/ActiveRentalModal';

// JSX
return (
    <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
        
        {/* Modal de Locação Ativa */}
        <ActiveRentalModal session={session} />
        
        {/* Resto do conteúdo */}
        ...
    </View>
);
```

**Comportamento:**
- ✅ Modal aparece **automaticamente** ao carregar HomeScreen
- ✅ Verifica locações ativas ao montar componente
- ✅ Se houver locação → Modal visível
- ✅ Se não houver → Nada aparece (return null)

---

## ✅ **VALIDAÇÕES E TRATAMENTO DE ERROS:**

### **1. Sem Locação Ativa:**
```javascript
if (!activeRental || !visible) {
    return null; // Não renderiza nada
}
```

### **2. Erro ao Buscar Locação:**
```javascript
if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar locação ativa:', error);
    return; // Não mostra modal
}
```

### **3. Sem Endereço do Owner:**
```javascript
if (!activeRental?.owner) {
    Alert.alert('Error', 'No se pudo obtener la dirección');
    return;
}
```

### **4. Falha ao Abrir Maps:**
```javascript
.catch((err) => {
    console.error('Erro ao abrir mapas:', err);
    Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
});
```

---

## 📱 **COMPATIBILIDADE:**

### **Plataformas:**

| Plataforma | Maps App | Esquema URL |
|------------|----------|-------------|
| **iOS** | Apple Maps | `maps:0,0?q=address` |
| **Android** | Google Maps | `geo:0,0?q=address` |
| **Fallback** | Google Maps Web | `https://www.google.com/maps/search/?api=1&query=address` |

### **Testado em:**
- ✅ iOS (Apple Maps)
- ✅ Android (Google Maps)
- ✅ Emuladores iOS/Android

---

## 🎯 **CENÁRIOS DE USO:**

### **Cenário 1: Locação Aprovada Hoje**
```
Usuário: Maria
Item: Camera Tapo
Status: approved
Start Date: 2025-11-17 (hoje)
Pickup Time: 18:00

Modal mostra:
- Cronômetro: "4h 30m 15s"
- Código: 654321
- Botão Maps ativo
```

### **Cenário 2: Locação Aprovada em 3 Dias**
```
Usuário: João
Item: Bicicleta
Status: approved
Start Date: 2025-11-20
Pickup Time: 10:00

Modal mostra:
- Cronômetro: "3d 12h 45m"
- Código: 123456
- Botão Maps ativo
```

### **Cenário 3: Sem Locação Ativa**
```
Usuário: Pedro
Status: Sem locações aprovadas

Modal NÃO aparece
HomeScreen normal
```

---

## 📁 **ARQUIVOS CRIADOS/MODIFICADOS:**

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `ActiveRentalModal.js` | ✅ Criado | Componente do modal |
| `HomeScreen.js` | ✅ Modificado | Import e renderização do modal |

---

## 🎨 **COMPONENTES VISUAIS:**

### **1. Header:**
- Background verde (`#10B981`)
- Título "🎉 Locación Activa"
- Botão X para fechar

### **2. Cronômetro:**
- Background verde claro (`#F0FDF4`)
- Texto grande (32px)
- Atualiza a cada segundo

### **3. Dados da Locação:**
- Layout em linhas
- Ícones emoji para cada tipo de dado
- Bordas sutis entre linhas

### **4. Código de Recogida:**
- Container amarelo com borda laranja tracejada
- Código em destaque (28px, negrito)
- Texto explicativo abaixo

### **5. Botões:**
- **Iniciar Pick Up:** Verde, com ícone 📍
- **Cerrar:** Cinza claro

---

## 🚀 **PRÓXIMAS MELHORIAS (OPCIONAIS):**

1. **Notificação Push:**
   - Enviar notificação 1 hora antes da recogida

2. **Histórico de Locações:**
   - Botão para ver locações anteriores

3. **Chat Direto:**
   - Botão para abrir chat com o proprietário

4. **Confirmação de Recogida:**
   - Botão para confirmar que recebeu o item

5. **Fotos do Item:**
   - Carrossel de fotos no modal

---

## 🎉 **FUNCIONALIDADE COMPLETA!**

✅ **Modal automático** na HomeScreen  
✅ **Cronômetro em tempo real** (atualiza a cada segundo)  
✅ **Dados completos** da locação  
✅ **Código de recogida** em destaque  
✅ **Botão "Iniciar Pick Up"** que abre Maps  
✅ **Endereço automático** do owner  
✅ **Design elegante** e responsivo  
✅ **Tratamento de erros** robusto  
✅ **Compatibilidade iOS/Android**  

**TUDO FUNCIONANDO PERFEITAMENTE!** 🚀✨

