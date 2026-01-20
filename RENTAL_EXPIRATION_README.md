# Sistema de Expiração Automática de Solicitações

## 📋 Descrição

Este sistema expira automaticamente solicitações de aluguel (`rentals`) que não foram aprovadas até **30 minutos antes** do horário de retirada (`pickup_time`).

## 🎯 Funcionalidades

- ✅ Expira solicitações pendentes automaticamente
- ✅ Notifica o locatário (renter) sobre a expiração
- ✅ Notifica o locador (owner) sobre a expiração
- ✅ Move solicitações expiradas para o histórico
- ✅ Execução automática a cada 5 minutos (opcional com pg_cron)

## 📂 Arquivos Criados

### 1. `expire_pending_rentals_30min.sql`
Contém:
- Função `expire_pending_rentals()` - Lógica de expiração
- Trigger automático que executa após INSERT/UPDATE em rentals
- Configuração opcional do pg_cron para execução periódica
- Atualização do constraint de status para incluir 'expired'

## 🔧 Como Instalar

### Passo 1: Executar o SQL no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `expire_pending_rentals_30min.sql`
4. Execute o script (clique em RUN ou Ctrl/Cmd + Enter)

**⚠️ IMPORTANTE:** Se receber erro de sintaxe, certifique-se de que o arquivo foi atualizado (versão corrigida).

### Passo 2: Verificar se funcionou

**Opção A - Usando o script de teste:**
1. Copie o conteúdo de `test_expiration_system.sql`
2. Execute no SQL Editor
3. Verifique se todos os passos retornam resultados esperados

**Opção B - Manualmente:**

Execute no SQL Editor:
```sql
-- Testar manualmente a função
SELECT expire_pending_rentals();

-- Ver notificações criadas
SELECT * FROM user_notifications 
WHERE type = 'rental_expired' 
ORDER BY created_at DESC 
LIMIT 10;
```

## ⚙️ Métodos de Execução

O sistema oferece **2 métodos** para executar a verificação de expiração:

### Método 1: Trigger Automático (Padrão) ✅

**Já está configurado!** O trigger executa automaticamente quando:
- Uma nova solicitação é criada (INSERT)
- Uma solicitação é atualizada (UPDATE)

**Vantagens:**
- Não requer configuração adicional
- Funciona imediatamente
- Sem custos extras

**Desvantagens:**
- Só verifica quando há atividade em rentals

### Método 2: pg_cron (Recomendado para produção) ⭐

Executa a verificação **a cada 5 minutos**, independentemente de atividade.

**Como ativar:**

1. **Habilitar extensão pg_cron** no Supabase:
   ```
   Dashboard → Database → Extensions → Pesquisar "pg_cron" → Enable
   ```

2. **Executar no SQL Editor:**
   ```sql
   SELECT cron.schedule(
       'expire-pending-rentals',
       '*/5 * * * *',
       $$SELECT expire_pending_rentals();$$
   );
   ```

3. **Verificar se está agendado:**
   ```sql
   SELECT * FROM cron.job;
   ```

**Vantagens:**
- Execução garantida a cada 5 minutos
- Mais confiável para produção
- Não depende de atividade

**Para remover o job (se necessário):**
```sql
SELECT cron.unschedule('expire-pending-rentals');
```

## 🔍 Lógica de Expiração

Uma solicitação é expirada quando:

1. **Status = 'pending'** (ainda não aprovada)
2. **E** uma das condições:
   - Data de início (`start_date`) já passou
   - **OU** É hoje E faltam menos de 30 minutos para `pickup_time`

### Exemplos:

#### Exemplo 1: Data passada
- `start_date`: 14/01/2026
- Hoje: 15/01/2026
- ✅ **Expirado** (data já passou)

#### Exemplo 2: Hoje, mas passou o horário
- `start_date`: 15/01/2026
- `pickup_time`: 10:00
- Agora: 15/01/2026 09:31
- ✅ **Expirado** (faltam menos de 30min)

#### Exemplo 3: Ainda tem tempo
- `start_date`: 15/01/2026
- `pickup_time`: 10:00
- Agora: 15/01/2026 09:29
- ❌ **Não expira** (ainda faltam 31min)

## 📱 Notificações Enviadas

### Para o Locatário (Renter):
```
Título: Solicitud Expirada
Mensaje: Tu solicitud de alquiler para "[ITEM_TITLE]" expiró 
         porque no fue aprobada a tiempo.
```

### Para o Locador (Owner):
```
Título: Solicitud Expirada
Mensaje: La solicitud de alquiler de [RENTER_NAME] para 
         "[ITEM_TITLE]" expiró por no ser aprobada a tiempo.
```

## 🎨 Interface

As solicitações expiradas aparecem:

- ✅ Na aba **Historial** (MyRentalsScreen)
- ✅ Com badge **Expirado** (cor laranja)
- ✅ Nas notificações do usuário
- ✅ No painel admin (AdminRentalsScreen)

## 🧪 Testar Manualmente

Para testar se está funcionando:

1. **Criar uma solicitação de teste:**
   ```sql
   -- Criar solicitação que deve expirar (data passada)
   INSERT INTO rentals (
       item_id, renter_id, owner_id,
       start_date, end_date,
       pickup_time, return_time,
       total_days, price_per_day,
       total_amount, status
   ) VALUES (
       '[ITEM_ID]', '[RENTER_ID]', '[OWNER_ID]',
       CURRENT_DATE - INTERVAL '1 day',  -- Ontem
       CURRENT_DATE,
       '10:00', '10:00',
       1, 10.00, 10.00,
       'pending'
   );
   ```

2. **Executar função:**
   ```sql
   SELECT expire_pending_rentals();
   ```

3. **Verificar resultado:**
   ```sql
   -- Ver se status mudou
   SELECT id, status, start_date, pickup_time 
   FROM rentals 
   WHERE status = 'expired';
   
   -- Ver notificações geradas
   SELECT * FROM user_notifications 
   WHERE type = 'rental_expired' 
   ORDER BY created_at DESC;
   ```

## 📊 Monitoramento

### Ver rentals expirados:
```sql
SELECT 
    r.id,
    r.start_date,
    r.pickup_time,
    r.updated_at,
    i.title as item_title,
    owner.full_name as owner_name,
    renter.full_name as renter_name
FROM rentals r
JOIN items i ON r.item_id = i.id
JOIN profiles owner ON r.owner_id = owner.id
JOIN profiles renter ON r.renter_id = renter.id
WHERE r.status = 'expired'
ORDER BY r.updated_at DESC;
```

### Ver últimas execuções (com pg_cron):
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-pending-rentals')
ORDER BY start_time DESC 
LIMIT 10;
```

## 🔧 Troubleshooting

### Problema: Notificações não aparecem no app
- Verificar se a tabela `user_notifications` tem as notificações
- Verificar se o hook `useUserNotifications` está funcionando
- Verificar RLS (Row Level Security) da tabela

### Problema: Função não executa automaticamente
- Verificar se o trigger está ativo: `SELECT * FROM pg_trigger WHERE tgname = 'check_expired_rentals';`
- Se usar pg_cron: verificar se está habilitado e agendado

### Problema: "Status expired não permitido"
- Executar novamente a parte do script que atualiza o constraint:
  ```sql
  ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check;
  ALTER TABLE rentals ADD CONSTRAINT rentals_status_check 
      CHECK (status IN ('pending', 'approved', 'active', 'completed', 
                        'cancelled', 'rejected', 'expired', 'dispute_open'));
  ```

## 📝 Logs

O sistema gera logs no PostgreSQL:
```sql
-- Ver logs recentes
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%expire_pending_rentals%';
```

## 🚨 Importante

- ⚠️ O status 'expired' é **irreversível**
- ⚠️ Notificações são enviadas apenas uma vez
- ⚠️ Datas bloqueadas em `item_availability` permanecem (limpeza manual se necessário)

## 🎯 Próximos Passos (Opcional)

1. **Limpar datas bloqueadas** de rentals expirados:
   ```sql
   DELETE FROM item_availability 
   WHERE rental_id IN (
       SELECT id FROM rentals WHERE status = 'expired'
   );
   ```

2. **Adicionar logs detalhados** em tabela separada

3. **Criar painel admin** para visualizar expirations

## ✅ Checklist de Instalação

- [ ] Script SQL executado no Supabase
- [ ] Constraint de status atualizado (inclui 'expired')
- [ ] Trigger criado e ativo
- [ ] (Opcional) pg_cron habilitado e agendado
- [ ] Teste manual executado com sucesso
- [ ] Notificações aparecendo no app
- [ ] Traduções adicionadas (es.js e en.js)
- [ ] Estilos atualizados (MyRentalsScreen)

---

**Sistema implementado com sucesso!** 🎉

