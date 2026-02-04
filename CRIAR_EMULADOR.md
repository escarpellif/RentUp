# 🎯 CRIAR EMULADOR ANDROID - Guia Passo a Passo

## ⚠️ IMPORTANTE: Você precisa criar um emulador primeiro!

O Android SDK está instalado, mas você ainda não tem nenhum emulador configurado.

---

## 🚀 Método 1: Usando Android Studio (MAIS FÁCIL)

### Passo a Passo:

1. **Abra o Android Studio**

2. **Vá para o Device Manager:**
   - Clique em "More Actions" (três pontos)
   - Selecione "Virtual Device Manager"

3. **Crie um novo dispositivo:**
   - Clique no botão "+" ou "Create Device"

4. **Selecione o Hardware:**
   - Recomendado: **Pixel 5** ou **Pixel 6**
   - Clique em "Next"

5. **Selecione a Imagem do Sistema:**
   - Recomendado: **API 33 (Android 13.0 - Tiramisu)**
   - Tipo: **Google APIs** ou **Google Play**
   - Clique em "Download" se necessário
   - Clique em "Next"

6. **Configure o AVD:**
   - Nome: `Pixel_5_API_33` (ou outro de sua preferência)
   - Ajuste RAM se necessário (recomendado: 2048 MB)
   - Clique em "Finish"

7. **Iniciar o Emulador:**
   - Clique no botão ▶️ ao lado do emulador criado
   - Aguarde ele carregar (pode demorar 1-2 minutos na primeira vez)

---

## 🔧 Método 2: Linha de Comando

Se preferir criar via terminal:

### 1. Verificar imagens disponíveis:
```bash
source ~/.bashrc
sdkmanager --list | grep system-images
```

### 2. Instalar imagem do sistema (se necessário):
```bash
sdkmanager "system-images;android-33;google_apis_playstore;x86_64"
```

### 3. Criar o AVD:
```bash
avdmanager create avd \
  -n Pixel_5_API_33 \
  -k "system-images;android-33;google_apis_playstore;x86_64" \
  -d pixel_5
```

### 4. Listar emuladores criados:
```bash
emulator -list-avds
```

### 5. Iniciar o emulador:
```bash
emulator -avd Pixel_5_API_33 &
```

---

## ✅ Verificar se o Emulador está Rodando

```bash
adb devices
```

Deve aparecer algo como:
```
List of devices attached
emulator-5554   device
```

---

## 🎯 Depois de Criar o Emulador

### 1. Execute o script de verificação:
```bash
./setup-android-env.sh
```

### 2. Inicie seu app:
```bash
./start-android.sh
```

---

## 📊 Especificações Recomendadas

| Item | Recomendação | Mínimo |
|------|--------------|---------|
| **Dispositivo** | Pixel 5 ou Pixel 6 | Qualquer |
| **Android API** | 33 (Android 13) | 29 (Android 10) |
| **Tipo de Imagem** | Google Play | Google APIs |
| **RAM** | 2048 MB | 1024 MB |
| **Armazenamento** | 2048 MB | 800 MB |

---

## 🐛 Problemas Comuns

### Emulador muito lento
- Certifique-se que a virtualização está habilitada na BIOS (Intel VT-x ou AMD-V)
- Aumente a RAM do emulador
- Use uma imagem x86_64 ao invés de ARM

### "System image not found"
```bash
# Instalar a imagem primeiro
sdkmanager "system-images;android-33;google_apis_playstore;x86_64"
```

### Emulador não inicia
```bash
# Verificar se KVM está habilitado (Linux)
kvm-ok

# Se não estiver instalado:
sudo apt-get install qemu-kvm
```

### "HAXM not installed" (Intel)
No Linux, use KVM ao invés de HAXM (que é para Windows/Mac)

---

## 💡 Dicas

1. **Use Google Play**: Permite instalar apps da Play Store no emulador
2. **Habilite Hardware Acceleration**: Muito mais rápido
3. **Snapshot**: Salve o estado do emulador para inicialização rápida
4. **Cold Boot**: Desmarque "Quick Boot" se tiver problemas

---

## 🎬 Próximos Passos

Após criar o emulador:

1. ✅ Inicie o emulador (Android Studio ou linha de comando)
2. ✅ Verifique com `adb devices`
3. ✅ Execute `./start-android.sh`
4. 🎉 Seu app vai abrir automaticamente!

---

## 📚 Links Úteis

- [Android Studio Download](https://developer.android.com/studio)
- [AVD Manager Guide](https://developer.android.com/studio/run/managing-avds)
- [Android Emulator Guide](https://developer.android.com/studio/run/emulator)
