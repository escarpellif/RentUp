# 🚀 GUIA COMPLETO: PUBLICAR APP NA GOOGLE PLAY (INTERNAL TESTING)

## ✅ **POR QUE ESTE CAMINHO É MELHOR:**

1. ✅ Você vai testar o app **EXATAMENTE** como os usuários vão usar
2. ✅ Não precisa de development build nem servidor Expo
3. ✅ O app fica disponível na Google Play para você e testadores
4. ✅ É rápido de atualizar (15-30 minutos por build)

---

## 📋 **PRÉ-REQUISITOS:**

### **1. Conta Google Play Console**
- ✅ Você já deve ter criado (conta de desenvolvedor - $25 one-time)
- ✅ Acesse: https://play.google.com/console

### **2. App criado no Google Play Console**
- ✅ Se ainda não criou, vou te ajudar abaixo

---

## 🎯 **PASSO A PASSO COMPLETO:**

### **ETAPA 1: Criar App no Google Play Console (se ainda não fez)**

1. Acesse https://play.google.com/console
2. Clique em "Criar app"
3. Preencha:
   - **Nome do app:** Aluko
   - **Idioma padrão:** Espanhol (ou Português)
   - **Tipo:** App
   - **Grátis ou pago:** Grátis
4. Marque as declarações e clique em "Criar app"

### **ETAPA 2: Configurar Service Account (para upload automático)**

#### **2.1 - Criar Service Account no Google Cloud:**

1. Acesse: https://console.cloud.google.com/
2. No menu, vá em **IAM & Admin > Service Accounts**
3. Clique em **"Create Service Account"**
4. Preencha:
   - **Name:** `aluko-uploader`
   - **Description:** `Service account for Aluko app uploads`
5. Clique em **"Create and Continue"**
6. Em **"Grant this service account access"**, não precisa adicionar nada, clique em **"Continue"**
7. Clique em **"Done"**

#### **2.2 - Criar chave JSON:**

1. Clique no service account que acabou de criar (`aluko-uploader`)
2. Vá na aba **"Keys"**
3. Clique em **"Add Key" > "Create new key"**
4. Selecione **JSON** e clique em **"Create"**
5. Um arquivo JSON será baixado automaticamente
6. **Renomeie** esse arquivo para `google-service-account.json`
7. **Mova** esse arquivo para a pasta raiz do seu projeto:
   ```bash
   mv ~/Downloads/aluko-*.json /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko/google-service-account.json
   ```

#### **2.3 - ATIVAR A API DO GOOGLE PLAY (IMPORTANTE!):**

1. Acesse: https://console.developers.google.com/apis/api/androidpublisher.googleapis.com
2. **Selecione o projeto** que você criou (ex: "Aluko" ou "aluko-app")
3. Clique em **"ENABLE"** (ou **"ATIVAR"**)
4. **Aguarde 2-5 minutos** para a API propagar

⚠️ **SEM ISSO, O UPLOAD VAI FALHAR!**

#### **2.4 - Dar permissões no Google Play Console:**

1. Volte para https://play.google.com/console
2. Vá em **"Users and permissions"** (no menu lateral)
3. Clique em **"Invite new users"**
4. Cole o email do service account (algo como `aluko-uploader@projeto.iam.gserviceaccount.com`)
   - **IMPORTANTE:** Você encontra esse email no arquivo JSON baixado, no campo `"client_email"`
5. Em **"App permissions"**, selecione seu app (Aluko)
6. Marque as permissões:
   - ✅ **Releases** (View, Create & edit, and Manage)
   - ✅ **Release to production, exclude devices, and use Play App Signing**
7. Clique em **"Invite user"**
8. Clique em **"Send invite"**

---

### **ETAPA 3: Fazer Build de Produção**

No terminal do Ubuntu, execute:

```bash
cd /media/fernando/22cd7c3e-30fb-467e-9342-38056af1e886/fernando/MyApp/aluko

# 1. Fazer build de produção (AAB - Android App Bundle)
npx eas-cli build --platform android --profile production

# 2. Aguardar completar (15-30 minutos)
# O EAS vai mostrar o progresso e um link para acompanhar
```

**O que vai acontecer:**
- ✅ EAS vai compilar o app no formato AAB (Android App Bundle)
- ✅ Vai gerar um arquivo pronto para a Google Play
- ✅ Quando terminar, vai aparecer um link para download

---

### **ETAPA 4: Fazer Upload Automático para Google Play**

Depois que o build completar, execute:

```bash
# Upload automático para Internal Testing
npx eas-cli submit --platform android --latest

# OU, se quiser escolher qual build enviar:
npx eas-cli submit --platform android
```

**O que vai acontecer:**
- ✅ EAS vai pegar o AAB que acabou de compilar
- ✅ Vai fazer upload direto para Google Play Console
- ✅ Vai publicar na track "internal" automaticamente

---

### **ETAPA 5: Configurar Internal Testing no Google Play Console**

1. Acesse https://play.google.com/console
2. Selecione seu app (Aluko)
3. No menu lateral, vá em **"Testing > Internal testing"**
4. Clique em **"Create new release"**
5. O build que você acabou de enviar deve aparecer
6. Clique em **"Review release"**
7. Clique em **"Start rollout to Internal testing"**

---

### **ETAPA 6: Adicionar Testadores**

1. Ainda em **"Internal testing"**, vá na aba **"Testers"**
2. Clique em **"Create email list"**
3. Adicione seu email e de outros testadores
4. Salve
5. Copie o **link de teste** que aparece
6. Envie esse link para você e testadores

---

### **ETAPA 7: Instalar e Testar**

1. Abra o link de teste no celular Android
2. Aceite o convite para ser testador
3. Clique em **"Download on Google Play"**
4. O app vai abrir na Google Play
5. Clique em **"Instalar"**
6. **TESTE O APP!** 🎉

---

## 🔄 **PARA ATUALIZAR O APP (DEPOIS DE CORRIGIR BUGS):**

```bash
# 1. Fazer correções no código

# 2. Novo build
npx eas-cli build --platform android --profile production

# 3. Aguardar completar

# 4. Upload automático
npx eas-cli submit --platform android --latest

# 5. No Google Play Console, aprovar a nova versão para Internal Testing
```

---

## ⚠️ **IMPORTANTE - ANTES DE PUBLICAR:**

### **Você DEVE preencher no Google Play Console:**

1. **App content (Conteúdo do app):**
   - Política de privacidade
   - Classificação de conteúdo
   - Público-alvo
   - Anúncios (se tem ou não)
   
2. **Store presence (Presença na loja):**
   - Ícone do app (512x512 px)
   - Screenshots (mínimo 2)
   - Descrição
   
**MAS PARA INTERNAL TESTING, NÃO PRECISA DE TUDO ISSO!**
- ✅ Internal testing libera SEM screenshots
- ✅ SEM descrição completa
- ✅ SEM política de privacidade

---

## 🎯 **RESUMO - O QUE FAZER AGORA:**

```bash
# 1. Configurar service account (ETAPA 2)
# 2. Mover o arquivo JSON para a pasta do projeto
# 3. Fazer build de produção:
npx eas-cli build --platform android --profile production

# 4. Quando completar, fazer upload:
npx eas-cli submit --platform android --latest
```

---

## 📞 **PRECISA DE AJUDA?**

- ❓ Se der erro no service account, me avise
- ❓ Se der erro no build, me avise
- ❓ Se der erro no upload, me avise

**VAMOS COMEÇAR PELA ETAPA 2 (Service Account)!** 🚀
