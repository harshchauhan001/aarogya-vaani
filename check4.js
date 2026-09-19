import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const d = await getDoc(doc(db, 'patients', 'pt-1789282313937'));
  console.log('Patient exists?', d.exists());
  process.exit(0);
}
check();
