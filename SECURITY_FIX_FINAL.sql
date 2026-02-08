-- ============================================
-- CORREÇÃO DEFINITIVA DE SEGURANÇA
-- Execute no Supabase SQL Editor
-- ============================================

-- IMPORTANTE: Este script remove as views problemáticas permanentemente
-- As views recent_flag_changes e active_features DEVEM ser removidas
-- pois usam SECURITY DEFINER (vulnerabilidade de segurança)

-- 1. FORÇAR REMOÇÃO DAS VIEWS (mesmo que tenham dependências)
DROP VIEW IF EXISTS public.recent_flag_changes CASCADE;
DROP VIEW IF EXISTS public.active_features CASCADE;

-- 2. Verificar se foram removidas
SELECT 'Views removidas com sucesso!' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN ('recent_flag_changes', 'active_features')
);

-- 3. Habilitar RLS em audit_log se ainda não estiver
DO $$
BEGIN
    -- Verificar se RLS já está habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'audit_log'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado em audit_log';
    ELSE
        RAISE NOTICE 'RLS já estava habilitado em audit_log';
    END IF;
END $$;

-- 4. Criar políticas básicas se não existirem
DO $$
BEGIN
    -- Política para INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'audit_log'
        AND policyname = 'Allow authenticated users to insert'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert"
        ON public.audit_log
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    -- Política para SELECT (usuários veem apenas seus próprios logs)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'audit_log'
        AND policyname = 'Users can view own logs'
    ) THEN
        CREATE POLICY "Users can view own logs"
        ON public.audit_log
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. VERIFICAÇÃO FINAL
SELECT
    'audit_log' as tabela,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'audit_log';

-- Listar políticas criadas
SELECT
    policyname as politica,
    cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'audit_log';

-- Mensagem final
SELECT '✅ TODAS as correções de segurança foram aplicadas!' as resultado;
