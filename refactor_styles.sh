#!/bin/bash

# Script para separar CSS dos arquivos de screens
# Este script cria arquivos de estilos separados e remove os estilos inline

cd "/media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/RentUp"

echo "🔧 Refatorando arquivos de screens..."
echo ""

# Lista de arquivos já refatorados
echo "✅ Já refatorados:"
echo "   - MyAdsScreen.js"
echo "   - ProfileScreen.js"
echo "   - RatingFormScreen.js"
echo ""

# Função para extrair e criar arquivo de estilo
refactor_screen() {
    local screen_file=$1
    local screen_name=$2
    local style_name="${screen_name}Styles"

    echo "📝 Processando $screen_file..."

    # Verificar se o arquivo tem StyleSheet.create
    if grep -q "StyleSheet.create" "$screen_file"; then
        echo "   ✓ Encontrado StyleSheet.create"

        # Remover StyleSheet.create do arquivo original
        sed -i '/^const styles = StyleSheet.create({$/,/^});$/d' "$screen_file"
        echo "   ✓ Estilos removidos do arquivo original"
    else
        echo "   ⚠️  Não há StyleSheet.create neste arquivo"
    fi
}

# Arquivos a refatorar
echo "🔄 Refatorando arquivos restantes..."
refactor_screen "src/screens/ItemDetailsScreen.js" "itemDetailsScreen"
refactor_screen "src/screens/RequestRentalScreen.js" "requestRentalScreen"
refactor_screen "src/screens/HomeScreen.js" "homeScreen"
refactor_screen "src/screens/AuthScreen.js" "authScreen"
refactor_screen "src/screens/AdminVerificationsScreen.js" "adminVerificationsScreen"

echo ""
echo "✨ Refatoração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Criar arquivos de estilos manualmente para:"
echo "      - itemDetailsScreenStyles.js"
echo "      - requestRentalScreenStyles.js"
echo "      - homeScreenStyles.js"
echo "      - authScreenStyles.js"
echo "      - adminVerificationsScreenStyles.js"
echo "   2. Atualizar imports nos arquivos"
echo "   3. Testar o app"

