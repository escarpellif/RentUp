#!/usr/bin/env python3
"""
Script para extrair estilos de arquivos de screens e criar arquivos separados
Automatiza a refatoração de separação CSS/Código
"""

import re
import os
from pathlib import Path

# Configuração
BASE_DIR = Path("/media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/RentUp")
SCREENS_DIR = BASE_DIR / "src/screens"
STYLES_DIR = BASE_DIR / "src/styles/screens"

# Arquivos a processar (já refatorados serão ignorados)
SCREENS_TO_REFACTOR = [
    "HomeScreen.js",
    "AuthScreen.js",
    "ItemDetailsScreen.js",
    "RequestRentalScreen.js",
    "AdminVerificationsScreen.js",
    "AddItemFormScreen.js",
    "EditItemScreen.js",
    "EditProfileScreen.js",
]

def extract_styles(content):
    """Extrai o bloco de StyleSheet.create"""
    pattern = r'const styles = StyleSheet\.create\({(.*?)}\);'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def get_required_imports(styles_content):
    """Detecta quais imports são necessários para os estilos"""
    imports = ["StyleSheet"]

    if "Platform.OS" in styles_content:
        imports.append("Platform")
    if "StatusBar.currentHeight" in styles_content:
        imports.append("StatusBar")

    return imports

def create_styles_file(screen_name, styles_content):
    """Cria arquivo de estilos separado"""
    # Nome do arquivo de estilos
    style_name = screen_name.replace("Screen", "").replace(".js", "")
    style_file = f"{style_name[0].lower()}{style_name[1:]}ScreenStyles.js"
    style_path = STYLES_DIR / style_file

    # Detectar imports necessários
    imports = get_required_imports(styles_content)
    import_line = f"import {{ {', '.join(imports)} }} from 'react-native';"

    # Criar conteúdo do arquivo
    export_name = f"{style_name[0].lower()}{style_name[1:]}ScreenStyles"

    content = f"""{import_line}

export const {export_name} = StyleSheet.create({{
{styles_content}
}});
"""

    # Criar diretório se não existir
    STYLES_DIR.mkdir(parents=True, exist_ok=True)

    # Escrever arquivo
    with open(style_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Criado: {style_file}")
    return export_name, style_file

def update_screen_file(screen_path, export_name, style_file):
    """Atualiza arquivo de screen removendo estilos e atualizando imports"""
    with open(screen_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remover StyleSheet dos imports
    content = re.sub(r',?\s*StyleSheet', '', content)
    content = re.sub(r'StyleSheet,?\s*', '', content)

    # Remover Platform e StatusBar se só usados em estilos
    # (verificação simplificada - pode precisar ajuste manual)

    # Adicionar import do arquivo de estilos
    import_line = f"import {{ {export_name} as styles }} from '../styles/screens/{style_file}';"

    # Encontrar onde adicionar o import (após outros imports)
    import_pattern = r"(import .*?;)\n(?!import)"
    match = re.search(import_pattern, content, re.DOTALL)
    if match:
        insert_pos = match.end()
        content = content[:insert_pos] + "\n" + import_line + content[insert_pos:]

    # Remover bloco de StyleSheet.create
    content = re.sub(r'\nconst styles = StyleSheet\.create\({.*?}\);', '', content, flags=re.DOTALL)

    # Escrever arquivo atualizado
    with open(screen_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Atualizado: {screen_path.name}")

def main():
    print("🔧 Iniciando refatoração automática...")
    print(f"📁 Diretório: {SCREENS_DIR}")
    print()

    processed = 0
    skipped = 0

    for screen_file in SCREENS_TO_REFACTOR:
        screen_path = SCREENS_DIR / screen_file

        if not screen_path.exists():
            print(f"⚠️  Arquivo não encontrado: {screen_file}")
            skipped += 1
            continue

        print(f"📝 Processando: {screen_file}")

        # Ler conteúdo
        with open(screen_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Verificar se tem StyleSheet.create
        if 'StyleSheet.create' not in content:
            print(f"   ℹ️  Já refatorado ou sem estilos")
            skipped += 1
            continue

        # Extrair estilos
        styles = extract_styles(content)
        if not styles:
            print(f"   ⚠️  Não foi possível extrair estilos")
            skipped += 1
            continue

        # Criar arquivo de estilos
        export_name, style_file_name = create_styles_file(screen_file, styles)

        # Atualizar arquivo de screen
        update_screen_file(screen_path, export_name, style_file_name)

        processed += 1
        print()

    print("=" * 50)
    print(f"✨ Refatoração concluída!")
    print(f"   Processados: {processed}")
    print(f"   Ignorados: {skipped}")
    print(f"   Total: {processed + skipped}")
    print()
    print("⚠️  IMPORTANTE: Teste o app após a refatoração!")

if __name__ == "__main__":
    main()

