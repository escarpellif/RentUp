# ✅ CORREÇÃO - Erro ao buscar perfil (column profiles.street does not exist)

## 🐛 **ERRO IDENTIFICADO:**
```
ERROR  Erro ao buscar perfil: {
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column profiles.street does not exist"
}
```

**Causa:** A query estava tentando buscar colunas que não existem na tabela `profiles`.

---

## 🔍 **ESTRUTURA REAL DA TABELA PROFILES:**

A tabela `profiles` tem:
- ✅ `address` (VARCHAR) - endereço completo
- ✅ `postal_code` (VARCHAR) - código postal
- ✅ `city` (VARCHAR) - cidade

**NÃO TEM:**
- ❌ `street` (coluna específica)
- ❌ `complement` (complemento)
- ❌ `country` (país)

---

## ✅ **CORREÇÃO IMPLEMENTADA:**

### **1. Query corrigida no fetchUserProfile:**

**ANTES (ERRADO):**
```javascript
const { data, error } = await supabase
    .from('profiles')
    .select('street, complement, city, country, postal_code') // ❌ Colunas que não existem
    .eq('id', session.user.id)
    .single();
```

**DEPOIS (CORRETO):**
```javascript
const { data, error } = await supabase
    .from('profiles')
    .select('address, postal_code, city') // ✅ Colunas que existem
    .eq('id', session.user.id)
    .single();
```

---

### **2. Mapeamento de campos corrigido:**

**ANTES (ERRADO):**
```javascript
setStreet(userProfile.street || ''); // ❌ userProfile.street não existe
setComplement(userProfile.complement || ''); // ❌ userProfile.complement não existe
setCity(userProfile.city || '');
setCountry(userProfile.country || 'España'); // ❌ userProfile.country não existe
setPostalCode(userProfile.postal_code || '');
```

**DEPOIS (CORRETO):**
```javascript
// Mapear campos do profile para os campos do item
setStreet(userProfile.address || ''); // ✅ address -> street
setComplement(''); // ✅ profile não tem complement, deixar vazio
setCity(userProfile.city || ''); // ✅ OK
setCountry('España'); // ✅ profile não tem country, usar padrão
setPostalCode(userProfile.postal_code || ''); // ✅ OK
```

---

## 🔄 **MAPEAMENTO DE CAMPOS:**

| Campo no `profiles` | → | Campo no `items` | Observação |
|---------------------|---|------------------|------------|
| `address` | → | `street` | Endereço completo → Calle/Avenida |
| _não existe_ | → | `complement` | Deixar vazio para usuário preencher |
| `city` | → | `city` | Mapeamento direto |
| _não existe_ | → | `country` | Usar 'España' por padrão |
| `postal_code` | → | `postal_code` | Mapeamento direto |

---

## 📋 **FLUXO CORRIGIDO:**

### **Ao marcar "Usar mi dirección de cadastro":**

1. ✅ Sistema busca perfil: `address, postal_code, city`
2. ✅ Preenche campos do item:
   - **Calle/Avenida** = `address` do profile
   - **Complemento** = vazio (usuário pode preencher)
   - **Ciudad** = `city` do profile
   - **Código Postal** = `postal_code` do profile
   - **País** = 'España' (padrão)
3. ✅ Busca coordenadas via API
4. ✅ Usuário pode editar todos os campos

---

## 🗂️ **ESTRUTURA FINAL:**

### **Tabela `profiles`:**
```sql
- id (UUID)
- address (VARCHAR) ← endereço completo
- postal_code (VARCHAR)
- city (VARCHAR)
- ...outros campos
```

### **Tabela `items`:**
```sql
- id (UUID)
- street (VARCHAR) ← recebe 'address' do profile
- complement (VARCHAR) ← usuário preenche
- city (VARCHAR) ← recebe 'city' do profile
- country (VARCHAR) ← 'España' por padrão
- postal_code (VARCHAR) ← recebe 'postal_code' do profile
- ...outros campos
```

---

## 📁 **ARQUIVOS MODIFICADOS:**

| Arquivo | Mudança |
|---------|---------|
| `EditItemScreen.js` | ✅ Query corrigida: `address, postal_code, city`<br>✅ Mapeamento corrigido: `address → street`<br>✅ Valores padrão: `complement = ''`, `country = 'España'` |
| `EXECUTAR_NO_SUPABASE.sql` | ✅ Documentação sobre estrutura do profiles |

---

## ✅ **VALIDAÇÃO:**

**Query funcional:**
```javascript
// ✅ CORRETO - Busca apenas campos que existem
await supabase
    .from('profiles')
    .select('address, postal_code, city')
    .eq('id', session.user.id)
    .single();
```

**Resultado esperado:**
```javascript
{
  address: "Calle Gran Vía, 123",
  postal_code: "28001",
  city: "Madrid"
}
```

**Campos preenchidos no item:**
```javascript
street: "Calle Gran Vía, 123"      // ← address
complement: ""                      // ← vazio
city: "Madrid"                      // ← city
postal_code: "28001"               // ← postal_code
country: "España"                   // ← padrão
```

---

## 🎉 **ERRO RESOLVIDO!**

✅ Query usa campos corretos da tabela `profiles`  
✅ Mapeamento de `address` para `street`  
✅ Valores padrão para campos que não existem no profile  
✅ Checkbox funcionando corretamente  
✅ Todos os campos editáveis  

**PROBLEMA CORRIGIDO!** 🚀✨

