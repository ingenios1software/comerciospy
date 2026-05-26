# ComerciosPY

Guia web mobile-first para comercios locales y prestadores de servicios. El usuario comun busca gratis sin cuenta: filtra por ciudad, categoria y rubro, ve telefono, WhatsApp, ubicacion, horario, fotos y fichas completas. El alta no es libre para comercios: el negocio contacta por WhatsApp, paga, y administracion crea su usuario.

## Ejecutar localmente

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` basado en `.env.example`.

3. Iniciar la app:

   ```bash
   npm run dev
   ```

4. Abrir `http://localhost:3000`.

Antes de desplegar:

```bash
npm run build
```

## Variables

- `NEXT_PUBLIC_FIREBASE_*`: credenciales web de Firebase.
- `NEXT_PUBLIC_ADMIN_WHATSAPP`: numero para solicitudes de alta.
- `OPENAI_API_KEY`: clave server-side para el asistente IA de publicaciones.
- `OPENAI_MODEL`: modelo para analizar fotos, por defecto `gpt-5-mini`.

## Flujo del producto

- `/`: busqueda gratis para usuarios, con filtro exacto por ciudad, categorias y comercios destacados.
- `/comercios`: listado gratis sin cuenta, con ciudad precisa, categoria de negocio, llamada, WhatsApp, horario y ubicacion.
- `/comercios/[id]`: ficha completa del negocio con galeria y publicaciones.
- `/registro`: contacto comercial por WhatsApp para solicitar alta.
- `/login`: acceso privado para usuarios ya creados.
- `/dashboard`: panel del comercio.
- `/perfil`: edicion de ficha publica, fotos y servicios.
- `/publicar`: carga de publicaciones con asistente IA desde una foto.
- Cada ficha publica funciona como tarjeta digital: se puede copiar, abrir, compartir por WhatsApp o usar el share nativo del celular.

## Firebase

En Firebase Console:

1. Authentication: habilitar email/password.
2. Firestore: aplicar `firestore.rules`.
3. Storage: aplicar `storage.rules`.

El administrador debe crear el usuario del comercio, crear o vincular el documento del comercio y asignar `comercioId` en el perfil del usuario. Los visitantes que solo buscan comercios no necesitan usuario.

## IA

El endpoint `POST /api/ai/publicacion` recibe una imagen desde el formulario de publicar y devuelve sugerencias de titulo, descripcion, categoria, tipo, ideas y mejoras de foto. La clave `OPENAI_API_KEY` nunca se expone al navegador.
