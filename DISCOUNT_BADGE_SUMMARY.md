# Badge de Desconto no Marketplace e Itens Recentes

## Data de Implementação
20 de janeiro de 2026

## Objetivo
Adicionar badges visuais destacados nos cards de itens do Marketplace e nos Itens Adicionados Recentemente quando houver descontos semanais ou mensais configurados.

## Arquivos Modificados

### 1. ItemCard.js ✅
**Caminho:** `/src/components/ItemCard.js`

**Mudanças:**
- ✅ Adicionado badge de desconto na parte superior esquerda da imagem do card
- ✅ Badge aparece sobre a imagem com ícone 🎉 e porcentagem de desconto
- ✅ Mostra o maior desconto quando há desconto semanal E mensal
- ✅ Posicionado no canto superior esquerdo (oposto ao badge "Pausado")

**Lógica do Badge:**
```javascript
// Se ambos os descontos existem, mostra o maior
{item.discount_week > 0 && item.discount_month > 0
    ? `${Math.max(item.discount_week, item.discount_month)}% OFF`
    // Se só desconto semanal
    : item.discount_week > 0
    ? `${item.discount_week}% OFF`
    // Se só desconto mensal
    : `${item.discount_month}% OFF`
}
```

### 2. itemCardStyles.js ✅
**Caminho:** `/src/styles/itemCardStyles.js`

**Estilos Adicionados:**
```javascript
discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,  // Canto superior direito
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,  // Reduzido
    paddingVertical: 5,    // Reduzido
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,  // Reduzido
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
},
discountBadgeIcon: {
    fontSize: 11,  // Reduzido
},
discountBadgeText: {
    fontSize: 10,  // Reduzido
    fontWeight: 'bold',
    letterSpacing: 0.5,
}
```

### 3. RecentItemsCarousel.js ✅
**Caminho:** `/src/components/RecentItemsCarousel.js`

**Mudanças:**
- ✅ Adicionado badge de desconto na parte superior direita da imagem
- ✅ Mesmo comportamento do ItemCard
- ✅ Badge aparece apenas quando há desconto configurado

### 4. recentItemsCarouselStyles.js ✅
**Caminho:** `/src/styles/recentItemsCarouselStyles.js`

**Estilos Adicionados:**
```javascript
discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // ... sombras
}
```

## Design Visual

### Badge no Marketplace (ItemCard)
```
┌─────────────────────────────────┐
│ 🎉 20% OFF    [Foto]    ⏸️ Pausado │
│                                  │
│        IMAGEM DO ITEM            │
│                                  │
└─────────────────────────────────┘
```
- **Posição:** Canto superior esquerdo
- **Cor:** Laranja vibrante (#FF6B00)
- **Ícone:** 🎉
- **Sombra:** Forte para destacar

### Badge nos Itens Recentes
```
┌─────────────────────────────────┐
│ NUEVO         [Foto]   🎉 20% OFF │
│                                  │
│        IMAGEM DO ITEM            │
│                                  │
└─────────────────────────────────┘
```
- **Posição:** Canto superior direito
- **Mesmo estilo do Marketplace**
- **Não conflita com badge "NUEVO"**

## Comportamento

### Quando Aparece
- ✅ `discount_week > 0` (desconto semanal configurado)
- ✅ `discount_month > 0` (desconto mensal configurado)
- ✅ Ambos configurados (mostra o maior)

### Quando NÃO Aparece
- ❌ `discount_week = 0` e `discount_month = 0`
- ❌ Descontos não configurados
- ❌ Item sem descontos

## Cores e Estilo

### Paleta de Cores
- **Background Badge:** #FF6B00 (Laranja vibrante)
- **Texto:** #FFFFFF (Branco)
- **Sombra:** rgba(0, 0, 0, 0.4)

### Tipografia
- **Tamanho:** 11-12px
- **Peso:** Bold (700)
- **Espaçamento:** 0.5px letter-spacing

### Efeitos
- ✅ Sombra forte (elevation 6)
- ✅ Border radius 8-12px
- ✅ Padding adequado para legibilidade

## Exemplos de Uso

### Exemplo 1: Desconto Semanal
```javascript
item = {
    discount_week: 15,
    discount_month: 0
}
```
**Badge:** `🎉 15% OFF`

### Exemplo 2: Desconto Mensal
```javascript
item = {
    discount_week: 0,
    discount_month: 50
}
```
**Badge:** `🎉 50% OFF`

### Exemplo 3: Ambos os Descontos
```javascript
item = {
    discount_week: 20,
    discount_month: 60
}
```
**Badge:** `🎉 60% OFF` (mostra o maior)

### Exemplo 4: Sem Desconto
```javascript
item = {
    discount_week: 0,
    discount_month: 0
}
```
**Badge:** Não aparece

## Localização no App

### 1. Marketplace (MainMarketplace.js)
- Lista de todos os itens
- Grid de 2 colunas
- Badge no canto superior direito da imagem (mesmo padrão dos Itens Recentes)
- Tamanho reduzido para melhor harmonia visual

### 2. Itens Adicionados Recentemente (RecentItemsCarousel.js)
- Carrossel horizontal na home page
- Badge no canto superior direito da imagem
- Não conflita com badge "NUEVO" (esquerda)

### 3. Tela de Detalhes (ItemDetailsScreen.js)
- Seção destacada após descrição
- Design diferente (container laranja claro)
- Detalhamento completo dos descontos

## Hierarquia Visual

### Badges no Card
1. **Pausado** (Esquerda, Laranja #FF9800) - Administrativo (quando item pausado)
2. **Desconto** (Direita, Laranja #FF6B00) - DESTAQUE PROMOCIONAL
3. **NUEVO** (Esquerda, Verde #10B981) - Informativo (só no carrossel)

## Compatibilidade
- ✅ iOS
- ✅ Android
- ✅ Web (se aplicável)

## Performance
- ✅ Renderização condicional (só renderiza se houver desconto)
- ✅ Cálculo simples (Math.max)
- ✅ Sem impacto na performance

## Teste de Aceitação

### ✅ Cenário 1: Item com Desconto Semanal
1. Criar item com `discount_week = 20`
2. Verificar badge "🎉 20% OFF" no Marketplace
3. Verificar badge nos Itens Recentes

### ✅ Cenário 2: Item com Desconto Mensal
1. Criar item com `discount_month = 60`
2. Verificar badge "🎉 60% OFF" no Marketplace
3. Verificar badge nos Itens Recentes

### ✅ Cenário 3: Item com Ambos
1. Criar item com `discount_week = 20` e `discount_month = 60`
2. Verificar badge "🎉 60% OFF" (maior desconto)

### ✅ Cenário 4: Item Sem Desconto
1. Criar item sem descontos
2. Verificar que badge NÃO aparece

### ✅ Cenário 5: Múltiplos Itens
1. Criar vários itens com diferentes descontos
2. Verificar que cada um mostra o badge correto
3. Verificar que itens sem desconto não mostram badge

## Consistência Visual

### ItemCard vs RecentItemsCarousel
| Aspecto | ItemCard | RecentItemsCarousel |
|---------|----------|-------------------|
| Posição | Superior Direito | Superior Direito |
| Cor | #FF6B00 | #FF6B00 |
| Ícone | 🎉 | 🎉 |
| Tamanho Texto | 10px | 11px |
| Tamanho Ícone | 11px | 12px |
| Lógica | Mesma | Mesma |

## Status
✅ **Implementado e Testado**
✅ **Sem Erros de Sintaxe**
✅ **Design Consistente**
✅ **Pronto para Produção**

## Melhorias Futuras (Opcional)
- [ ] Animação de entrada do badge (fade-in)
- [ ] Badge pulsante para descontos muito altos (>50%)
- [ ] Tooltip com detalhes ao pressionar o badge
- [ ] Variação de cor baseada no desconto (>50% = vermelho vibrante)

---

**Desenvolvedor:** GitHub Copilot  
**Data:** 20 de janeiro de 2026  
**Versão:** 1.0

