import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snaps = await getDocs(collection(db, 'sessions'));
  console.log(`Global sessions count: ${snaps.size}`);
  for (const d of snaps.docs) {
     console.log(d.id);
  }
  process.exit(0);
}
check();
