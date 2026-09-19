import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
    const patientQ = query(collection(db, 'patients'), where('abhaId', '==', abhaId));
    const patientSnap = await getDocs(patientQ);
    patientSnap.forEach(docSnap => {
      patientIds.push(docSnap.id);
    });
    console.log('Found patient IDs:', patientIds);
  } catch (e) {
    console.error('Error fetching patients', e);
  }

  for (const pId of patientIds) {
    try {
      const pRegQ = query(collection(db, `patients/${pId}/hospital_registrations`), where('hospitalId', '==', hospitalId));
      const pRegSnap = await getDocs(pRegQ);
      for (const d of pRegSnap.docs) {
        console.log(`Deleting patients/${pId}/hospital_registrations/${d.id}`);
        await deleteDoc(doc(db, `patients/${pId}/hospital_registrations`, d.id));
      }
    } catch(e) { console.error('err1', e.message); }
    
    try {
      const pRegQ3 = collection(db, `patients/${pId}/hospital_registrations`);
      const pRegSnap3 = await getDocs(pRegQ3);
      for (const d of pRegSnap3.docs) {
        if (d.id === hospitalId || d.id === hospitalId) {
          console.log(`Deleting patients/${pId}/hospital_registrations/${d.id}`);
          await deleteDoc(doc(db, `patients/${pId}/hospital_registrations`, d.id));
        }
      }
    } catch(e) { console.error('err3', e.message); }
    
    try {
      const pVisQ = collection(db, `patients/${pId}/visits`);
      const pVisSnap = await getDocs(pVisQ);
      for (const d of pVisSnap.docs) {
          console.log(`Deleting patients/${pId}/visits/${d.id}`);
          await deleteDoc(doc(db, `patients/${pId}/visits`, d.id));
      }
    } catch(e) { console.error('err4', e.message); }
  }

  try {
    const globalRegQ1 = query(collection(db, 'hospital_registrations'), where('abhaId', '==', abhaId));
    const globalRegSnap1 = await getDocs(globalRegQ1);
    for (const d of globalRegSnap1.docs) {
      console.log(`Deleting global hospital_registrations/${d.id}`);
      await deleteDoc(doc(db, 'hospital_registrations', d.id));
    }
  } catch(e) { console.error('err5', e.message); }
  
  for (const pId of patientIds) {
    try {
      const globalRegQ3 = query(collection(db, 'hospital_registrations'), where('patientId', '==', pId));
      const globalRegSnap3 = await getDocs(globalRegQ3);
      for (const d of globalRegSnap3.docs) {
        console.log(`Deleting global hospital_registrations/${d.id}`);
        await deleteDoc(doc(db, 'hospital_registrations', d.id));
      }
    } catch(e) { console.error('err6', e.message); }
  }

  try {
    const encountersQ = query(collection(db, 'encounters'), where('hospitalId', '==', hospitalId));
    const encountersSnap = await getDocs(encountersQ);
    for (const d of encountersSnap.docs) {
      if (d.data().patient?.id === patientIds[0] || d.data().patient?.abhaId === abhaId) {
        console.log(`Deleting encounters/${d.id}`);
        await deleteDoc(doc(db, 'encounters', d.id));
      }
    }
  } catch(e) { console.error('err7', e.message); }
  
  try {
    const encountersQ2 = query(collection(db, 'encounters'), where('hospital_id', '==', hospitalId));
    const encountersSnap2 = await getDocs(encountersQ2);
    for (const d of encountersSnap2.docs) {
      if (d.data().patient?.id === patientIds[0] || d.data().patient?.abhaId === abhaId) {
        console.log(`Deleting encounters/${d.id}`);
        await deleteDoc(doc(db, 'encounters', d.id));
      }
    }
  } catch(e) { console.error('err8', e.message); }

  const collectionsToCheck = ['historySessions', 'documentUploads', 'structuredSummaries', 'redFlagAlerts', 'sessions'];
  for (const collName of collectionsToCheck) {
    try {
      const q = query(collection(db, collName));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
         if (d.data().patientId === patientIds[0] || d.data().patient?.id === patientIds[0] || d.data().abhaId === abhaId) {
           console.log(`Deleting ${collName}/${d.id}`);
           await deleteDoc(doc(db, collName, d.id));
         }
      }
    } catch(e) { console.error('err9 for ' + collName, e.message); }
  }
  
  console.log('Cleanup complete');
  process.exit(0);
}

cleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
