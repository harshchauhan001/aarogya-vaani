import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snaps = await getDocs(collection(db, 'patients/pt-1789282313937/visits'));
  console.log('visits count:', snaps.size);
  process.exit(0);
}
check();
