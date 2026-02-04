# 📱 Guia Completo: Testando o App no Android Studio

## 🎯 Opções para Testar no Android

Você tem **3 opções principais**:

---

## ✅ OPÇÃO 1: Expo Development Client (RECOMENDADO)

Esta é a melhor opção para desenvolvimento com Expo!

### Passo 1: Iniciar o Expo no modo de desenvolvimento
```bash
npx expo start
```

### Passo 2: Pressione 'a' no terminal para Android
Ou use o comando direto:
```bash
npm run android
```

**O que acontece:**
- O Expo compila o app nativamente
- Instala automaticamente no emulador ou dispositivo
- Abre seu app com hot-reload

### ⚠️ IMPORTANTE: Não use `npx expo start --android`
Use `npm run android` ou `npx expo run:android` ao invés disso.

### Troubleshooting:
Se der erro, limpe o cache:
```bash
npx expo start -c
```

Ou limpe tudo e reinstale:
```bash
rm -rf node_modules android ios
npm install
npm run android
```

---

## ✅ OPÇÃO 2: Pré-compilar e Abrir no Android Studio

Se você quer controle total e usar o Android Studio diretamente:

### Passo 1: Gerar arquivos nativos Android
```bash
npx expo prebuild --platform android
```

Isso cria a pasta `android/` com todos os arquivos nativos.

### Passo 2: Abrir no Android Studio
1. Abra o Android Studio
2. Clique em "Open Project"
3. Navegue até: `/media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko/android`
4. Aguarde o Gradle Sync completar

### Passo 3: Configurar o Emulador
1. No Android Studio, clique em "Device Manager"
2. Crie um AVD (Android Virtual Device) se não tiver
3. Recomendado: Pixel 5 com Android 13 (API 33)

### Passo 4: Executar
1. No Android Studio, clique no botão "Run" (▶️)
2. Ou use o comando:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## ✅ OPÇÃO 3: Build de Desenvolvimento com EAS

Para testar uma build real sem Android Studio:

### Passo 1: Criar build de desenvolvimento
```bash
npx eas build --platform android --profile development --local
```

### Passo 2: Instalar o APK
O comando acima gera um APK que você pode instalar diretamente:
```bash
adb install build-*.apk
```

---

## 🔧 Configuração do Ambiente Android

### Verificar se está tudo configurado:
```bash
# Verificar se o Android SDK está instalado
echo $ANDROID_HOME

# Listar emuladores disponíveis
emulator -list-avds

# Verificar dispositivos conectados
adb devices
```

### Se não estiver configurado, adicione ao ~/.bashrc:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Depois execute:
```bash
source ~/.bashrc
```

---

## 🚀 Comandos Rápidos

### Iniciar emulador via linha de comando:
```bash
# Listar emuladores
emulator -list-avds

# Iniciar um emulador específico
emulator -avd Pixel_5_API_33 &

# Ou deixar o Android Studio fazer isso
```

### Limpar cache e reinstalar:
```bash
# Limpar cache do Expo
npx expo start -c

# Limpar cache do Metro
npx react-native start --reset-cache

# Limpar node_modules e reinstalar
rm -rf node_modules
npm install
```

### Desinstalar app do emulador:
```bash
adb uninstall com.aluko.app
```

---

## 🐛 Resolução de Problemas Comuns

### Erro: "window is not defined"
✅ **RESOLVIDO** - Corrigimos os arquivos `.web.js`

### Erro: "react-native-maps" no web
✅ **RESOLVIDO** - Criamos versões `.web.js` dos componentes

### Emulador não detectado:
```bash
# Reiniciar adb
adb kill-server
adb start-server

# Verificar conexão
adb devices
```

### Gradle sync falha:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

### App não abre no emulador:
1. Verifique se o emulador está rodando: `adb devices`
2. Tente reinstalar: `adb uninstall com.aluko.app`
3. Limpe o cache: `npx expo start -c`

---

## 📝 Notas Importantes

1. **Expo Go vs Development Client:**
   - Expo Go: Para projetos simples sem módulos nativos customizados
   - Development Client: Para projetos com expo-dev-client (seu caso)

2. **Você JÁ tem expo-dev-client instalado:**
   ```json
   "expo-dev-client": "~6.0.20"
   ```

3. **Para testar no dispositivo físico:**
   - Conecte via USB
   - Ative "Depuração USB" nas opções de desenvolvedor
   - Execute `adb devices` para verificar
   - Use `npx expo start --android`

4. **Arquivos .web.js:**
   - Criamos versões web de componentes nativos
   - Isso permite rodar `npx expo start --web` sem erros
   - Mas para Android, use `npx expo start --android`

---

## ✨ Recomendação Final

**Para desenvolvimento diário, use:**
```bash
npm run android
# ou
npx expo run:android
```

**Para iniciar o Metro Bundler apenas:**
```bash
npx expo start
# Depois pressione 'a' para Android
```

**Para testar builds de produção:**
```bash
npx eas build --platform android --profile preview
```

**⚠️ NÃO USE:**
```bash
npx expo start --android  # ❌ Isso causa erro de package.json
```
