# ComerciosPY

Guia web mobile-first para comercios locales y prestadores de servicios en Paraguay.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

Antes de subir cambios importantes:

```bash
npm run build
```

## Deploy en Vercel

El proyecto esta preparado para deploy automatico desde GitHub con Vercel.

1. En Vercel, elegir `Add New` > `Project`.
2. Importar `ingenios1software/comerciospy`.
3. Mantener estos valores por defecto:
   - Framework Preset: `Next.js`
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: dejar vacio/default
4. Cargar las variables de entorno de produccion.
5. Deploy.

La rama de produccion debe ser `main`. Cada push o merge a `main` dispara un nuevo deploy de produccion.

No se usa Firebase Hosting y no hace falta agregar `vercel.json` para este flujo.

## Variables de entorno

Variables requeridas en Vercel:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_WHATSAPP=
OPENAI_API_KEY=
```

Variables opcionales:

```env
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
OPENAI_MODEL=gpt-5-mini
```

Notas:

- Las variables `NEXT_PUBLIC_*` se incluyen en el bundle del navegador durante `next build`; deben estar configuradas antes del deploy.
- `OPENAI_API_KEY` queda solo del lado servidor y se usa en `POST /api/ai/publicacion`.
- `NEXT_PUBLIC_APP_URL` mejora los enlaces compartidos de las fichas digitales. Si todavia no hay dominio final, puede completarse despues y redeployar.

## Firebase

Firebase se usa como backend desde la app:

- Authentication con email/password.
- Firestore con `firestore.rules`.
- Storage con `storage.rules`.

Las reglas se aplican desde Firebase Console, no desde Vercel.
