// app.js

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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const register = async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert("Registered Successfully");
    await setDoc(doc(db, "students", email), { batches: [] });
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

        for (let batchId of studentData.batches) {
          const batchSnap = await getDoc(doc(db, "batches", batchId));
          if (batchSnap.exists()) {
            const batchData = batchSnap.data();
            const div = document.createElement("div");
            div.innerHTML = `<h3>${batchData.name}</h3>`;

            for (let subject in batchData.subjects) {
              div.innerHTML += `<h4>${subject}</h4>`;
              batchData.subjects[subject].forEach(item => {
                div.innerHTML += `<p><a href="${item.url}" target="_blank">${item.title} (${item.type})</a></p>`;
              });
            }

            container.appendChild(div);
          }
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
  const batchId = document.getElementById("batch-id-subject").value;
  const subject = document.getElementById("subject-name").value;
  const title = document.getElementById("content-title").value;
  const url = document.getElementById("content-url").value;
  const type = document.getElementById("content-type").value;

  const batchRef = doc(db, "batches", batchId);
  const batchSnap = await getDoc(batchRef);
  if (batchSnap.exists()) {
    const data = batchSnap.data();
    if (!data.subjects[subject]) {
      data.subjects[subject] = [];
    }
    data.subjects[subject].push({ title, url, type });
    await setDoc(batchRef, data);
    alert("Content added to subject");
  }
};

window.assignBatch = async () => {
  const email = document.getElementById("student-email").value;
  const batchId = document.getElementById("assign-batch-id").value;

  const studentRef = doc(db, "students", email);
  await updateDoc(studentRef, {
    batches: arrayUnion(batchId)
  });
  alert("Batch assigned to student");
};
// Paste your full app.js code here
