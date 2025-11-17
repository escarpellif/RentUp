-- Corrigir políticas RLS da tabela user_notifications
-- Permitir que usuários autenticados criem notificações para outros usuários

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Usuários podem criar notificações para outros" ON user_notifications;
DROP POLICY IF EXISTS "Users can create notifications for others" ON user_notifications;
DROP POLICY IF EXISTS "Usuários podem inserir notificações" ON user_notifications;

-- Criar política que permite usuários autenticados criarem notificações para qualquer usuário
CREATE POLICY "Usuários autenticados podem criar notificações"
    ON user_notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy para usuários verem apenas suas próprias notificações
DROP POLICY IF EXISTS "Usuários veem suas notificações" ON user_notifications;
CREATE POLICY "Usuários veem suas notificações"
    ON user_notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Policy para usuários atualizarem apenas suas próprias notificações (marcar como lida)
DROP POLICY IF EXISTS "Usuários atualizam suas notificações" ON user_notifications;
CREATE POLICY "Usuários atualizam suas notificações"
    ON user_notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verificar se RLS está ativo
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_notifications';

