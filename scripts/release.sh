#!/usr/bin/env bash
set -euo pipefail

# ALUKO Release Script
# Usage: ./scripts/release.sh [patch|minor|major]
#
# Este script automatiza o processo de release:
# 1. Valida que está na branch main
# 2. Executa lint e testes
# 3. Faz bump da versão
# 4. Cria tag e push
# 5. Inicia builds EAS

BUMP_TYPE=${1:-patch}
VALID_TYPES=("patch" "minor" "major")

echo "🚀 ALUKO Release Script"
echo "======================="
echo ""

# Validar tipo de bump
if [[ ! " ${VALID_TYPES[@]} " =~ " ${BUMP_TYPE} " ]]; then
  echo "❌ Tipo de versão inválido: $BUMP_TYPE"
  echo "Use: patch, minor ou major"
  exit 1
fi

# 1. Verificar branch
echo "📋 Verificando branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Erro: Execute este script na branch 'main'"
  echo "   Branch atual: $CURRENT_BRANCH"
  exit 1
fi
echo "✅ Branch: main"
echo ""

# 2. Verificar status git
echo "📋 Verificando status do git..."
if [[ -n $(git status -s) ]]; then
  echo "❌ Existem mudanças não commitadas:"
  git status -s
  echo ""
  echo "Por favor, commite ou descarte as mudanças antes de fazer release."
  exit 1
fi
echo "✅ Working directory limpo"
echo ""

# 3. Pull latest changes
echo "📥 Atualizando branch main..."
git pull origin main
echo "✅ Branch atualizada"
echo ""

# 4. Run lint
echo "🔍 Executando lint..."
if npm run lint; then
  echo "✅ Lint passou"
else
  echo "❌ Lint falhou. Corrija os erros antes de continuar."
  exit 1
fi
echo ""

# 5. Run tests (quando implementado)
if grep -q '"test"' package.json; then
  echo "🧪 Executando testes..."
  if npm test; then
    echo "✅ Testes passaram"
  else
    echo "❌ Testes falharam. Corrija antes de continuar."
    exit 1
  fi
  echo ""
else
  echo "⚠️  Nenhum teste configurado (adicione 'npm test' ao package.json)"
  echo ""
fi

# 6. Bump version
echo "📦 Fazendo bump de versão: $BUMP_TYPE"
npm version "$BUMP_TYPE" -m "chore(release): v%s"
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Nova versão: v$NEW_VERSION"
echo ""

# 7. Push com tags
echo "📤 Enviando mudanças e tags para o repositório..."
git push origin main --follow-tags
echo "✅ Push concluído"
echo ""

# 8. Verificar configurações antes do build
echo "⚙️  Verificações finais antes do build:"
echo ""
echo "📱 Verificar em app.json/app.config.js:"
echo "   - android.package: definido?"
echo "   - android.versionCode: será incrementado automaticamente"
echo "   - ios.bundleIdentifier: definido?"
echo "   - ios.buildNumber: será incrementado automaticamente"
echo "   - name, slug, description, privacy, icon, splash"
echo ""
read -p "Pressione ENTER para continuar ou Ctrl+C para cancelar..."

# 9. Verificar login EAS
echo ""
echo "🔐 Verificando autenticação EAS..."
if ! eas whoami &> /dev/null; then
  echo "❌ Você não está logado no EAS"
  echo "Execute: eas login"
  exit 1
fi
echo "✅ Autenticado no EAS"
echo ""

# 10. Iniciar builds
echo "🏗️  Iniciando builds EAS (production)..."
echo ""
echo "Plataformas: Android + iOS"
echo "Perfil: production"
echo ""
read -p "Confirmar início dos builds? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Build cancelado pelo usuário"
  exit 1
fi

eas build --platform all --profile production --non-interactive

echo ""
echo "🎉 Release v$NEW_VERSION iniciado com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Aguarde os builds finalizarem (eas build:list)"
echo "   2. Teste os builds em dispositivos reais"
echo "   3. Quando aprovado, faça submit:"
echo "      - Android: eas submit --platform android --latest"
echo "      - iOS: eas submit --platform ios --latest"
echo "   4. Complete as informações nas lojas (Play Store / App Store)"
echo "   5. Publique para produção!"
echo ""
echo "📚 Ver docs/STORE_PUBLISHING.md para mais detalhes"
echo ""

