# IMPLEMENTAÇÕES RESTANTES - CONTINUAÇÃO

## ✅ JÁ IMPLEMENTADO:

1. ✅ Preço sem taxa para donos em ItemCard, HomeScreen, RecentItemsCarousel
2. ✅ Preço sem taxa para donos em ItemDetailsScreen
3. ✅ Botões de solicitar aluguel e chat ocultos para o próprio dono
4. ✅ MyRentalsScreen separado em "Mis Alquileres" e "Mis Productos"
5. ✅ SQL atualizado com campos de desconto e horários específicos

## 🔨 FALTA IMPLEMENTAR (VOCÊ DEVE FAZER):

### 1. AddItemFormScreen - Adicionar campos de desconto
- Adicionar estados:
  ```javascript
  const [discountWeek, setDiscountWeek] = useState('');
  const [discountMonth, setDiscountMonth] = useState('');
  ```
  
- Adicionar campos no formulário (após campo de preço):
  ```jsx
  <Text style={styles.label}>Descuento Alquiler 1 Semana (%)</Text>
  <TextInput
      style={styles.input}
      onChangeText={setDiscountWeek}
      value={discountWeek}
      placeholder="0"
      keyboardType="numeric"
  />
  
  <Text style={styles.label}>Descuento Alquiler 1 Mes (%)</Text>
  <TextInput
      style={styles.input}
      onChangeText={setDiscountMonth}
      value={discountMonth}
      placeholder="0"
      keyboardType="numeric"
  />
  ```

- Atualizar insert:
  ```javascript
  .insert({
      // ...existing fields...
      discount_week: discountWeek ? parseFloat(discountWeek) : 0,
      discount_month: discountMonth ? parseFloat(discountMonth) : 0,
  })
  ```

### 2. EditItemScreen - Adicionar campos de desconto
- Adicionar estados:
  ```javascript
  const [discountWeek, setDiscountWeek] = useState(item?.discount_week?.toString() || '');
  const [discountMonth, setDiscountMonth] = useState(item?.discount_month?.toString() || '');
  ```

- Adicionar campos no formulário (mesmo código do AddItemFormScreen)

- Atualizar update:
  ```javascript
  .update({
      // ...existing fields...
      discount_week: discountWeek ? parseFloat(discountWeek) : 0,
      discount_month: discountMonth ? parseFloat(discountMonth) : 0,
  })
  ```

### 3. Alterar horários de recogida para Manhã/Tarde/Noite

Em **AddItemFormScreen.js** e **EditItemScreen.js**, SUBSTITUIR a seção de horários por:

```jsx
{!flexibleHours && (
    <>
        {/* Seletor de Días */}
        <Text style={styles.subLabel}>Días disponibles:</Text>
        <View style={styles.daysContainer}>
            {[
                { key: 'monday', label: 'L' },
                { key: 'tuesday', label: 'M' },
                { key: 'wednesday', label: 'X' },
                { key: 'thursday', label: 'J' },
                { key: 'friday', label: 'V' },
                { key: 'saturday', label: 'S' },
                { key: 'sunday', label: 'D' }
            ].map(day => (
                <TouchableOpacity
                    key={day.key}
                    style={[styles.dayButton, pickupDays[day.key] && styles.dayButtonActive]}
                    onPress={() => setPickupDays({...pickupDays, [day.key]: !pickupDays[day.key]})}
                >
                    <Text style={[styles.dayButtonText, pickupDays[day.key] && styles.dayButtonTextActive]}>
                        {day.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Horarios Manhã/Tarde/Noite */}
        <Text style={styles.subLabel}>Horarios de recogida:</Text>
        
        {/* Mañana */}
        <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPickupMorning(!pickupMorning)}
        >
            <View style={[styles.checkbox, pickupMorning && styles.checkboxChecked]}>
                {pickupMorning && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>🌅 Mañana</Text>
        </TouchableOpacity>
        {pickupMorning && (
            <View style={styles.timeRangeContainer}>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora início manhã
                    }}
                >
                    <Text style={styles.timePickerLabel}>Desde:</Text>
                    <Text style={styles.timePickerValue}>{pickupMorningStart}</Text>
                </TouchableOpacity>
                <Text style={styles.timeRangeSeparator}>-</Text>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora fim manhã
                    }}
                >
                    <Text style={styles.timePickerLabel}>Hasta:</Text>
                    <Text style={styles.timePickerValue}>{pickupMorningEnd}</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* Tarde */}
        <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPickupAfternoon(!pickupAfternoon)}
        >
            <View style={[styles.checkbox, pickupAfternoon && styles.checkboxChecked]}>
                {pickupAfternoon && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>☀️ Tarde</Text>
        </TouchableOpacity>
        {pickupAfternoon && (
            <View style={styles.timeRangeContainer}>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora início tarde
                    }}
                >
                    <Text style={styles.timePickerLabel}>Desde:</Text>
                    <Text style={styles.timePickerValue}>{pickupAfternoonStart}</Text>
                </TouchableOpacity>
                <Text style={styles.timeRangeSeparator}>-</Text>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora fim tarde
                    }}
                >
                    <Text style={styles.timePickerLabel}>Hasta:</Text>
                    <Text style={styles.timePickerValue}>{pickupAfternoonEnd}</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* Noche */}
        <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPickupEvening(!pickupEvening)}
        >
            <View style={[styles.checkbox, pickupEvening && styles.checkboxChecked]}>
                {pickupEvening && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>🌙 Noche</Text>
        </TouchableOpacity>
        {pickupEvening && (
            <View style={styles.timeRangeContainer}>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora início noite
                    }}
                >
                    <Text style={styles.timePickerLabel}>Desde:</Text>
                    <Text style={styles.timePickerValue}>{pickupEveningStart}</Text>
                </TouchableOpacity>
                <Text style={styles.timeRangeSeparator}>-</Text>
                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                        // Mostrar seletor de hora fim noite
                    }}
                >
                    <Text style={styles.timePickerLabel}>Hasta:</Text>
                    <Text style={styles.timePickerValue}>{pickupEveningEnd}</Text>
                </TouchableOpacity>
            </View>
        )}
    </>
)}
```

**Estados necessários:**
```javascript
const [pickupMorning, setPickupMorning] = useState(false);
const [pickupMorningStart, setPickupMorningStart] = useState('07:00');
const [pickupMorningEnd, setPickupMorningEnd] = useState('12:00');
const [pickupAfternoon, setPickupAfternoon] = useState(false);
const [pickupAfternoonStart, setPickupAfternoonStart] = useState('12:00');
const [pickupAfternoonEnd, setPickupAfternoonEnd] = useState('18:00');
const [pickupEvening, setPickupEvening] = useState(false);
const [pickupEveningStart, setPickupEveningStart] = useState('18:00');
const [pickupEveningEnd, setPickupEveningEnd] = useState('23:00');
```

### 4. Reorganizar containers - AddItemFormScreen e EditItemScreen

**Container 1: Precio y Descuentos**
```jsx
<View style={styles.card}>
    <Text style={styles.cardTitle}>💰 Precio</Text>
    {/* Precio por día */}
    {/* Depósito */}
    {/* Descuento 1 semana */}
    {/* Descuento 1 mes */}
</View>
```

**Container 2: Ubicación y Disponibilidad**
```jsx
<View style={styles.card}>
    <Text style={styles.cardTitle}>📍 Ubicación y Disponibilidad</Text>
    {/* Ubicación */}
    {/* Tipo de entrega */}
    {/* Disponibilidad de recogida */}
</View>
```

### 5. Remover "Datos del Contacto" de AddItemFormScreen e EditItemScreen

- Remover seção completa de fullName, phone, useProfileAddress
- Esses dados devem ser obrigatórios no cadastro (ProfileScreen)

### 6. RequestRentalScreen - Aplicar descontos

No cálculo do subtotal:
```javascript
const calculateSubtotal = () => {
    const days = calculateDays();
    let pricePerDay = parseFloat(item.price_per_day);
    
    // Aplicar desconto se aplicável
    if (days >= 30 && item.discount_month > 0) {
        pricePerDay = pricePerDay * (1 - item.discount_month / 100);
    } else if (days >= 7 && item.discount_week > 0) {
        pricePerDay = pricePerDay * (1 - item.discount_week / 100);
    }
    
    return pricePerDay * days;
};
```

### 7. MyAdsScreen - Mostrar preço sem taxa

Em MyAdsScreen.js, ao exibir preço:
```javascript
€{parseFloat(item.price_per_day).toFixed(2)}
// NÃO multiplicar por 1.18
```

## 📋 CHECKLIST FINAL:

- [ ] Executar SQL no Supabase (EXECUTAR_NO_SUPABASE.sql)
- [ ] Adicionar campos de desconto em AddItemFormScreen
- [ ] Adicionar campos de desconto em EditItemScreen
- [ ] Alterar horários para Manhã/Tarde/Noite
- [ ] Reorganizar containers (Precio + Ubicación/Disponibilidad)
- [ ] Remover Datos del Contacto
- [ ] Aplicar descontos em RequestRentalScreen
- [ ] Testar fluxo completo

## 🎯 ARQUIVOS A MODIFICAR:

1. AddItemFormScreen.js
2. EditItemScreen.js
3. RequestRentalScreen.js
4. MyAdsScreen.js (verificar preço)
5. ProfileScreen.js (tornar dados obrigatórios)


