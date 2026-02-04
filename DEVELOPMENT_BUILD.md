# 🔧 Solução: Development Build Necessário

## ❌ O Erro que Você Está Vendo

```
CommandError: No development build (com.aluko.app) for this project is installed.
```

**O que significa:**
Seu projeto usa `expo-dev-client`, que requer uma build de desenvolvimento customizada ao invés do Expo Go.

---

## ✅ Solução: 2 Opções

### OPÇÃO 1: Build Local (MAIS RÁPIDO - Recomendado)

Este método cria o APK diretamente no seu computador.

#### Passo 1: Gerar arquivos nativos Android
```bash
source ~/.bashrc
npx expo prebuild --platform android
```

#### Passo 2: Build e instalar no emulador
```bash
# Certifique-se que o emulador está rodando
adb devices

# Build e instalar
cd android
./gradlew installDebug
cd ..
```

#### Passo 3: Iniciar o Metro Bundler
```bash
npx expo start --dev-client
```

**Tempo estimado:** 5-10 minutos (primeira vez)

---

### OPÇÃO 2: Build com EAS (Cloud Build)

Este método usa os servidores do Expo para criar a build.

#### Passo 1: Fazer login no Expo
```bash
source ~/.bashrc
npx eas login
```

#### Passo 2: Criar a build de desenvolvimento
```bash
npx eas build --platform android --profile development --local
```

**OU para build na nuvem:**
```bash
npx eas build --platform android --profile development
```

#### Passo 3: Instalar o APK no emulador
```bash
# Se fez build local, o APK estará em uma pasta local
adb install <caminho-do-apk>

# Se fez build na nuvem, baixe o APK e instale
```

#### Passo 4: Iniciar o Metro
```bash
npx expo start --dev-client
```

**Tempo estimado:** 10-20 minutos

---

## 🎯 RECOMENDAÇÃO: Use Build Local (Mais Rápido)

Vou criar um script que faz tudo automaticamente:

```bash
./build-and-run.sh
```

Este script vai:
1. ✅ Gerar arquivos nativos Android
2. ✅ Fazer build do APK
3. ✅ Instalar no emulador
4. ✅ Iniciar o Metro Bundler
5. ✅ Abrir o app

---

## 📋 Passo a Passo Detalhado (Manual)

### 1. Certifique-se que o emulador está rodando
```bash
adb devices
# Deve mostrar: emulator-5554   device
```

### 2. Gerar arquivos nativos (prebuild)
```bash
source ~/.bashrc
npx expo prebuild --platform android
```

**O que isso faz:**
- Cria a pasta `android/` com código nativo
- Configura o projeto para desenvolvimento

### 3. Navegar para a pasta android
```bash
cd android
```

### 4. Fazer build e instalar
```bash
# Build de debug e instalar automaticamente
./gradlew installDebug

# OU apenas build (sem instalar)
./gradlew assembleDebug
```

### 5. Voltar para a raiz do projeto
```bash
cd ..
```

### 6. Iniciar o Metro com dev-client
```bash
npx expo start --dev-client
```

### 7. Aguardar o app abrir no emulador
O app deve abrir automaticamente!

---

## 🐛 Resolução de Problemas

### "gradlew: command not found"
```bash
cd android
chmod +x gradlew
./gradlew installDebug
```

### "ANDROID_HOME not set"
```bash
source ~/.bashrc
# Ou
export ANDROID_HOME=$HOME/Android/Sdk
```

### Build falha com erro de dependências
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean --platform android
```

### "Multiple dex files define..."
```bash
cd android
./gradlew clean
rm -rf .gradle
rm -rf build
cd ..
```

### Emulador não detecta o app
```bash
# Desinstalar se já estiver instalado
adb uninstall com.aluko.app

# Reinstalar
cd android
./gradlew installDebug
cd ..
```

---

## 💡 Depois da Primeira Build

**Boa notícia:** Você só precisa fazer a build uma vez!

Depois disso:
```bash
# Apenas inicie o Metro
npx expo start --dev-client

# O app já estará instalado no emulador
```

Você só precisa rebuildar se:
- Adicionar novas dependências nativas
- Mudar configurações no `app.config.js`
- Atualizar módulos nativos

---

## 🚀 Workflow Completo

### Primeira Vez (Setup):
```bash
# 1. Prebuild
npx expo prebuild --platform android

# 2. Build & Instalar
cd android
./gradlew installDebug
cd ..

# 3. Iniciar Metro
npx expo start --dev-client
```

### Desenvolvimento Diário:
```bash
# Apenas inicie o Metro!
npx expo start --dev-client

# O app já está instalado, vai abrir automaticamente
```

---

## 📝 Comandos Úteis

### Ver builds instalados no emulador
```bash
adb shell pm list packages | grep aluko
```

### Desinstalar app do emulador
```bash
adb uninstall com.aluko.app
```

### Limpar build do Android
```bash
cd android
./gradlew clean
cd ..
```

### Rebuild completo
```bash
npx expo prebuild --clean --platform android
cd android
./gradlew installDebug
cd ..
```

---

## 🎬 PRÓXIMOS PASSOS AGORA

Execute este comando para fazer tudo automaticamente:

```bash
source ~/.bashrc
npx expo prebuild --platform android && \
cd android && \
./gradlew installDebug && \
cd .. && \
npx expo start --dev-client
```

**OU use o script:**
```bash
./build-and-run.sh
```

Aguarde 5-10 minutos e seu app estará rodando! 🚀
