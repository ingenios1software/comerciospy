# ComerciosPY para Android

Proyecto Trusted Web Activity (TWA) generado con Bubblewrap para publicar ComerciosPY en Google Play.

## Configuracion actual

- Package ID: `py.comerciospy.app`
- Sitio: `https://comerciospy.vercel.app`
- Target SDK: Android 15 / API 35
- Version inicial: `1.0.0` (`versionCode` 1)
- Firma: pendiente de crear

El proyecto Android vive separado de la aplicacion Next.js. Compilarlo o actualizarlo no modifica el sitio web.

## Actualizar desde el manifiesto

Desde la raiz del repositorio:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx --yes @bubblewrap/cli update --skipVersionUpgrade --manifest='android\twa-manifest.json' --directory='android'
```

## Compilar una prueba sin firma

```powershell
cd android
.\gradlew.bat assembleRelease bundleRelease
```

Los resultados locales se generan en:

- `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

Estos archivos y cualquier llave de firma estan excluidos de Git.

## Antes de publicar

1. Crear y respaldar de forma segura la llave de carga definitiva.
2. Agregar su huella SHA-256 a `twa-manifest.json`.
3. Publicar `public/.well-known/assetlinks.json` con la misma huella.
4. Generar un App Bundle firmado.
5. Crear la ficha de Google Play y completar privacidad, seguridad de datos y clasificacion de contenido.
6. Subir el `.aab` a la prueba cerrada de Google Play.

No se debe crear una llave definitiva hasta decidir donde se guardaran la llave y sus contrasenas. Perderla complica futuras actualizaciones.

La huella de la llave de carga actual ya esta registrada para permitir pruebas firmadas. Cuando Google Play genere la llave de firma de la aplicacion, su huella SHA-256 tambien debe agregarse a `twa-manifest.json` y `assetlinks.json`.
