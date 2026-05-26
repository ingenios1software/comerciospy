# Configuración Firebase para ComerciosPY

## 1. Activar en Firebase Console

1. Abre Firebase Console y selecciona el proyecto `comerciospy`.
2. Ve a `Authentication` > `Método de inicio de sesión`:
   - Activa `Email/Password`.
   - Activa `Google`.
3. Ve a `Firestore Database`:
   - Usa la base creada en modo `Producción`.
   - Ubicación esperada: `southamerica-east1`.
   - Copia las reglas de `firestore.rules` en la consola de reglas.
4. Ve a `Storage`:
   - Crea el bucket asociado.
   - Copia las reglas de `storage.rules` en la consola de reglas.

## 2. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto a partir de `.env.example`.

Rellena estos valores con los datos de tu app web Firebase (`Project settings` > `Your apps` > `Web app`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_optional
```

> No subas `.env.local` al repositorio. Ya está ignorado en `.gitignore`.
> No uses claves de Admin SDK ni service accounts en el frontend.

## 3. Comandos a ejecutar

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Ejecuta en local:
   ```bash
   npm run dev
   ```
3. Prepara el build para producción:
   ```bash
   npm run build
   ```

## 4. Despliegue

- Si despliegas en Vercel: conecta el repositorio y agrega las mismas variables de entorno en el panel de Vercel.
- Si despliegas con Firebase Hosting para Next.js: instala Firebase CLI, inicializa Hosting para frameworks web y despliega después de publicar las reglas.

## 5. Qué ya está integrado en el proyecto

- Configuración modular oficial de Firebase en `src/lib/firebase/firebase.ts`.
- Autenticación con email/password en `src/lib/firebase/auth.ts`.
- Autenticación con Google prepoblada y botón en `src/app/(public)/login/page.tsx`.
- Creación automática de perfil de usuario si ingresa con Google por primera vez.
- Sesión persistente con `browserLocalPersistence`.
- Firestore para `users`, `comercios`, `publicaciones` y `categorias`.
- Storage con metadata de `owner` para cargas seguras.
- Reglas iniciales en `firestore.rules` y `storage.rules`, con validación de roles, propietario y tipo de imagen.

## 6. Qué verificar en Firebase Console

- `Authentication` habilitado correctamente.
- `Firestore` en modo producción y reglas aplicadas.
- `Storage` reglas aplicadas.
- `Project settings` > `General` > credenciales copiadas en `.env.local`.
- `Authentication` > `Settings` > dominios autorizados incluye el dominio local/deploy que vayas a usar.
