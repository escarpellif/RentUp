# 🔒 ANÁLISE DE SEGURANÇA - ALUKO

## Data: 20 de Janeiro de 2026

---

## ❓ AS PERGUNTAS CRÍTICAS

1. **Validação no backend (não confia no front, nunca)?**
2. **Tokens expiram?**
3. **Dados sensíveis não estão passeando em plain text?**

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. ❌ **CHAVES EXPOSTAS EM CÓDIGO** - CRÍTICO!

```javascript
// supabase.js (PÚBLICO!)
const supabaseUrl = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

```html
<!-- index.html (PÚBLICO!) -->
const supabaseUrl = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Problema:**
- ❌ Chaves hardcoded no código
- ❌ Expostas no repositório Git
- ❌ Qualquer pessoa pode ver (se repo for público)

**Risco:** 🔴 **CRÍTICO**

**Solução:**
- ✅ Usar variáveis de ambiente (.env)
- ✅ Adicionar .env ao .gitignore
- ✅ Nunca commitar chaves

---

### 2. ❌ **SEM POLÍTICAS RLS (Row Level Security)** - CRÍTICO!

**Arquivos SQL analisados:** 5 arquivos
**Políticas RLS encontradas:** 0 ❌

**Problema:**
- ❌ Sem Row Level Security nas tabelas
- ❌ Qualquer usuário pode acessar dados de outros
- ❌ Frontend = única barreira (INSEGURO!)

**Risco:** 🔴 **CRÍTICO**

**Impacto:**
```javascript
// Um usuário mal-intencionado pode fazer:
const { data } = await supabase
    .from('profiles')
    .select('*'); // ❌ Acessa TODOS os perfis!

const { data } = await supabase
    .from('rentals')
    .select('*'); // ❌ Acessa TODAS as locações!
```

**Solução:**
- ✅ Implementar RLS em TODAS as tabelas
- ✅ Políticas por usuário (auth.uid())
- ✅ Políticas de admin

---

### 3. ❌ **VALIDAÇÃO APENAS NO FRONTEND** - ALTO RISCO!

**Exemplo encontrado:**
```javascript
// DocumentVerificationScreen.js
if (!documentPhoto || !selfiePhoto) {
    Alert.alert('Error', 'Faltam fotos');
    return; // ❌ Validação SÓ no frontend!
}

// Envia para Supabase SEM validação backend
await supabase.from('user_verifications').insert({...});
```

**Problema:**
- ❌ Validação apenas no frontend
- ❌ Usuário pode burlar com API direta
- ❌ Sem validação de tipos/tamanhos no backend

**Risco:** 🟡 **ALTO**

---

### 4. ✅ **TOKENS EXPIRAM?** - SIM! (Parcialmente OK)

```javascript
// supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true, // ✅ Auto-refresh habilitado
        persistSession: true,    // ✅ Sessão persistida
    },
});
```

**JWT Token decodificado:**
```json
{
    "iss": "supabase",
    "ref": "fvhnkwxvxnsatqmljnxu",
    "role": "anon",
    "iat": 1762258079,
    "exp": 2077834079  // ⚠️ Expira em 2035! (10 anos!)
}
```

**Problema:**
- ⚠️ Token anon expira só em 2035 (muito tempo!)
- ✅ Tokens de sessão expiram (auto-refresh)
- ❌ Sem política de expiração customizada

**Risco:** 🟡 **MÉDIO**

---

### 5. ❌ **DADOS SENSÍVEIS EM PLAIN TEXT** - CRÍTICO!

**Encontrado:**

#### A) Senhas em Logs
```javascript
// AuthScreen.js (linha ~200)
console.log('Login:', email, password); // ❌ SENHA NO LOG!
```

#### B) Documentos sem criptografia
```javascript
// DocumentVerificationScreen.js
const fileName = `${Date.now()}.jpg`;
// Upload direto para bucket público ❌
await supabase.storage.from('item_photos').upload(fileName, file);
```

#### C) Dados pessoais expostos
```sql
-- Tabela profiles sem RLS
SELECT full_name, email, phone, address FROM profiles;
-- ❌ Qualquer um pode ver dados de todos!
```

**Risco:** 🔴 **CRÍTICO**

---

## 📊 SCORECARD DE SEGURANÇA

| Aspecto | Status | Nota | Prioridade |
|---------|--------|------|------------|
| **Chaves de API** | ❌ Expostas | 0/10 | 🔴 CRÍTICA |
| **Row Level Security** | ❌ Inexistente | 0/10 | 🔴 CRÍTICA |
| **Validação Backend** | ❌ Mínima | 2/10 | 🔴 CRÍTICA |
| **Tokens Expiram** | ⚠️ Parcial | 6/10 | 🟡 MÉDIA |
| **Dados Criptografados** | ❌ Não | 1/10 | 🔴 CRÍTICA |
| **Senha Segura** | ✅ Validação | 8/10 | 🟢 OK |
| **HTTPS** | ✅ Sim (Supabase) | 10/10 | 🟢 OK |

**NOTA GERAL: 3.8/10** 🔴 **INSEGURO PARA PRODUÇÃO**

---

## 🎯 VULNERABILIDADES EXPLORÁVEIS

### Vulnerabilidade 1: Acesso a Todos os Dados
```javascript
// Qualquer usuário pode executar:
const { data } = await supabase
    .from('profiles')
    .select('email, phone, address, full_name')
    .neq('id', 'meu-id'); // Pega TODOS os outros usuários!
```

**Impacto:** Roubo de dados pessoais de TODOS os usuários

---

### Vulnerabilidade 2: Modificar Dados de Outros
```javascript
// Usuário mal-intencionado:
await supabase
    .from('rentals')
    .update({ status: 'completed' })
    .eq('id', 'qualquer-id'); // ❌ Pode completar aluguel de outro!
```

**Impacto:** Fraude em transações

---

### Vulnerabilidade 3: Ver Documentos de Outros
```javascript
// Qualquer um pode ver verificações:
const { data } = await supabase
    .from('user_verifications')
    .select('document_photo_url, selfie_url')
    .limit(100); // ❌ Vê documentos de 100 pessoas!
```

**Impacto:** LGPD/GDPR violation - vazamento de documentos

---

### Vulnerabilidade 4: Burlar Verificação
```javascript
// Frontend valida se user.verification_status === 'approved'
// Mas usuário pode fazer via API:
await supabase
    .from('profiles')
    .update({ verification_status: 'approved' })
    .eq('id', 'meu-id'); // ❌ Se aprovar sem validação!
```

**Impacto:** Bypass de segurança

---

## ✅ O QUE ESTÁ BOM

### 1. ✅ Validação de Senha Forte
```javascript
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    // ✅ Requisitos fortes de senha
}
```

### 2. ✅ HTTPS Nativo do Supabase
```javascript
const supabaseUrl = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';
// ✅ Conexão sempre criptografada
```

### 3. ✅ Auto-refresh de Tokens
```javascript
auth: {
    autoRefreshToken: true, // ✅ Renovação automática
}
```

---

## 🔒 SOLUÇÕES OBRIGATÓRIAS

### PRIORIDADE 1 - CRÍTICA (Implementar AGORA)

#### 1. Variáveis de Ambiente
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://fvhnkwxvxnsatqmljnxu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# .gitignore
.env
.env.local
```

```javascript
// supabase.js (CORRETO)
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;
```

---

#### 2. Row Level Security (RLS)

**Profiles:**
```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuário vê apenas seu próprio perfil
CREATE POLICY "Usuários veem apenas próprio perfil"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política: Usuário atualiza apenas seu perfil
CREATE POLICY "Usuários atualizam apenas próprio perfil"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Política: Admin vê tudo
CREATE POLICY "Admin vê todos os perfis"
ON profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

**Rentals:**
```sql
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Ver locações onde é dono ou locatário
CREATE POLICY "Ver próprias locações"
ON rentals FOR SELECT
TO authenticated
USING (
    auth.uid() = owner_id OR 
    auth.uid() = renter_id
);

-- Criar locação apenas como renter
CREATE POLICY "Criar locação"
ON rentals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = renter_id);

-- Atualizar apenas se for dono
CREATE POLICY "Dono atualiza locação"
ON rentals FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);
```

**Items:**
```sql
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Todos veem itens ativos
CREATE POLICY "Ver itens ativos"
ON items FOR SELECT
TO authenticated
USING (is_active = true);

-- Criar apenas seus itens
CREATE POLICY "Criar próprio item"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Editar apenas seus itens
CREATE POLICY "Editar próprio item"
ON items FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);
```

**User Verifications:**
```sql
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Ver apenas própria verificação
CREATE POLICY "Ver própria verificação"
ON user_verifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar própria verificação
CREATE POLICY "Criar própria verificação"
ON user_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin vê e aprova tudo
CREATE POLICY "Admin gerencia verificações"
ON user_verifications FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

---

#### 3. Remover Logs de Dados Sensíveis

**ANTES (ERRADO):**
```javascript
console.log('Login:', email, password); // ❌ NUNCA!
```

**DEPOIS (CORRETO):**
```javascript
console.log('Login attempt for:', email); // ✅ Sem senha
// OU use Logger.info() que filtra dados sensíveis
```

---

### PRIORIDADE 2 - ALTA (Implementar em 1 semana)

#### 4. Validação Backend com Database Functions

```sql
-- Função para validar rental antes de criar
CREATE OR REPLACE FUNCTION validate_rental_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Não pode alugar próprio item
    IF NEW.renter_id = NEW.owner_id THEN
        RAISE EXCEPTION 'Não pode alugar próprio item';
    END IF;

    -- Item deve estar ativo
    IF NOT EXISTS (
        SELECT 1 FROM items 
        WHERE id = NEW.item_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Item não está disponível';
    END IF;

    -- Renter deve estar verificado
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.renter_id 
        AND verification_status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Usuário não verificado';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER validate_rental_before_insert
BEFORE INSERT ON rentals
FOR EACH ROW
EXECUTE FUNCTION validate_rental_creation();
```

---

#### 5. Bucket Privado para Documentos

```sql
-- Tornar bucket de documentos PRIVADO
UPDATE storage.buckets
SET public = false
WHERE id = 'verification_documents';

-- Política: Apenas dono vê seu documento
CREATE POLICY "Ver próprio documento"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Admin vê tudo
CREATE POLICY "Admin vê documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification_documents' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

---

### PRIORIDADE 3 - MÉDIA (Melhorias)

#### 6. Rate Limiting

```javascript
// Implementar no frontend
const loginAttempts = new Map();

async function checkRateLimit(email) {
    const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 300000) {
        throw new Error('Muitas tentativas. Aguarde 5 minutos.');
    }
    
    return true;
}
```

#### 7. Sanitização de Inputs

```javascript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

// Uso
const description = sanitizeInput(userInput);
```

---

## 📋 CHECKLIST DE SEGURANÇA

### Crítico (Fazer AGORA) 🔴
- [ ] Mover chaves para variáveis de ambiente
- [ ] Adicionar .env ao .gitignore
- [ ] Implementar RLS em profiles
- [ ] Implementar RLS em rentals
- [ ] Implementar RLS em items
- [ ] Implementar RLS em user_verifications
- [ ] Remover logs de senha
- [ ] Tornar bucket de documentos privado

### Alto (Fazer esta semana) 🟡
- [ ] Criar database functions de validação
- [ ] Implementar triggers de segurança
- [ ] Adicionar políticas de Storage
- [ ] Testar bypass de RLS
- [ ] Audit de queries SQL

### Médio (Fazer este mês) 🟢
- [ ] Rate limiting
- [ ] Sanitização de inputs
- [ ] Logs de auditoria
- [ ] Monitoramento de anomalias

---

## 🎯 IMPACTO DAS CORREÇÕES

### Antes (ATUAL) ❌
- 😱 Qualquer um acessa dados de todos
- 😱 Chaves expostas publicamente
- 😱 Sem validação backend
- 😱 Documentos públicos
- 😱 Dados em plain text nos logs

**Risco:** 🔴 **APP NÃO ESTÁ PRONTO PARA PRODUÇÃO**

---

### Depois (COM CORREÇÕES) ✅
- ✅ Cada usuário vê apenas seus dados
- ✅ Chaves protegidas
- ✅ Validação dupla (front + back)
- ✅ Documentos privados
- ✅ Logs limpos

**Risco:** 🟢 **APP SEGURO PARA PRODUÇÃO**

---

## 🚨 AÇÕES IMEDIATAS

### 1. EMERGÊNCIA - Se app já está em produção

```bash
# 1. Revogar chaves antigas
# 2. Gerar novas chaves no Supabase
# 3. Implementar RLS URGENTE
# 4. Auditar acessos recentes
```

### 2. Se ainda em desenvolvimento

```bash
# 1. Implementar soluções PRIORIDADE 1
# 2. Testar RLS
# 3. Depois fazer deploy
```

---

## 📚 REFERÊNCIAS

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [LGPD Compliance](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

**Status:** 🔴 **INSEGURO - AÇÃO IMEDIATA NECESSÁRIA**  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 2-3 dias para correções críticas

**Desenvolvedor:** GitHub Copilot  
**Data:** 20 de Janeiro de 2026  
**Versão:** 1.0 - Análise Completa de Segurança

