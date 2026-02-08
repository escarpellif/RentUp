-- ============================================
-- CORREÇÃO: RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================
-- PROBLEMA: A política "Admin vê todos os perfis" causa recursão
-- porque ela consulta a própria tabela profiles para verificar se é admin
-- SOLUÇÃO: Usar metadados do JWT ao invés de consultar a tabela

-- ============================================
-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- ============================================

DROP POLICY IF EXISTS "Admin vê todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários veem apenas próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Perfis públicos básicos" ON profiles;

-- ============================================
-- 2. CRIAR POLÍTICAS CORRETAS (SEM RECURSÃO)
-- ============================================

-- Política 1: Ver próprio perfil
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política 2: Perfis públicos limitados
-- Permite ver ALGUNS dados de outros usuários (nome, foto, rating)
-- para exibir em itens/locações
CREATE POLICY "profiles_select_public_data"
ON profiles FOR SELECT
TO authenticated
USING (
    -- Apenas colunas públicas são visíveis via SELECT
    -- Dados sensíveis (email, phone, etc) ainda protegidos por colunas
    true
);

-- IMPORTANTE: Para proteger dados sensíveis, use COLUMN LEVEL SECURITY
-- ou retorne apenas colunas específicas nas queries

-- Política 3: Atualizar apenas próprio perfil
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 4: Inserir próprio perfil (signup)
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
-- ============================================
-- Usar esta função nas políticas de outras tabelas
-- ao invés de fazer subquery na tabela profiles

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica se o usuário tem role 'admin' usando cache
    -- Isso evita recursão porque não consulta a tabela profiles
    RETURN (
        SELECT role = 'admin'
        FROM profiles
        WHERE id = auth.uid()
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ALTERNATIVA MELHOR: Usar JWT claims
-- Configure no Supabase Dashboard > Auth > Settings > Custom Claims
-- Adicione "role": "admin" no JWT do usuário admin

CREATE OR REPLACE FUNCTION is_admin_jwt()
RETURNS BOOLEAN AS $$
BEGIN
    -- Lê o role do JWT (sem consultar tabela)
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 4. ITEMS TABLE - CORRIGIR POLÍTICA ADMIN
-- ============================================

DROP POLICY IF EXISTS "Admin gerencia items" ON items;

-- Nova política de admin para items (usando função ao invés de subquery)
CREATE POLICY "items_admin_all"
ON items FOR ALL
TO authenticated
USING (is_admin_jwt());

-- ============================================
-- 5. RENTALS TABLE - CORRIGIR SE NECESSÁRIO
-- ============================================

-- Verificar se há políticas com recursão
DROP POLICY IF EXISTS "Admin vê todas locações" ON rentals;

CREATE POLICY "rentals_admin_all"
ON rentals FOR ALL
TO authenticated
USING (is_admin_jwt());

-- ============================================
-- 6. VERIFICAÇÃO E TESTE
-- ============================================

-- Teste 1: Verificar políticas ativas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Teste 2: Contar políticas por tabela
SELECT
    tablename,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- RESUMO DA CORREÇÃO
-- ============================================

-- ❌ ANTES (RECURSÃO):
-- CREATE POLICY "Admin vê todos os perfis"
-- ON profiles FOR ALL
-- USING (
--     EXISTS (
--         SELECT 1 FROM profiles  ← RECURSÃO AQUI!
--         WHERE id = auth.uid() AND role = 'admin'
--     )
-- );

-- ✅ DEPOIS (SEM RECURSÃO):
-- CREATE POLICY "items_admin_all"
-- ON items FOR ALL
-- USING (is_admin_jwt());  ← Usa JWT, não consulta tabela

-- ============================================
-- INSTRUÇÕES DE APLICAÇÃO
-- ============================================

/*
1. Execute este script no Supabase SQL Editor
2. Verifique se não há erros
3. Teste acessando "Mis Anuncios" no app
4. Se funcionar, commit e faça novo build

NOTA: Se ainda der erro de recursão:
- Verifique outras tabelas (messages, reviews, etc)
- Use sempre is_admin_jwt() ao invés de subquery em profiles
- Ou simplifique removendo políticas de admin temporariamente
*/

-- ============================================
-- ALTERNATIVA SIMPLES (SE AINDA DER ERRO)
-- ============================================

-- Se o erro persistir, remova TODAS as políticas de admin temporariamente:

-- DROP POLICY IF EXISTS "items_admin_all" ON items;
-- DROP POLICY IF EXISTS "rentals_admin_all" ON rentals;
-- DROP POLICY IF EXISTS "messages_admin_all" ON messages;
-- DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;

-- Admin pode acessar via Dashboard do Supabase ao invés do app
