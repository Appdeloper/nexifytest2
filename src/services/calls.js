import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp, getDocs, addDoc
} from 'firebase/firestore';

export const createCallDocument = async (callerId, receiverId, type) => {
  const callRef = doc(collection(db, 'calls'));
  await setDoc(callRef, {
    callId: callRef.id,
    type,
    callerId,
    receiverId,
    status: 'ringing',
    createdAt: serverTimestamp(),
    startedAt: null,
    endedAt: null,
    offer: null,
    answer: null
  });
  return callRef.id;
};

export const listenForIncomingCalls = (uid, callback) => {
  const q = query(
    collection(db, 'calls'),
    where('receiverId', '==', uid),
    where('status', '==', 'ringing')
  );
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback(change.doc.data());
      }
    });
  });
};

export const listenToCallDocument = (callId, callback) => {
  return onSnapshot(doc(db, 'calls', callId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
};

export const acceptCall = async (callId) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'accepted',
    startedAt: serverTimestamp()
  });
};

export const declineCall = async (callId) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'declined',
    endedAt: serverTimestamp()
  });
};

export const endCall = async (callId) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'ended',
    endedAt: serverTimestamp()
  });
};

export const updateCallOffer = async (callId, offer) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { offer });
};

export const updateCallAnswer = async (callId, answer) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { answer });
};

export const addIceCandidate = async (callId, candidate, from) => {
  const candidatesRef = collection(db, 'calls', callId, 'iceCandidates');
  await addDoc(candidatesRef, {
    candidate: candidate.toJSON(),
    from
  });
};

export const subscribeIceCandidates = (callId, excludeFrom, callback) => {
  const candidatesRef = collection(db, 'calls', callId, 'iceCandidates');
  const q = query(candidatesRef, where('from', '!=', excludeFrom));
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback(change.doc.data().candidate);
      }
    });
  });
};

export const loadCallHistory = async (uid, callback) => {
  // To get history for both incoming and outgoing, we would need an OR query, 
  // but firestore makes OR queries complex or requires multiple queries. 
  // We'll use multiple queries and merge or two listeners.
  
  const qCaller = query(collection(db, 'calls'), where('callerId', '==', uid));
  const qReceiver = query(collection(db, 'calls'), where('receiverId', '==', uid));
  
  const updateCombined = (snapshot1, snapshot2) => {
    let combined = [];
    if (snapshot1) combined = [...combined, ...snapshot1.docs.map(d => d.data())];
    if (snapshot2) combined = [...combined, ...snapshot2.docs.map(d => d.data())];
    
    // Sort descending by createdAt
    combined.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });
    
    // Deduplicate
    const unique = [];
    const seen = new Set();
    combined.forEach(c => {
      if (!seen.has(c.callId)) {
        seen.add(c.callId);
        unique.push(c);
      }
    });
    
    callback(unique);
  };

  let snap1, snap2;
  
  const unsub1 = onSnapshot(qCaller, (s) => {
    snap1 = s;
    updateCombined(snap1, snap2);
  });
  
  const unsub2 = onSnapshot(qReceiver, (s) => {
    snap2 = s;
    updateCombined(snap1, snap2);
  });
  
  return () => {
    unsub1();
    unsub2();
  };
};
