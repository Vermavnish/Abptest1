import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const register = async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert("Registered Successfully");

    await setDoc(doc(db, "students", email), {
      batches: []
    });
  } catch (error) {
    alert(error.message);
  }
};

const login = async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully");
  } catch (error) {
    alert(error.message);
  }
};

const logout = async () => {
  await signOut(auth);
  location.reload();
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("auth-section").classList.add("hidden");

    if (user.email === "admin@abp.com") {
      document.getElementById("admin-panel").classList.remove("hidden");
    } else {
      document.getElementById("student-panel").classList.remove("hidden");
const studentRef = doc(db, "students", user.email);
const studentSnap = await getDoc(studentRef);

if (studentSnap.exists()) {
  const studentData = studentSnap.data();
  const container = document.getElementById("student-batches");
  container.innerHTML = "";

  console.log("Student batches:", studentData.batches);

  if (studentData.batches.length === 0) {
    container.innerHTML = "<p>No batch assigned yet.</p>";
    return;
  }

  for (let batchId of studentData.batches) {
    try {
      const batchDocRef = doc(db, "batches", batchId);
      const batchSnap = await getDoc(batchDocRef);

      if (batchSnap.exists()) {
        const batchData = batchSnap.data();
        console.log("Loaded batch:", batchData);

        const div = document.createElement("div");
        div.innerHTML = `<h3>${batchData.name}</h3>`;

        if (batchData.subjects) {
          for (let subject in batchData.subjects) {
            div.innerHTML += `<h4>${subject}</h4>`;
            batchData.subjects[subject].forEach(item => {
              div.innerHTML += `<p><a href="${item.url}" target="_blank">${item.title} (${item.type})</a></p>`;
            });
          }
        } else {
          div.innerHTML += "<p>No subjects added yet.</p>";
        }

        container.appendChild(div);
      } else {
        console.warn("Batch ID not found:", batchId);
      }
    } catch (e) {
      console.error("Error loading batch:", e.message);
    }
  }
} else {
  console.error("Student document not found.");
  }
      }
    }
  }
});

// Admin Functions

window.register = register;
window.login = login;
window.logout = logout;

window.createBatch = async () => {
  const name = document.getElementById("batch-name").value;
  try {
    const docRef = await addDoc(collection(db, "batches"), {
      name,
      subjects: {}
    });
    alert("Batch Created: " + docRef.id);
  } catch (e) {
    alert("Error adding batch: " + e);
  }
};

window.addSubjectContent = async () => {
  const batchName = document.getElementById("batch-id-subject").value;
  const subject = document.getElementById("subject-name").value;
  const title = document.getElementById("content-title").value;
  const url = document.getElementById("content-url").value;
  const type = document.getElementById("content-type").value;

  const q = query(collection(db, "batches"), where("name", "==", batchName));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert("Batch not found");
    return;
  }

  const batchDoc = querySnapshot.docs[0];
  const data = batchDoc.data();

  if (!data.subjects[subject]) {
    data.subjects[subject] = [];
  }
  data.subjects[subject].push({ title, url, type });

  await setDoc(batchDoc.ref, data);
  alert("Content added to subject");
};

window.assignBatch = async () => {
  const email = document.getElementById("student-email").value;
  const batchName = document.getElementById("assign-batch-id").value;

  try {
    const q = query(collection(db, "batches"), where("name", "==", batchName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("Batch not found");
      return;
    }

    const batchDoc = querySnapshot.docs[0];
    const batchId = batchDoc.id;

    const studentRef = doc(db, "students", email);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      alert("Student not found. Make sure they are registered.");
      return;
    }

    await updateDoc(studentRef, {
      batches: arrayUnion(batchId)
    });

    alert("Batch assigned to student");
  } catch (error) {
    alert("Error assigning batch: " + error.message);
  }
};
