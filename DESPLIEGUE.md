# Guia practica de despliegue de ComerciosPY

ComerciosPY se despliega en Vercel. El proyecto de Vercel ya esta vinculado al repositorio de GitHub y usa la rama `main` como produccion.

Las reglas de Firestore y Storage se publican por separado con Firebase CLI.

## 1. Requisitos

- Node.js y npm instalados.
- Acceso al repositorio `ingenios1software/comerciospy`.
- Acceso al proyecto `comerciospy` en Vercel.
- Acceso al proyecto correspondiente en Firebase.
- Variables de entorno de produccion cargadas en Vercel.

Nunca subas `.env.local`, claves privadas o credenciales al repositorio.

## 2. Variables de entorno en Vercel

En Vercel abre:

`Project > Settings > Environment Variables`

Carga estas variables para el ambiente **Production**:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_WHATSAPP=595983132491
OPENAI_API_KEY=
```

Variables opcionales:

```env
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
OPENAI_MODEL=gpt-5-mini
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_QUALITY=medium
```

Despues de agregar o cambiar variables, realiza un nuevo despliegue. Las variables `NEXT_PUBLIC_*` se incorporan durante el build.

## 3. Verificacion antes de desplegar

Desde la raiz del proyecto:

```bash
npm install
npm run build
git status
```

El build debe terminar correctamente. Revisa que `git status` solo muestre los archivos que deseas publicar.

## 4. Despliegue automatico recomendado

Cada push a `main` inicia un despliegue de produccion en Vercel.

```bash
git add README.md GUIA_DE_USO.md DESPLIEGUE.md
git commit -m "Add usage and deployment guides"
git push origin main
```

Luego:

1. Abre el proyecto `comerciospy` en Vercel.
2. Entra a **Deployments**.
3. Abre el despliegue mas reciente.
4. Espera el estado **Ready**.
5. Abre la URL de produccion y realiza la verificacion posterior.

Para cambios de codigo, agrega solamente los archivos relacionados con el cambio en lugar de copiar literalmente el comando `git add` del ejemplo.

## 5. Despliegue manual desde la computadora

Este flujo es util para volver a desplegar la version local o diagnosticar problemas:

```bash
npx vercel --prod
```

La primera vez, Vercel puede solicitar iniciar sesion y confirmar el proyecto. El repositorio ya contiene la vinculacion local en `.vercel/project.json`.

Un despliegue manual no reemplaza la necesidad de guardar los cambios importantes en GitHub.

## 6. Publicar reglas de Firebase

Usa este paso solamente cuando cambien `firestore.rules` o `storage.rules`:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage --project TU_FIREBASE_PROJECT_ID
```

Las reglas de Firebase no se publican automaticamente con Vercel.

Antes de aplicar reglas nuevas, revisa que usuarios, comercios y administradores mantengan los permisos necesarios.

## 7. Verificacion posterior al despliegue

Comprueba en produccion:

1. La pagina de inicio abre sin errores.
2. La busqueda y los filtros muestran comercios.
3. Las fichas abren y los botones de WhatsApp y ubicacion funcionan.
4. El inicio de sesion funciona.
5. Una cuenta de comercio puede abrir su panel.
6. La carga de fotos y publicaciones funciona.
7. Las funciones IS95 responden o muestran un error controlado.
8. En celular aparece la opcion de instalar la aplicacion cuando el navegador la admite.

Si cambiaste reglas de Firebase, prueba tambien lectura, escritura y carga de archivos con los roles afectados.

## 8. Dominio y autenticacion

Cuando agregues un dominio personalizado:

1. Configuralo en `Vercel > Project > Settings > Domains`.
2. Actualiza `NEXT_PUBLIC_APP_URL` con la URL final.
3. Agrega el dominio en `Firebase Console > Authentication > Settings > Authorized domains`.
4. Ejecuta un nuevo despliegue.

## 9. Rollback

Si el ultimo despliegue tiene un problema:

1. Abre **Deployments** en Vercel.
2. Busca el ultimo despliegue estable.
3. Abre su menu y elige **Promote to Production**.
4. Corrige el problema en GitHub antes del siguiente despliegue.

No reviertas reglas de Firebase sin revisar primero el impacto en seguridad y datos.

## 10. Problemas frecuentes

**El build falla**

- Ejecuta `npm install` y luego `npm run build`.
- Revisa el primer error real del registro, no solamente el resumen final.

**Firebase funciona localmente pero no en produccion**

- Revisa las variables de entorno de Vercel.
- Confirma que el dominio de produccion esta autorizado en Firebase Authentication.
- Verifica que las reglas de Firestore y Storage esten publicadas.

**Las funciones IS95 no responden**

- Verifica `OPENAI_API_KEY` en Vercel.
- Revisa los registros del despliegue y de las funciones.
- Confirma que la cuenta tenga credito y acceso a los modelos configurados.

**Vercel despliega una version anterior**

- Confirma que el commit este en `main`.
- Verifica que Vercel este conectado al repositorio y rama correctos.
- Inicia un redeploy desde el ultimo commit de produccion.

