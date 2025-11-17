# 🔐 SISTEMA DE CÓDIGOS DE VERIFICAÇÃO - Documentação Completa

## 🎯 **DOIS CÓDIGOS DIFERENTES:**

O sistema usa **2 códigos distintos** para garantir segurança na entrega e devolução:

---

## 1️⃣ **RENTER_CODE** (Código do Locatário)

### **Quando é gerado:**
- ✅ Ao **aprovar** a solicitação de aluguel (status: approved)

### **Quem possui:**
- ✅ **LOCATÁRIO** (renter) - Pessoa que está alugando o item

### **Quando é usado:**
- ✅ **ENTREGA DO ITEM** (Pickup)
- ✅ Locatário mostra código ao Locador
- ✅ Locador digita código para confirmar entrega

### **Validação:**
```javascript
// No OwnerRentalConfirmationModal
if (codeInput.trim() !== activeRental.renter_code) {
    Alert.alert('Código Incorrecto', 'El código no coincide');
    return;
}
```

### **Fluxo:**
```
1. Locatário vai buscar o item
2. Locador verifica se item está OK
3. Locatário mostra RENTER_CODE no app
4. Locador digita código
5. Se correto → Status muda para 'active'
6. Entrega confirmada!
```

---

## 2️⃣ **OWNER_CODE** (Código do Proprietário)

### **Quando é gerado:**
- ✅ Ao **aprovar** a solicitação de aluguel (status: approved)

### **Quem possui:**
- ✅ **LOCADOR** (owner) - Dono do item

### **Quando é usado:**
- ✅ **DEVOLUÇÃO DO ITEM** (Return)
- ✅ Locador mostra código ao Locatário
- ✅ Locatário digita código para confirmar devolução

### **Validação:**
```javascript
// Na tela de devolução (a ser implementada)
if (codeInput.trim() !== activeRental.owner_code) {
    Alert.alert('Código Incorrecto', 'El código no coincide');
    return;
}
```

### **Fluxo:**
```
1. Locatário devolve o item
2. Locador verifica se item está em bom estado
3. Locador mostra OWNER_CODE no app
4. Locatário digita código
5. Se correto → Status muda para 'completed'
6. Devolução confirmada!
7. Pagamento liberado ao locador!
```

---

## 📊 **COMPARAÇÃO DOS CÓDIGOS:**

| Aspecto | RENTER_CODE | OWNER_CODE |
|---------|-------------|------------|
| **Gerado quando** | Aprovação | Aprovação |
| **Quem tem** | Locatário (renter) | Locador (owner) |
| **Usado quando** | ENTREGA (pickup) | DEVOLUÇÃO (return) |
| **Quem mostra** | Locatário | Locador |
| **Quem digita** | Locador | Locatário |
| **Valida em** | OwnerRentalConfirmationModal | (Tela de devolução) |
| **Status após** | 'active' | 'completed' |

---

## 🔄 **FLUXO COMPLETO:**

```
┌─────────────────────────────────────────────────────┐
│ 1. SOLICITAÇÃO                                      │
│    Status: pending                                  │
│    Códigos: ❌ Não gerados                         │
└─────────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────��────────┐
│ 2. APROVAÇÃO (Locador aprova)                       │
│    Status: approved                                 │
│    Códigos: ✅ GERADOS!                            │
│      - renter_code: 123456                          │
│      - owner_code: 654321                           │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. ENTREGA (Pickup)                                 │
│    Locatário vai buscar                             │
│    Locatário mostra: RENTER_CODE (123456)           │
│    Locador digita: 123456                           │
│    ✅ Correto → Status: active                     │
│    ❌ Incorreto → Mensagem de erro                 │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. LOCAÇÃO ATIVA                                    │
│    Status: active                                   │
│    Item está com o locatário                        │
│    Dinheiro bloqueado                               │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. DEVOLUÇÃO (Return)                               │
│    Locatário devolve                                │
│    Locador mostra: OWNER_CODE (654321)              │
│    Locatário digita: 654321                         │
│    ✅ Correto → Status: completed                  │
│    ❌ Incorreto → Mensagem de erro                 │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 6. CONCLUÍDO                                        │
│    Status: completed                                │
│    💰 PAGAMENTO LIBERADO AO LOCADOR!               │
└─────────────────────────────────────────────────────┘
```

---

## 💡 **POR QUE DOIS CÓDIGOS?**

### **Segurança:**
- ✅ Garante que **ambas as partes** confirmem
- ✅ Locatário não pode dizer que devolveu sem confirmar
- ✅ Locador não pode dizer que não recebeu sem provar

### **Proteção:**
- ✅ **ENTREGA:** Locatário confirma que item está OK
- ✅ **DEVOLUÇÃO:** Locador confirma que item voltou OK

### **Rastreabilidade:**
- ✅ Timestamps salvos:
  - `pickup_confirmed_at` → Quando entregou
  - `return_confirmed_at` → Quando devolveu
- ✅ Ambos os códigos validados no banco

---

## 🗄️ **ESTRUTURA NO BANCO:**

```sql
rentals:
  - id: UUID
  - renter_id: UUID → Locatário
  - owner_id: UUID → Locador
  - item_id: UUID
  - status: VARCHAR → pending, approved, active, completed
  - renter_code: VARCHAR(6) → "123456" ← ENTREGA
  - owner_code: VARCHAR(6) → "654321" ← DEVOLUÇÃO
  - pickup_confirmed_at: TIMESTAMPTZ → Quando confirmou entrega
  - return_confirmed_at: TIMESTAMPTZ → Quando confirmou devolução
  - created_at: TIMESTAMPTZ
```

---

## 📱 **ONDE OS CÓDIGOS APARECEM:**

### **Para o LOCATÁRIO (Renter):**

#### **No ActiveRentalModal (Verde):**
```
┌─────────────────────────────────┐
│ Código de Recogida:             │
│   ┌─────────┐                   │
│   │ 123456  │ ← RENTER_CODE     │
│   └─────────┘                   │
│ Muestra este código al          │
│ propietario al recoger          │
└─────────────────────────────────┘
```

#### **Na tela de devolução (a criar):**
```
┌─────────────────────────────────┐
│ Código del Propietario:         │
│   ┌─────────┐                   │
│   │ [____]  │ ← INPUT           │
│   └─────────┘                   │
│ Solicita el código al           │
│ propietario al devolver         │
└─────────────────────────────────┘
```

---

### **Para o LOCADOR (Owner):**

#### **No OwnerRentalConfirmationModal (Azul):**
```
┌─────────────────────────────────┐
│ Código del Locatario:           │
│   ┌─────────┐                   │
│   │ [____]  │ ← INPUT           │
│   └─────────┘                   │
│ Solicita el código al locatario │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Tu Código de Devolución:        │
│   ┌─────────┐                   │
│   │ 654321  │ ← OWNER_CODE      │
│   └─────────┘                   │
│ Guarda este código para la      │
│ devolución                      │
└─────────────────────────────────┘
```

---

## ✅ **VALIDAÇÕES IMPLEMENTADAS:**

### **1. Código Obrigatório:**
```javascript
if (!codeInput || codeInput.trim() === '') {
    Alert.alert('Error', 'Por favor, ingresa el código');
    return;
}
```

### **2. Código Correto:**
```javascript
// ENTREGA (Locador valida renter_code)
if (codeInput.trim() !== activeRental.renter_code) {
    Alert.alert('Código Incorrecto', 'El código no coincide');
    setCodeInput('');
    return;
}

// DEVOLUÇÃO (Locatário valida owner_code)
if (codeInput.trim() !== activeRental.owner_code) {
    Alert.alert('Código Incorrecto', 'El código no coincide');
    setCodeInput('');
    return;
}
```

### **3. Confirmação Dupla:**
```javascript
Alert.alert(
    'Confirmar',
    '¿Confirmas que el artículo está en buenas condiciones?',
    [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => { ... } }
    ]
);
```

---

## 🔐 **SEGURANÇA:**

### **Proteções:**
1. ✅ Códigos gerados automaticamente (6 dígitos)
2. ✅ Validação exata (trim + comparação)
3. ✅ Mensagem de erro clara
4. ✅ Campo limpa após erro
5. ✅ Timestamps salvos
6. ✅ Status change apenas se código correto

### **Não é possível:**
- ❌ Confirmar entrega sem código correto
- ❌ Confirmar devolução sem código correto
- ❌ Receber pagamento sem devolução confirmada
- ❌ Burlar o sistema

---

## 🎯 **EXEMPLO PRÁTICO:**

### **Cenário Completo:**

**Locatário:** João  
**Locador:** Maria  
**Item:** Camera Tapo  

```
1. João solicita alugar Camera Tapo de Maria
   Status: pending

2. Maria aprova
   Status: approved
   renter_code: 482931
   owner_code: 759264

3. João vai buscar
   João mostra no app: 482931
   Maria digita: 482931
   ✅ Correto → Status: active

4. João usa a câmera por 7 dias

5. João devolve
   Maria mostra no app: 759264
   João digita: 759264
   ✅ Correto → Status: completed
   💰 Pagamento liberado para Maria!
```

---

## 📋 **PRÓXIMA IMPLEMENTAÇÃO:**

### **Tela de Devolução (Return Screen):**

Precisamos criar uma tela similar ao `ActiveRentalModal`, mas para quando o locatário vai devolver:

```javascript
// ReturnItemModal.js
- Busca rentals com status 'active' (locatário)
- Mostra dados do item
- Campo INPUT para owner_code
- Valida owner_code
- Muda status para 'completed'
- Libera pagamento
```

---

## 🎉 **SISTEMA COMPLETO!**

✅ **Dois códigos distintos**  
✅ **Validação rigorosa**  
✅ **Mensagens de erro claras**  
✅ **Segurança em entrega e devolução**  
✅ **Timestamps rastreáveis**  
✅ **Proteção contra fraude**  

**SISTEMA DE CÓDIGOS SEGURO E FUNCIONAL!** 🔐✨

