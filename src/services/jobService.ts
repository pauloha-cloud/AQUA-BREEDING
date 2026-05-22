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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Job {
  id?: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
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
