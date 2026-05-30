import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore;

if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    adminDb = getFirestore();
  } else {
    console.warn('[Firebase Admin] 环境变量不完整，Firebase 功能将不可用');
    // 创建一个假的 Firestore 实例，避免 getFirestore() 在未初始化时崩溃
    adminDb = null as unknown as Firestore;
  }
} else {
  adminDb = getFirestore();
}

export { adminDb };
