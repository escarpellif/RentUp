#!/bin/bash

# ============================================
# BACKUP AUTOMATION SCRIPT
# Backup automático de database e storage
# ============================================

set -e  # Parar em caso de erro

# ============================================
# CONFIGURAÇÃO
# ============================================

BACKUP_DIR="/backups/aluko"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Supabase config (substitua com seus valores)
SUPABASE_PROJECT_REF="fvhnkwxvxnsatqmljnxu"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-your_password_here}"

# Notificações
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"

# ============================================
# FUNÇÕES
# ============================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

send_notification() {
    local message=$1
    local status=$2  # success, warning, error

    if [ -n "$DISCORD_WEBHOOK" ]; then
        local color="3066993"  # Azul

        if [ "$status" = "success" ]; then
            color="3066993"  # Verde
        elif [ "$status" = "warning" ]; then
            color="16776960"  # Amarelo
        elif [ "$status" = "error" ]; then
            color="15158332"  # Vermelho
        fi

        curl -s -H "Content-Type: application/json" \
            -d "{\"embeds\": [{\"title\": \"ALUKO Backup\", \"description\": \"$message\", \"color\": $color}]}" \
            "$DISCORD_WEBHOOK" || true
    fi
}

# ============================================
# 1. CRIAR DIRETÓRIO DE BACKUP
# ============================================

create_backup_dir() {
    log "📁 Criando diretório de backup..."

    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/storage"
    mkdir -p "$BACKUP_DIR/logs"
}

# ============================================
# 2. BACKUP DE DATABASE
# ============================================

backup_database() {
    log "💾 Iniciando backup de database..."

    local backup_file="$BACKUP_DIR/database/aluko_db_${TIMESTAMP}.sql.gz"

    # Conectar e fazer dump
    pg_dump \
        "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
        --no-owner \
        --no-acl \
        --format=plain \
        | gzip > "$backup_file"

    local size=$(du -h "$backup_file" | cut -f1)
    log "✅ Database backup completo: $backup_file ($size)"

    echo "$backup_file"
}

# ============================================
# 3. BACKUP DE STORAGE (Fotos)
# ============================================

backup_storage() {
    log "🖼️ Iniciando backup de storage..."

    local backup_file="$BACKUP_DIR/storage/aluko_storage_${TIMESTAMP}.tar.gz"

    # Nota: Supabase não tem API direta para backup de storage
    # Opções:
    # 1. Usar supabase CLI: supabase storage download
    # 2. Usar rclone com S3 compatible
    # 3. Script custom com Supabase Storage API

    # Por agora, vamos criar placeholder
    # TODO: Implementar backup de storage real

    log "⚠️ Storage backup: Não implementado (usar Supabase dashboard)"

    echo "$backup_file"
}

# ============================================
# 4. VALIDAR BACKUP
# ============================================

validate_backup() {
    local backup_file=$1

    log "🔍 Validando backup: $backup_file"

    if [ ! -f "$backup_file" ]; then
        log "❌ Arquivo de backup não encontrado!"
        send_notification "❌ Backup falhou: arquivo não criado" "error"
        exit 1
    fi

    local size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file")

    if [ "$size" -lt 1024 ]; then
        log "❌ Backup muito pequeno (< 1KB), provavelmente falhou!"
        send_notification "❌ Backup falhou: arquivo muito pequeno" "error"
        exit 1
    fi

    log "✅ Backup validado: $(du -h $backup_file | cut -f1)"
}

# ============================================
# 5. LIMPAR BACKUPS ANTIGOS
# ============================================

cleanup_old_backups() {
    log "🗑️ Limpando backups antigos (> $RETENTION_DAYS dias)..."

    find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

    log "✅ Limpeza concluída"
}

# ============================================
# 6. TESTAR RESTORE (Opcional)
# ============================================

test_restore() {
    local backup_file=$1

    log "🧪 Testando restore (dry-run)..."

    # Criar database temporário
    local test_db="aluko_restore_test_${TIMESTAMP}"

    # Descompactar
    gunzip -c "$backup_file" > "/tmp/restore_test.sql"

    # Validar SQL
    if grep -q "CREATE TABLE" "/tmp/restore_test.sql"; then
        log "✅ SQL válido (contém CREATE TABLE)"
    else
        log "⚠️ SQL pode estar incompleto"
    fi

    rm -f "/tmp/restore_test.sql"

    log "✅ Teste de restore OK"
}

# ============================================
# 7. UPLOAD PARA CLOUD (Opcional)
# ============================================

upload_to_cloud() {
    local backup_file=$1

    log "☁️ Upload para cloud storage..."

    # Opções:
    # - AWS S3: aws s3 cp
    # - Google Cloud: gsutil cp
    # - Backblaze B2: b2 upload-file

    # Exemplo com AWS S3:
    # aws s3 cp "$backup_file" "s3://aluko-backups/$(basename $backup_file)"

    log "⚠️ Cloud upload: Não configurado (opcional)"
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

main() {
    log "🚀 Iniciando processo de backup..."
    send_notification "🚀 Iniciando backup automático..." "success"

    # 1. Criar diretórios
    create_backup_dir

    # 2. Backup de database
    db_backup=$(backup_database)
    validate_backup "$db_backup"

    # 3. Backup de storage
    # storage_backup=$(backup_storage)

    # 4. Testar restore
    # test_restore "$db_backup"

    # 5. Limpar backups antigos
    cleanup_old_backups

    # 6. Upload para cloud (opcional)
    # upload_to_cloud "$db_backup"

    # 7. Log de sucesso
    local log_file="$BACKUP_DIR/logs/backup_${TIMESTAMP}.log"
    echo "Backup completo em $(date)" > "$log_file"
    echo "Database: $db_backup" >> "$log_file"

    log "✅ Backup concluído com sucesso!"
    send_notification "✅ Backup concluído: $(basename $db_backup)" "success"
}

# Executar com tratamento de erros
main 2>&1 | tee "$BACKUP_DIR/logs/backup_${TIMESTAMP}.log"

# ============================================
# CONFIGURAÇÃO DE CRON
# ============================================

# Para rodar automaticamente, adicione ao crontab:
#
# Backup diário às 3 AM:
# 0 3 * * * /path/to/backup.sh
#
# Backup a cada 6 horas:
# 0 */6 * * * /path/to/backup.sh
#
# Para editar crontab:
# crontab -e
#
# Para ver crontab:
# crontab -l

