import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Job {
  id?: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  filePath?: string;
  createdAt: any;
  updatedAt: any;
}

const COLLECTION_PATH = 'jobs';

export const subscribeToJobs = (userId: string, callback: (jobs: Job[]) => void) => {
  const q = query(
    collection(db, COLLECTION_PATH),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Job));
    callback(jobs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
  });
};

export const uploadGeneticDataAndCreateJob = async (file: File, description: string, userId: string) => {
  const jobId = `ST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Choose destination path in Storage
  const storagePath = `uploads/${jobId}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  try {
    // 1. Upload to Firebase Storage
    await uploadBytes(storageRef, file);
    
    // 2. Create Job Document
    const jobData = {
      jobId,
      userId,
      status: 'pending',
      description,
      filePath: storagePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_PATH), jobData);
    return docRef.id;
  } catch (error) {
    console.error("Storage/Firestore error during job creation:", error);
    throw error;
  }
};

export const createJobWithId = async (jobId: string, userId: string, description: string) => {
  const jobData = {
    jobId,
    userId,
    status: 'pending',
    description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_PATH), jobData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
};

export const createJob = async (userId: string, description: string) => {
  const jobId = `ST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const jobData = {
    jobId,
    userId,
    status: 'pending',
    description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_PATH), jobData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
};
