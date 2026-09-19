import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function cleanup() {
  const abhaId = '91-8821-4450-1290';
  const hospitalId = 'DCH-001';

  console.log(`Cleaning up for ABHA: ${abhaId} at Hospital: ${hospitalId}`);

  let patientIds = [];
  try {
    const patientSnap = await getDocs(collection(db, 'patients'));
    patientSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.abhaId === abhaId || docSnap.id === 'pt-sunita-verma-xyz') {
        patientIds.push(docSnap.id);
      }
    });
    console.log('Found patient IDs:', patientIds);
  } catch (e) {
    console.error('Error fetching patients', e);
  }
  
  if (patientIds.length === 0) patientIds = ['pt-1789282313937']; // from previous

  for (const pId of patientIds) {
    try {
      const pRegSnap = await getDocs(collection(db, `patients/${pId}/hospital_registrations`));
      for (const d of pRegSnap.docs) {
        console.log(`Deleting patients/${pId}/hospital_registrations/${d.id}`);
        await deleteDoc(doc(db, `patients/${pId}/hospital_registrations`, d.id));
      }
    } catch(e) {}
    
    try {
      const pVisSnap = await getDocs(collection(db, `patients/${pId}/visits`));
      for (const d of pVisSnap.docs) {
          console.log(`Deleting patients/${pId}/visits/${d.id}`);
          await deleteDoc(doc(db, `patients/${pId}/visits`, d.id));
      }
    } catch(e) {}
  }

  try {
    const globalRegSnap = await getDocs(collection(db, 'hospital_registrations'));
    for (const d of globalRegSnap.docs) {
      const data = d.data();
      if (data.abhaId === abhaId || patientIds.includes(data.patientId)) {
        console.log(`Deleting global hospital_registrations/${d.id}`);
        await deleteDoc(doc(db, 'hospital_registrations', d.id));
      }
    }
  } catch(e) {}

  const collectionsToCheck = ['encounters', 'historySessions', 'documentUploads', 'structuredSummaries', 'redFlagAlerts', 'sessions'];
  for (const collName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, collName));
      for (const d of snap.docs) {
         const data = d.data();
         if (patientIds.includes(data.patientId) || patientIds.includes(data.patient?.id) || data.abhaId === abhaId || data.patient?.abhaId === abhaId) {
           console.log(`Deleting ${collName}/${d.id}`);
           await deleteDoc(doc(db, collName, d.id));
         }
      }
    } catch(e) {}
  }
  
  console.log('Cleanup complete');
  process.exit(0);
}

cleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
