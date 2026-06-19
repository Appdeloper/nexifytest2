import { db } from './firebase';
import { 
  collection, doc, setDoc, getDoc, updateDoc, 
  onSnapshot, query, orderBy, getDocs, 
  serverTimestamp, arrayUnion, arrayRemove 
} from 'firebase/firestore';

// ── Preferences ──────────────────────────────────────────────
export const subscribeUserPreferences = (uid, callback) => {
  const ref = doc(db, 'users', uid, 'preferences', 'settings');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      // Default preferences
      callback({
        interests: ['Tech', 'Students', 'Focus', 'Motivation'],
        theme: 'dark'
      });
    }
  }, (err) => {
    console.warn("Preferences subscription failed:", err);
    callback({ interests: ['Tech', 'Students', 'Focus', 'Motivation'] });
  });
};

export const updateUserPreferences = async (uid, interests) => {
  const ref = doc(db, 'users', uid, 'preferences', 'settings');
  await setDoc(ref, {
    interests,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// ── Saved posts ──────────────────────────────────────────────
export const subscribeSavedEdgePosts = (uid, callback) => {
  const ref = doc(db, 'users', uid, 'saved_edge', 'posts');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data().savedIds || []);
    } else {
      callback([]);
    }
  }, (err) => {
    console.warn("Saved edge posts subscription failed:", err);
    callback([]);
  });
};

export const saveEdgePost = async (uid, postId) => {
  const ref = doc(db, 'users', uid, 'saved_edge', 'posts');
  await setDoc(ref, {
    savedIds: arrayUnion(postId),
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const unsaveEdgePost = async (uid, postId) => {
  const ref = doc(db, 'users', uid, 'saved_edge', 'posts');
  await setDoc(ref, {
    savedIds: arrayRemove(postId),
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// ── Edge Posts ───────────────────────────────────────────────
export const subscribeEdgePosts = (callback) => {
  const q = query(
    collection(db, 'edge_posts'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(posts);
  }, async (err) => {
    console.warn("Edge posts subscription failed, trying seed check:", err);
    callback([]);
  });
};

// ── Database Seeding ─────────────────────────────────────────
const SEED_POSTS = [
  {
    title: "Vibe Coding with Agentic AI",
    category: "Tech",
    type: "ai",
    content: "The paradigm of software development is shifting from manual coding to conversational alignment. Learn how to guide AI models to architect entire projects while you focus on specifications and systems integration.",
    summary: "AI systems are moving from autocompleting lines to writing entire systems. Developers now act as system editors, aligning AI output with target architectures.",
    createdAt: new Date()
  },
  {
    title: "Master the Pomodoro Rhythm",
    category: "Focus",
    type: "tip",
    content: "Align your work with human biology. Do 25 minutes of hyper-focus, followed by a strict 5-minute offline break (no scrolling). After 4 cycles, reward yourself with 20 minutes of relaxation.",
    summary: "Use biological work-rest cycles (25m focus / 5m rest) to sustain concentration and completely eliminate cognitive fatigue.",
    createdAt: new Date()
  },
  {
    title: "Obsidian: Your Second Brain",
    category: "Tech",
    type: "tool",
    content: "Obsidian is a powerful, markdown-based local knowledge base. It uses bi-directional linking to map relationships between ideas, creating a custom neural web of your knowledge.",
    summary: "Obsidian is a markdown-based local-first notepad. Its bi-directional linking allows you to build an interconnected visual map of your research.",
    createdAt: new Date()
  },
  {
    title: "The Power of Yet",
    category: "Motivation",
    type: "motivation",
    content: "When you feel like you cannot do something, add the word 'yet' to the end of your sentence. 'I don't know how to code this... yet.' It shifts your mindset from fixed to growth, opening up possibilities.",
    summary: "Shift from a fixed mindset to a growth mindset by framing challenges as temporary states of learning using the word 'yet'.",
    createdAt: new Date()
  },
  {
    title: "Consistency Outperforms Intensity",
    category: "Motivation",
    type: "motivation",
    content: "Doing 15 minutes of study or exercise every single day is infinitely better than doing 3 hours once a week. Tiny, consistent efforts build habits that stick and compound over time.",
    summary: "Small, daily actions build permanent neural pathways and habits. Prioritize showing up consistently over occasional extreme efforts.",
    createdAt: new Date()
  },
  {
    title: "Action Over Analysis Paralysis",
    category: "Students",
    type: "news",
    content: "A study on student productivity shows that beginning a task, even with poor initial output, reduces friction by 80%. Motivation is the outcome of action, not the cause of it.",
    summary: "Starting a task removes 80% of mental resistance. Do not wait for inspiration; start working to generate motivation.",
    createdAt: new Date()
  },
  {
    title: "Deep Work Blockers: Context Switching",
    category: "Focus",
    type: "tip",
    content: "It takes an average of 23 minutes to regain deep focus after a single phone interruption. Create a 'Zero Interruption Zone' by putting all devices into AMOLED focus mode.",
    summary: "Interrupted focus requires 23 minutes of refocusing time. Eliminate micro-distractions to maintain long periods of cognitive flow.",
    createdAt: new Date()
  },
  {
    title: "GitDoc: Auto-save Git Versioning",
    category: "Students",
    type: "tool",
    content: "GitDoc is a background utility that automatically commits your codebase changes in response to file modifications or idle intervals. Never lose a working state again.",
    summary: "An automatic background Git committer that captures changes reactively, creating a continuous version history of your projects.",
    createdAt: new Date()
  }
];

export const seedEdgePostsIfEmpty = async () => {
  try {
    const snap = await getDocs(collection(db, 'edge_posts'));
    if (snap.empty) {
      console.log("Seeding edge_posts collection...");
      for (const post of SEED_POSTS) {
        const ref = doc(collection(db, 'edge_posts'));
        await setDoc(ref, {
          ...post,
          createdAt: serverTimestamp()
        });
      }
      console.log("Seeding complete!");
    }
  } catch (e) {
    console.error("Failed to seed edge_posts:", e);
  }
};
