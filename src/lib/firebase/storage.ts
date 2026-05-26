import { getAuth } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, type UploadMetadata } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

function getStorageInstance() {
  return getStorage(getFirebaseApp());
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const auth = getAuth(getFirebaseApp());
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Debe iniciar sesion para subir archivos.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten imagenes.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 10 MB.');
  }

  const storage = getStorageInstance();
  const storageRef = ref(storage, path.replace(/^\/+/, ''));
  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      owner: currentUser.uid
    }
  };
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      () => undefined,
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}
