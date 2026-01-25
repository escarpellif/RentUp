#!/usr/bin/env bash
set -euo pipefail

# ALUKO - Script para limpar cache e reiniciar web

echo "🧹 Limpando cache do Metro bundler..."
echo ""

cd "$(dirname "$0")/.."

# Parar qualquer processo expo rodando
echo "⏹️  Parando processos Expo..."
pkill -f "expo start" || true
pkill -f "react-native start" || true

# Limpar caches
echo "🗑️  Removendo caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared

# Limpar cache do Metro
if command -v watchman &> /dev/null; then
    echo "🔄 Limpando Watchman..."
    watchman watch-del-all
fi

# Limpar cache do npm
echo "🧽 Limpando cache do npm..."
npm cache verify

echo ""
echo "✅ Cache limpo com sucesso!"
echo ""
echo "🚀 Agora execute:"
echo "   npm run web"
echo ""

