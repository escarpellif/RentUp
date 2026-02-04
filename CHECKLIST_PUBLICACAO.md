# ✅ CHECKLIST - PUBLICAR ALUKO

Marque cada item conforme for completando:

## 📋 PRÉ-REQUISITOS:

- [ ] **Conta Google Play Console criada** ($25 pagos)
- [ ] **App criado no Google Play Console**
- [ ] **Google Cloud Project criado** (automático ao criar app)

## 🔧 CONFIGURAÇÃO (APENAS UMA VEZ):

- [ ] **Service Account criado** no Google Cloud
- [ ] **Arquivo JSON baixado** do Service Account  
- [ ] **Arquivo renomeado** para `google-service-account.json`
- [ ] **Arquivo movido** para pasta do projeto
- [ ] **Permissões dadas** ao Service Account no Google Play Console

## 🚀 PRIMEIRA PUBLICAÇÃO:

- [ ] **Execute:** `./publicar-google-play.sh`
- [ ] **Aguarde** build completar (15-30 min)
- [ ] **Confirme** upload para Google Play
- [ ] **Acesse** Google Play Console
- [ ] **Aprove** release em Internal Testing
- [ ] **Copie** link de teste
- [ ] **Abra** link no celular
- [ ] **Aceite** convite de testador
- [ ] **Instale** app da Google Play
- [ ] **TESTE!** 🎉

## 🔄 ATUALIZAÇÕES (CORREÇÕES DE BUGS):

- [ ] Faça correções no código
- [ ] Execute: `./publicar-google-play.sh`
- [ ] Aguarde build completar
- [ ] Aprove no Google Play Console
- [ ] Testadores recebem atualização automática

---

## 📞 PRECISA DE AJUDA?

### Erro no Service Account?
- Verifique se o email está correto
- Verifique se deu todas as permissões
- Verifique se o arquivo JSON está na pasta certa

### Erro no Build?
- Execute: `npx eas-cli build --platform android --profile production`
- Veja os logs para identificar o erro

### Erro no Upload?
- Verifique se o Service Account tem permissões
- Verifique se o app foi criado no Google Play Console

---

## 🎯 STATUS ATUAL:

**Data:** _____________  
**Última etapa concluída:** _____________  
**Próximo passo:** _____________

---

**Dica:** Imprima este checklist ou mantenha aberto enquanto faz o processo!
