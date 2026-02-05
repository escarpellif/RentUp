# 🗑️ Guía de Implementación del Sistema de Eliminación de Cuenta

## 📋 Resumen

Este sistema permite que los usuarios soliciten la eliminación de su cuenta de forma segura y conforme a las regulaciones GDPR, LGPD y CCPA.

---

## 🔧 Paso 1: Configurar la Base de Datos en Supabase

1. **Acceda al Dashboard de Supabase:**
   - Vaya a https://supabase.com
   - Entre en su proyecto

2. **Ejecute el SQL:**
   - Haga clic en el menú lateral: **SQL Editor**
   - Haga clic en "New Query"
   - Copie y pegue todo el contenido del archivo: `ACCOUNT_DELETION_SYSTEM.sql`
   - Haga clic en **Run** (o presione Ctrl/Cmd + Enter)

3. **Verifique la creación:**
   ```sql
   -- Verificar si la tabla fue creada
   SELECT * FROM account_deletion_requests LIMIT 5;
   
   -- Verificar si las funciones fueron creadas
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%deletion%';
   ```

---

## 🌐 Paso 2: Hospedar la Página HTML de Eliminación

### Opción A: GitHub Pages (Recomendado - GRATIS)

1. **El archivo ya está en su repositorio:**
   - `delete-account.html` está en la raíz del proyecto

2. **Acceda a su repositorio en GitHub:**
   - Vaya a: https://github.com/escarpellif/RentUp

3. **Habilite GitHub Pages:**
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (o master)
   - Folder: / (root)
   - Haga clic en **Save**

4. **Su URL será:**
   - `https://escarpellif.github.io/RentUp/delete-account.html`
   - ⚠️ **ACTUALICE la URL en ProfileScreen.js línea ~307**

### Opción B: Netlify (También Gratis)

1. **Cree una carpeta para deployment:**
   ```bash
   mkdir -p netlify-deploy/delete-account
   cp delete-account.html netlify-deploy/delete-account/index.html
   ```

2. **Haga deploy:**
   - Vaya a https://app.netlify.com
   - Drag & Drop la carpeta `netlify-deploy/delete-account`
   - Su URL será algo como: `https://aluko-delete-account.netlify.app`

### Opción C: Mismo servidor de su Privacy Policy

Si ya tiene un servidor/dominio:
```bash
# Copie el archivo para su servidor
scp delete-account.html user@yourserver:/var/www/html/
```

---

## 📱 Paso 3: Actualizar la URL en el App

Edite el archivo: `src/screens/ProfileScreen.js`

**Línea ~307, cambie:**

```javascript
const deleteUrl = 'https://raw.githubusercontent.com/escarpellif/RentUp/main/delete-account.html';
```

**Por su URL real (después de hacer el deploy):**

```javascript
const deleteUrl = 'https://escarpellif.github.io/RentUp/delete-account.html';
// O
const deleteUrl = 'https://aluko-delete-account.netlify.app';
// O su dominio personalizado
const deleteUrl = 'https://aluko.io/delete-account';
```

---

## 🔗 Paso 4: Actualizar Google Play Console

1. **Acceda a Google Play Console:**
   - https://play.google.com/console

2. **Vaya a App content:**
   - Menu lateral → Policy → App content

3. **En la sección "Data safety":**
   - Edite la sección
   - Busque "Data deletion"
   - Agregue la URL: `https://[SU-URL-REAL]/delete-account.html`

4. **En Privacy Policy:**
   - Ya debe tener la URL de su política
   - Asegúrese de que incluye la sección de eliminación de datos

---

## 🧪 Paso 5: Probar el Sistema

### Prueba 1: Probar la página HTML

1. Abra la URL en su navegador
2. Complete el formulario con un email de prueba
3. Verifique que muestra la confirmación

### Prueba 2: Probar desde el app

1. Abra el app en modo desarrollo
2. Vaya a Perfil → Editar
3. Desplácese hacia abajo hasta "Zona Peligrosa"
4. Haga clic en "Solicitar Eliminación de Cuenta"
5. Confirme la alerta
6. Verifique que se abre la página HTML

### Prueba 3: Probar la función de Supabase

```sql
-- En el SQL Editor de Supabase, ejecute:
SELECT request_account_deletion('Solo estoy probando');

-- Verifique la solicitud creada:
SELECT * FROM account_deletion_requests 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## 🎯 Paso 6: Integrar el Formulario HTML con Supabase (Opcional)

**Para que el formulario HTML envíe directamente a Supabase:**

1. Edite `delete-account.html`
2. Reemplace la sección del script (línea ~285) con:

```javascript
// Configuración de Supabase
const SUPABASE_URL = 'SU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'SU_SUPABASE_ANON_KEY_AQUI';

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!document.getElementById('confirm').checked) {
        showError('Por favor, confirma que entiendes que esta acción es irreversible.');
        return;
    }

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';
    errorMessage.classList.remove('show');

    const formData = {
        email: document.getElementById('email').value,
        reason: document.getElementById('reason').value,
        comments: document.getElementById('comments').value
    };

    try {
        // Importar Supabase client
        const { createClient } = supabase;
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Enviar solicitud
        const { data, error } = await client.rpc('request_account_deletion', {
            p_reason: formData.reason + ' - ' + formData.comments
        });

        if (error) throw error;

        if (data.success) {
            form.style.display = 'none';
            successMessage.classList.add('show');
            requestIdSpan.textContent = data.request_id;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Hubo un error al procesar tu solicitud: ' + error.message);
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});
```

3. Agregue el script de Supabase en el `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 📊 Paso 7: Monitorear Solicitudes

### Ver todas las solicitudes:

```sql
SELECT 
    id,
    email,
    full_name,
    reason,
    status,
    requested_at,
    processed_at
FROM account_deletion_requests
ORDER BY requested_at DESC;
```

### Procesar una solicitud (como admin):

```sql
-- Primero, verifique los detalles
SELECT * FROM account_deletion_requests 
WHERE id = 'ID_DA_SOLICITACAO';

-- Procesarla (⚠️ ESTO ELIMINARÁ TODOS LOS DATOS DEL USUARIO)
SELECT process_account_deletion('ID_DA_SOLICITACAO', true);
```

### Cancelar una solicitud:

```sql
UPDATE account_deletion_requests
SET status = 'cancelled',
    notes = 'Cancelado por el usuario'
WHERE id = 'ID_DA_SOLICITACAO';
```

---

## 📧 Paso 8: Configurar Notificaciones por Email (Opcional)

Para recibir un email cuando haya una nueva solicitud:

1. **Cree una función Edge en Supabase:**
   - Dashboard → Edge Functions
   - Cree una nueva función: `notify-deletion-request`

2. **Configure un webhook:**
   - Dashboard → Database → Webhooks
   - Tabla: `account_deletion_requests`
   - Evento: `INSERT`
   - URL: Su función edge o servicio de email

---

## ✅ Checklist Final

- [ ] Ejecuté el SQL en Supabase
- [ ] Verifiqué que la tabla `account_deletion_requests` fue creada
- [ ] Hice deploy de `delete-account.html`
- [ ] Actualicé la URL en `ProfileScreen.js`
- [ ] Probé el botón en el app
- [ ] Verifiqué que la página HTML se abre correctamente
- [ ] Actualicé Google Play Console con la URL
- [ ] Probé crear una solicitud de prueba
- [ ] Probé la función `request_account_deletion` en Supabase

---

## 🆘 Solución de Problemas

### Error: "function request_account_deletion does not exist"

**Solución:** Ejecute nuevamente el SQL del archivo `ACCOUNT_DELETION_SYSTEM.sql`

### Error: "relation account_deletion_requests does not exist"

**Solución:** La tabla no fue creada. Ejecute el SQL completo.

### La página HTML no abre

**Solución:**
1. Verifique que la URL está correcta
2. Pruebe abrir la URL en el navegador del celular
3. Verifique si GitHub Pages está habilitado

### El botón no aparece en el app

**Solución:**
1. Reinicie el servidor: `npm start`
2. Limpie el caché: `npm start -- --reset-cache`
3. Verifique que guardó los cambios en `ProfileScreen.js`

---

## 📞 Soporte

Si tiene algún problema:
1. Revise los logs del Supabase
2. Verifique la consola del navegador (F12)
3. Contacte a fernandoescarpelli@aluko.io

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:**
- Nunca exponga credenciales de admin en el código frontend
- La función `process_account_deletion` debe ser ejecutada SOLO por admins
- Cree una política RLS específica para admins si necesario
- Registre todas las eliminaciones para auditoría

---

**Creado el:** 5 de febrero de 2026  
**Versión:** 1.0.0  
**Última actualización:** 5 de febrero de 2026
