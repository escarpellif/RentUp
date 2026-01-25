#!/usr/bin/env python3
"""
Script Automatizado de Refatoração de Estilos - ALUKO
Separa StyleSheet.create dos componentes/screens para arquivos dedicados
"""

import os
import re
import sys
from pathlib import Path

# Cores para output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

# Diretórios
PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"
COMPONENTS_DIR = SRC_DIR / "components"
SCREENS_DIR = SRC_DIR / "screens"
STYLES_DIR = SRC_DIR / "styles"
STYLES_COMPONENTS_DIR = STYLES_DIR / "components"
STYLES_SCREENS_DIR = STYLES_DIR / "screens"

def extract_stylesheet(content):
    """Extrai o bloco de StyleSheet.create"""
    # Padrão para encontrar StyleSheet.create
    pattern = r'const\s+(\w+)\s*=\s*StyleSheet\.create\s*\(\s*\{(.*?)\}\s*\)\s*;'
    match = re.search(pattern, content, re.DOTALL)

    if match:
        style_var_name = match.group(1)
        styles_content = match.group(2)
        return style_var_name, styles_content.strip(), match.group(0)
    return None, None, None

def get_required_imports(styles_content):
    """Detecta imports necessários baseado no conteúdo dos estilos"""
    imports = ['StyleSheet']

    if 'Platform' in styles_content:
        imports.append('Platform')
    if 'Dimensions' in styles_content:
        imports.append('Dimensions')
    if 'PixelRatio' in styles_content:
        imports.append('PixelRatio')

    return imports

def create_styles_file(file_path, file_type, styles_var_name, styles_content):
    """Cria arquivo de estilos separado"""
    # Nome do arquivo
    file_name = file_path.stem  # sem extensão

    # Remover sufixos comuns
    style_name = file_name.replace('Screen', '').replace('Modal', '').replace('Component', '')

    # CamelCase para camelCase
    export_name = style_name[0].lower() + style_name[1:] + 'Styles'

    # Caminho do arquivo de estilos
    if file_type == 'component':
        style_file_path = STYLES_COMPONENTS_DIR / f"{export_name}.js"
    else:  # screen
        style_file_path = STYLES_SCREENS_DIR / f"{export_name}.js"

    # Detectar imports necessários
    imports = get_required_imports(styles_content)
    import_line = f"import {{ {', '.join(imports)} }} from 'react-native';"

    # Verificar se usa constantes de tema
    uses_theme = any(keyword in styles_content for keyword in ['Colors', 'Spacing', 'FontSizes', 'BorderRadius', 'Shadows', 'FontWeights'])

    theme_import = ""
    if uses_theme:
        theme_import = "import { Colors, Spacing, FontSizes, BorderRadius, Shadows, FontWeights } from '../constants/theme';\n"

    # Conteúdo do arquivo
    content = f"""{import_line}
{theme_import}
export const {export_name} = StyleSheet.create({{
{styles_content}
}});
"""

    # Criar diretório se não existir
    style_file_path.parent.mkdir(parents=True, exist_ok=True)

    # Escrever arquivo
    with open(style_file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print_success(f"Criado: {style_file_path.relative_to(PROJECT_ROOT)}")

    return export_name, style_file_path.relative_to(SRC_DIR)

def update_source_file(file_path, old_style_var_name, new_import_name, styles_import_path, full_stylesheet_block):
    """Atualiza arquivo fonte removendo estilos e adicionando import"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remover bloco de StyleSheet.create
    content = content.replace(full_stylesheet_block, '')

    # Adicionar import de estilos
    import_statement = f"import {{ {new_import_name} }} from '../{styles_import_path.as_posix().replace('.js', '')}';\n"

    # Encontrar onde inserir o import (após outros imports)
    import_pattern = r"(import\s+.*?from\s+['\"].*?['\"];?\n)"
    imports = re.findall(import_pattern, content)

    if imports:
        last_import = imports[-1]
        content = content.replace(last_import, last_import + import_statement)
    else:
        # Se não encontrou imports, adicionar no início
        content = import_statement + content

    # Substituir referências ao estilo antigo pelo novo
    if old_style_var_name != new_import_name:
        # Substituir styles.X por newName.X
        content = re.sub(
            rf'\b{old_style_var_name}\.',
            f'{new_import_name}.',
            content
        )

    # Remover import de StyleSheet se não for mais usado
    if 'StyleSheet.create' not in content and 'StyleSheet' in content:
        # Verificar se StyleSheet está sendo usado de outra forma
        if not re.search(r'StyleSheet\.(flatten|compose|absoluteFill)', content):
            content = re.sub(
                r"import\s+\{([^}]*?)StyleSheet([^}]*?)\}\s+from\s+['\"]react-native['\"];?\n",
                lambda m: f"import {{{m.group(1).strip().rstrip(',')}{m.group(2)}}} from 'react-native';\n" if m.group(1).strip() or m.group(2).strip() else '',
                content
            )

    # Escrever arquivo atualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print_success(f"Atualizado: {file_path.relative_to(PROJECT_ROOT)}")

def refactor_file(file_path, file_type):
    """Refatora um arquivo"""
    print_info(f"Processando: {file_path.name}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Verificar se tem StyleSheet.create
        if 'StyleSheet.create' not in content:
            print_warning(f"Sem StyleSheet.create em {file_path.name}")
            return False

        # Extrair estilos
        old_var_name, styles_content, full_block = extract_stylesheet(content)

        if not styles_content:
            print_warning(f"Não foi possível extrair estilos de {file_path.name}")
            return False

        # Criar arquivo de estilos
        new_import_name, styles_path = create_styles_file(
            file_path, file_type, old_var_name, styles_content
        )

        # Atualizar arquivo fonte
        update_source_file(file_path, old_var_name, new_import_name, styles_path, full_block)

        return True

    except Exception as e:
        print_error(f"Erro ao processar {file_path.name}: {str(e)}")
        return False

def refactor_directory(directory, file_type):
    """Refatora todos os arquivos em um diretório"""
    files = list(directory.glob("*.js"))
    total = len(files)
    success = 0
    skipped = 0
    errors = 0

    print_header(f"Refatorando {file_type}s ({total} arquivos)")

    for file_path in files:
        result = refactor_file(file_path, file_type)
        if result:
            success += 1
        elif result is False:
            errors += 1
        else:
            skipped += 1

    print(f"\n{Colors.BOLD}Resumo:{Colors.END}")
    print_success(f"{success} arquivos refatorados")
    print_warning(f"{skipped} arquivos pulados")
    if errors > 0:
        print_error(f"{errors} erros")

    return success, skipped, errors

def verify_refactoring():
    """Verifica se ainda existem estilos inline"""
    print_header("Verificando Refatoração")

    remaining = []

    for directory in [COMPONENTS_DIR, SCREENS_DIR]:
        if directory.exists():
            for file_path in directory.glob("*.js"):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'StyleSheet.create' in content:
                        remaining.append(file_path.relative_to(PROJECT_ROOT))

    if remaining:
        print_warning(f"Ainda existem {len(remaining)} arquivos com estilos inline:")
        for file in remaining:
            print(f"   - {file}")
        return False
    else:
        print_success("Todos os estilos foram separados com sucesso!")
        return True

def main():
    print_header("🎨 ALUKO - Refatoração Automatizada de Estilos")

    # Verificar se está na raiz do projeto
    if not SRC_DIR.exists():
        print_error("Diretório src/ não encontrado!")
        print_info("Execute este script da raiz do projeto")
        sys.exit(1)

    # Criar diretórios de estilos se não existirem
    STYLES_COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
    STYLES_SCREENS_DIR.mkdir(parents=True, exist_ok=True)

    total_success = 0
    total_skipped = 0
    total_errors = 0

    # Refatorar componentes
    if COMPONENTS_DIR.exists():
        success, skipped, errors = refactor_directory(COMPONENTS_DIR, 'component')
        total_success += success
        total_skipped += skipped
        total_errors += errors

    # Refatorar screens
    if SCREENS_DIR.exists():
        success, skipped, errors = refactor_directory(SCREENS_DIR, 'screen')
        total_success += success
        total_skipped += skipped
        total_errors += errors

    # Verificar resultado
    print_header("Verificação Final")
    all_good = verify_refactoring()

    # Resumo final
    print_header("Resumo Final")
    print(f"{Colors.BOLD}Total de arquivos processados:{Colors.END}")
    print_success(f"{total_success} refatorados com sucesso")
    print_warning(f"{total_skipped} pulados (sem estilos inline)")
    if total_errors > 0:
        print_error(f"{total_errors} erros")

    if all_good:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Refatoração completa!{Colors.END}")
        print_info("Próximos passos:")
        print("   1. Testar o app: npm start")
        print("   2. Executar lint: npm run lint")
        print("   3. Commit: git add . && git commit -m 'refactor: separar estilos'")
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Refatoração parcial{Colors.END}")
        print_warning("Alguns arquivos ainda têm estilos inline")
        print_info("Revise os arquivos listados acima")

if __name__ == "__main__":
    main()

