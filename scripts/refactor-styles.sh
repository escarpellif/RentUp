#!/usr/bin/env bash
set -euo pipefail

# ALUKO - Script de Refatoração de Estilos
# Wrapper para o script Python

cd "$(dirname "$0")/.."

echo "🎨 ALUKO - Refatoração de Estilos"
echo "=================================="
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    echo "Instale Python 3 e tente novamente"
    exit 1
fi

# Fazer backup antes de refatorar
echo "📦 Criando backup..."
git add -A
if git diff --cached --quiet; then
    echo "✅ Nada para fazer backup (working directory limpo)"
else
    echo "⚠️  Existem mudanças não commitadas"
    read -p "Fazer commit de backup antes de continuar? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "backup: antes de refatorar estilos"
        echo "✅ Backup commitado"
    else
        echo "⚠️  Continuando sem backup..."
    fi
fi

echo ""
echo "🚀 Iniciando refatoração..."
echo ""

# Executar script Python
python3 scripts/refactor-styles-auto.py

echo ""
echo "✅ Script concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Revise as mudanças: git diff"
echo "   2. Teste o app: npm start"
echo "   3. Execute o lint: npm run lint"
echo "   4. Se tudo OK, commite: git add . && git commit -m 'refactor: separar estilos em arquivos dedicados'"
echo ""

