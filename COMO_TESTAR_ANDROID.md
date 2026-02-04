# 📱 Como Testar seu App no Android - GUIA RÁPIDO

## ✅ PROBLEMA RESOLVIDO

O erro `ConfigError: The expected package.json path: /android/package.json does not exist` foi causado por usar o comando incorreto.

---

## 🚀 SOLUÇÃO: Use o Comando Correto

### ❌ NUNCA USE:
```bash
npx expo start --android  # ❌ ERRADO - causa erro de package.json
```

### ✅ USE SEMPRE:
```bash
npm run android
# ou
npx expo run:android
```

---

## 📋 Passo a Passo Completo

### 1️⃣ Inicie o emulador Android (se não estiver rodando)

```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar o emulador (substitua pelo nome do seu)
emulator -avd Medium_Phone_API_36.1 &

# Verificar se está conectado
adb devices
```

### 2️⃣ Compile e instale o app

```bash
npm run android
```

**O que acontece:**
1. O Expo gera a pasta `android/` automaticamente
2. Compila o projeto Android nativo
3. Instala o APK no emulador
4. Abre o app automaticamente
5. Inicia o Metro Bundler para hot-reload

### 3️⃣ Aguarde a compilação

A primeira vez pode levar 5-10 minutos. Compilações subsequentes são mais rápidas.

---

## 🔧 Comandos Úteis

### Limpar cache e recompilar:
```bash
npx expo start -c
# Depois pressione 'a' para Android
```

### Limpar TUDO e recomeçar:
```bash
rm -rf node_modules android ios
npm install
npm run android
```

### Ver dispositivos conectados:
```bash
adb devices
```

### Desinstalar app do emulador:
```bash
adb uninstall com.aluko.app
```

### Reiniciar adb:
```bash
adb kill-server
adb start-server
```

---

## 🎯 Seus Emuladores Disponíveis

Você tem o seguinte emulador configurado:
- **Medium_Phone_API_36.1** (Android 14 / API 36)

---

## 📝 Notas Importantes

1. **Não tente abrir o projeto diretamente no Android Studio**
   - O Android Studio não consegue executar projetos Expo diretamente
   - Use sempre `npm run android`

2. **Se quiser usar o Android Studio para debug:**
   ```bash
   # Primeiro compile via Expo
   npm run android
   
   # Depois você pode anexar o debugger no Android Studio
   # File > Profile or Debug APK > Selecione o APK gerado
   ```

3. **A pasta `android/` é temporária:**
   - Ela é gerada automaticamente pelo Expo
   - Você pode deletá-la com segurança: `rm -rf android/`
   - Ela será recriada na próxima vez que rodar `npm run android`

4. **Para testar no dispositivo físico:**
   - Conecte via USB
   - Ative "Depuração USB" nas opções de desenvolvedor
   - Execute `adb devices` para verificar
   - Execute `npm run android`

---

## 🐛 Troubleshooting

### Erro: "SDK location not found"
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

### Erro: "Daemon not running"
```bash
adb kill-server
adb start-server
```

### Erro: "Task :app:installDebug FAILED"
```bash
# Desinstale o app primeiro
adb uninstall com.aluko.app

# Tente novamente
npm run android
```

### Emulador não inicia:
```bash
# Verifique se há outro emulador rodando
adb devices

# Mate processos do emulador
pkill -9 qemu-system

# Inicie novamente
emulator -avd Medium_Phone_API_36.1
```

---

## ✨ Processo Atual Rodando

🚀 **O app está sendo compilado agora!**

Aguarde alguns minutos. O processo vai:
1. ✅ Gerar a pasta `android/` automaticamente
2. ⏳ Baixar dependências do Gradle (primeira vez é lento)
3. ⏳ Compilar o código nativo Android
4. ⏳ Instalar o APK no emulador
5. ✅ Abrir o app automaticamente

**Tempo estimado:** 5-10 minutos na primeira vez

---

## 📞 Próximos Passos

Depois que o app compilar e abrir:

1. **Teste as funcionalidades principais**
2. **Veja o hot-reload funcionando** (edite qualquer arquivo e salve)
3. **Use o menu de desenvolvedor** (pressione 'd' no terminal do Expo)

**Para iOS (quando necessário):**
```bash
npm run ios  # Requer macOS e Xcode
```

**Para build de produção:**
```bash
npx eas build --platform android --profile production
```
