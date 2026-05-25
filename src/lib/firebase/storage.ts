import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseApp } from './firebase';

function getStorageInstance() {
  return getStorage(getFirebaseApp());
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const storage = getStorageInstance();
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

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
