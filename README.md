# ComerciosPY

Aplicación web móvil para comercios locales construida con Next.js App Router, TypeScript, Tailwind CSS y Firebase preparado para integrar Auth, Firestore y Storage.

## Ejecutar localmente

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env.local` basado en `.env.example`.
3. Inicia la app:
   ```bash
   npm run dev
   ```
4. Abre `http://localhost:3000`

## Estructura principal

- `src/app/(public)/` - páginas públicas y de acceso
- `src/app/(dashboard)/` - dashboard y gestión de publicaciones
- `src/components/` - componentes reutilizables
- `src/lib/firebase/` - configuración modular de Firebase
- `src/types/` - tipos TypeScript de la aplicación

## Configurar Firebase

Actualiza `.env.local` con tus credenciales de Firebase, luego configura Authentication, Firestore y Storage en la consola de Firebase.

## Siguientes pasos

- Conectar Firebase Auth a los formularios de login/registro
- Guardar comercios y publicaciones en Firestore
- Subir fotos desde el celular a Firebase Storage
- Añadir geolocalización y mapa interactivo
- Hacer la UX completamente mobile-first con interacciones táctiles
