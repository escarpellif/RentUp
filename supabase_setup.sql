-- ============================================
-- SCRIPT COMPLETO DE SETUP DO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELA PROFILES (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    rating_avg_locador NUMERIC DEFAULT 0,
    rating_avg_locatario NUMERIC DEFAULT 0
);

-- 2. HABILITAR RLS NA TABELA PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Perfis são visíveis para todos" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- 4. CRIAR POLÍTICAS PARA PROFILES
-- ============================================
CREATE POLICY "Perfis são visíveis para todos"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. CRIAR/RECRIAR FUNÇÃO QUE CRIA PERFIL AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, logamos mas não falhamos o cadastro do usuário
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 6. REMOVER TRIGGER ANTIGO E CRIAR NOVO
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. CRIAR PERFIS PARA USUÁRIOS EXISTENTES QUE NÃO TÊM PERFIL
-- ============================================
INSERT INTO public.profiles (id, username, full_name, created_at)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 8. VERIFICAR E CORRIGIR TABELA ITEMS
-- ============================================
-- Remover foreign key antiga se existir
ALTER TABLE IF EXISTS public.items
DROP CONSTRAINT IF EXISTS items_owner_id_fkey;

-- Recriar foreign key corretamente
ALTER TABLE IF EXISTS public.items
ADD CONSTRAINT items_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 9. VERIFICAR POLÍTICAS RLS DA TABELA ITEMS
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "Insert Items" ON public.items;
DROP POLICY IF EXISTS "See Items" ON public.items;
DROP POLICY IF EXISTS "Update Items" ON public.items;

-- Criar novas políticas
CREATE POLICY "Usuários autenticados podem inserir itens"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Todos podem ver itens disponíveis"
ON public.items FOR SELECT
USING (true);

CREATE POLICY "Donos podem atualizar seus itens"
ON public.items FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Donos podem deletar seus itens"
ON public.items FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 10. VERIFICAR ESTRUTURA DA TABELA ITEMS
-- ============================================
-- Se a tabela items não existir, cria ela
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_per_day NUMERIC NOT NULL,
    category TEXT,
    location TEXT,
    photo_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela items se não estiver habilitado
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 11. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_is_available ON public.items(is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 12. CONFIGURAR STORAGE BUCKET (item_photos)
-- ============================================
-- Nota: Execute este comando separadamente no Storage Policies se o bucket não existir

-- Para criar o bucket via SQL (pode não funcionar, melhor criar manualmente):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('item_photos', 'item_photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- 13. CRIAR POLÍTICAS PARA O STORAGE
-- ============================================
-- Permitir upload de fotos por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir que todos vejam as fotos
CREATE POLICY "Fotos são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'item_photos');

-- Permitir que donos deletem suas fotos
CREATE POLICY "Donos podem deletar suas fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para verificar se tudo está funcionando, execute:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.items;
-- SELECT * FROM auth.users;

