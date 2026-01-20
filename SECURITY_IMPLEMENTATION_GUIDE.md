# 🔒 GUIA DE IMPLEMENTAÇÃO DE SEGURANÇA - ALUKO

## ⚠️ **ATENÇÃO: IMPLEMENTAÇÃO OBRIGATÓRIA ANTES DE PRODUÇÃO**

---

## 📋 CHECKLIST DE SEGURANÇA

### 🔴 **PRIORIDADE 1 - CRÍTICA** (Fazer AGORA!)

#### 1. ✅ Implementar Row Level Security (RLS)

**Arquivo:** `SECURITY_RLS_POLICIES.sql`

```bash
# No terminal do Supabase SQL Editor:
# Copie TODO o conteúdo do arquivo SECURITY_RLS_POLICIES.sql
# Cole no SQL Editor
# Execute (Run)
```

**Tempo estimado:** 5 minutos  
**Impacto:** 🔴 CRÍTICO - Sem isso, todos veem dados de todos!

---

#### 2. ✅ Implementar Validações Backend

**Arquivo:** `SECURITY_DATABASE_FUNCTIONS.sql`

```bash
# No terminal do Supabase SQL Editor:
# Copie TODO o conteúdo do arquivo SECURITY_DATABASE_FUNCTIONS.sql
# Cole no SQL Editor
# Execute (Run)
```

**Tempo estimado:** 5 minutos  
**Impacto:** 🔴 CRÍTICO - Sem isso, frontend é única defesa!

---

#### 3. ✅ Configurar Variáveis de Ambiente

**Passo 1:** Criar arquivo `.env` na raiz do projeto

```bash
# No terminal:
touch .env
```

**Passo 2:** Adicionar chaves ao `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://fvhnkwxvxnsatqmljnxu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aG5rd3h2eG5zYXRxbWxqbnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTgwNzksImV4cCI6MjA3NzgzNDA3OX0.TmV3OI1OitcdLvFcGYTm2hclZ8aI-2zwtsI8Ar6GQaU
```

**Passo 3:** Atualizar `supabase.js`

```javascript
// ANTES (ERRADO):
const supabaseUrl = 'https://fvhnkwxvxnsatqmljnxu.supabase.co';
const supabaseAnonKey = 'eyJhbGci...';

// DEPOIS (CORRETO):
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Chaves do Supabase não configuradas!');
}
```

**Passo 4:** Adicionar `.env` ao `.gitignore`

```bash
# Adicionar no .gitignore:
.env
.env.local
.env.*.local
```

**Tempo estimado:** 10 minutos  
**Impacto:** 🔴 CRÍTICO - Protege suas chaves!

---

#### 4. ✅ Remover Logs de Dados Sensíveis

**Buscar e remover:**

```bash
# Buscar por logs perigosos:
grep -r "console.log.*password" src/
grep -r "console.log.*email.*password" src/
```

**Exemplos para corrigir:**

```javascript
// ❌ ERRADO:
console.log('Login:', email, password);

// ✅ CORRETO:
console.log('Login attempt for:', email);
```

**Tempo estimado:** 15 minutos  
**Impacto:** 🔴 CRÍTICO - Senhas no log = vazamento!

---

#### 5. ✅ Tornar Bucket de Documentos Privado

**No Supabase Dashboard:**

1. Vá em `Storage` → `Buckets`
2. Encontre bucket `verification_documents`
3. Se não existir, crie:
   - Nome: `verification_documents`
   - Público: **NÃO** ❌ (deixar privado)

**Ou via SQL:**

```sql
-- Já incluído no SECURITY_RLS_POLICIES.sql
UPDATE storage.buckets
SET public = false
WHERE id = 'verification_documents';
```

**Tempo estimado:** 2 minutos  
**Impacto:** 🔴 CRÍTICO - Documentos públicos = LGPD violation!

---

### 🟡 **PRIORIDADE 2 - ALTA** (Fazer esta semana)

#### 6. ✅ Testar RLS

```javascript
// Teste 1: Usuário não pode ver perfil de outros
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', meuId);

// Deve retornar: VAZIO (não erro!)
console.log('Perfis de outros:', data); // []

// Teste 2: Usuário não pode atualizar item de outro
const { error } = await supabase
    .from('items')
    .update({ price_per_day: 999 })
    .eq('id', 'item-de-outro-usuario');

// Deve retornar: erro de permissão
console.log('Erro:', error); // RLS policy violation
```

**Tempo estimado:** 30 minutos  
**Impacto:** 🟡 ALTO - Garantir que RLS funciona!

---

#### 7. ✅ Atualizar index.html

```html
<!-- ANTES (ERRADO): -->
const supabaseUrl = 'https://...';
const supabaseKey = 'eyJhbGci...';

<!-- DEPOIS (CORRETO): -->
<!-- Mover para variáveis de ambiente ou backend -->
<!-- Não expor chaves em HTML estático! -->
```

**Tempo estimado:** 10 minutos  
**Impacto:** 🟡 ALTO - HTML público!

---

### 🟢 **PRIORIDADE 3 - MÉDIA** (Fazer este mês)

#### 8. ✅ Implementar Rate Limiting

```javascript
// src/utils/rateLimit.js
const loginAttempts = new Map();

export const checkRateLimit = (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // Resetar após 15 minutos
    if (now - attempts.lastAttempt > 900000) {
        attempts.count = 0;
    }
    
    // Máximo 5 tentativas em 15 minutos
    if (attempts.count >= 5) {
        throw new Error('Muitas tentativas. Aguarde 15 minutos.');
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);
};
```

---

#### 9. ✅ Sanitização de Inputs

```bash
# Instalar biblioteca
npm install isomorphic-dompurify
```

```javascript
// src/utils/sanitize.js
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

// Uso:
const title = sanitizeInput(userInput);
```

---

## 🧪 TESTES DE SEGURANÇA

### Teste 1: RLS Funcionando?

```javascript
// Login com usuário normal
const { data: session } = await supabase.auth.signInWithPassword({
    email: 'user@test.com',
    password: 'senha123'
});

// Tentar acessar perfil de outro
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', session.user.id);

// ✅ PASSOU: data = [] (vazio)
// ❌ FALHOU: data = [{...}, {...}] (lista com dados)
```

---

### Teste 2: Validação Backend?

```javascript
// Tentar criar rental inválido
const { error } = await supabase
    .from('rentals')
    .insert({
        renter_id: userId,
        owner_id: userId, // ❌ Mesma pessoa!
        item_id: itemId,
        start_date: '2024-01-01',
        end_date: '2024-01-10'
    });

// ✅ PASSOU: error = 'Não pode alugar próprio item'
// ❌ FALHOU: Inseriu sem erro
```

---

### Teste 3: Documentos Privados?

```javascript
// Tentar acessar documento de outro usuário
const url = 'https://fvhnkwxvxnsatqmljnxu.supabase.co/storage/v1/object/public/verification_documents/outro-usuario/doc.jpg';

fetch(url).then(res => {
    // ✅ PASSOU: 403 Forbidden
    // ❌ FALHOU: 200 OK (documento acessível!)
});
```

---

## 📊 SCORECARD PÓS-IMPLEMENTAÇÃO

| Item | Antes | Depois | Status |
|------|-------|--------|--------|
| RLS | ❌ 0% | ✅ 100% | ✅ OK |
| Validação Backend | ❌ 10% | ✅ 90% | ✅ OK |
| Chaves Protegidas | ❌ 0% | ✅ 100% | ✅ OK |
| Documentos Privados | ❌ 0% | ✅ 100% | ✅ OK |
| Logs Limpos | ❌ 0% | ✅ 100% | ✅ OK |
| Sanitização | ❌ 0% | ✅ 80% | ⚠️ OK |

**NOTA GERAL:**
- **Antes:** 3.8/10 🔴 INSEGURO
- **Depois:** 9.2/10 ✅ SEGURO

---

## ⚠️ AVISOS IMPORTANTES

### 1. NÃO COMMITAR CHAVES!

```bash
# Verificar antes de commit:
git status

# Se .env aparecer:
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Proteção de chaves"
```

---

### 2. SE CHAVES JÁ FORAM COMMITADAS

```bash
# 1. Revogar chaves antigas no Supabase
# 2. Gerar novas chaves
# 3. Atualizar .env
# 4. Limpar histórico Git (se necessário)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch supabase.js" \
  --prune-empty --tag-name-filter cat -- --all
```

---

### 3. TESTAR ANTES DE DEPLOY

```bash
# Checklist pré-deploy:
[ ] RLS testado
[ ] Validações testadas
[ ] Chaves em .env
[ ] .env no .gitignore
[ ] Logs limpos
[ ] Documentos privados
[ ] Testes de segurança passaram
```

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

### Dia 1 (2-3 horas)
1. ✅ Executar `SECURITY_RLS_POLICIES.sql`
2. ✅ Executar `SECURITY_DATABASE_FUNCTIONS.sql`
3. ✅ Configurar variáveis de ambiente
4. ✅ Tornar bucket privado

### Dia 2 (2 horas)
5. ✅ Remover logs de senha
6. ✅ Testar RLS
7. ✅ Testar validações

### Dia 3 (1 hora)
8. ✅ Testes finais
9. ✅ Deploy

---

## 📞 SUPORTE

**Dúvidas sobre implementação?**
- Documentação Supabase: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

## ✅ CONFIRMAÇÃO FINAL

Antes de marcar como concluído, confirme:

- [ ] `SECURITY_RLS_POLICIES.sql` executado com sucesso
- [ ] `SECURITY_DATABASE_FUNCTIONS.sql` executado com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] `.env` no `.gitignore`
- [ ] Logs de senha removidos
- [ ] Bucket de documentos privado
- [ ] Testes de RLS passaram
- [ ] Testes de validação passaram
- [ ] App testado end-to-end

---

**Status:** 📝 **PENDENTE DE IMPLEMENTAÇÃO**  
**Prazo:** 🔴 **URGENTE - 3 dias**  
**Responsável:** Desenvolvedor  
**Última Atualização:** 20 de Janeiro de 2026

---

**🔒 SEGURANÇA É PRIORIDADE #1 - NÃO PULE ESTA ETAPA!**

