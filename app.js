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

// Register
const register = async () => {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "students", email), { batches: [] });
    alert("Registered Successfully");
  } catch (error) {
    alert(error.message);
  }
};

// Login
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

// Logout
const logout = async () => {
  await signOut(auth);
  location.reload();
};

// On Auth Change
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
            div.style.border = "1px solid #ccc";
            div.style.padding = "10px";
            div.style.marginBottom = "15px";
            div.innerHTML = `<h3>${batchData.name}</h3>`;

            for (let subject in batchData.subjects) {
              div.innerHTML += `<h4>${subject}</h4>`;
              batchData.subjects[subject].forEach(item => {
                if (item.type === "video") {
                  const match = item.url.match(/(?:v=|\.be\/)([\w-]+)/);
                  if (match) {
                    const videoId = match[1];
                    div.innerHTML += `
                      <div style="margin-bottom: 10px;">
                        <p><strong>${item.title}</strong></p>
                        <iframe width="100%" height="250" style="max-width: 600px;"
                          src="https://www.youtube.com/embed/${videoId}"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen>
                        </iframe>
                      </div>`;
                  }
                } else {
                  div.innerHTML += `<p><a href="${item.url}" target="_blank">${item.title} (${item.type})</a></p>`;
                }
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
  const batchName = document.getElementById("batch-id-subject").value.trim();
  const subject = document.getElementById("subject-name").value.trim();
  const title = document.getElementById("content-title").value.trim();
  const url = document.getElementById("content-url").value.trim();
  const type = document.getElementById("content-type").value;

  try {
    const querySnapshot = await getDocs(collection(db, "batches"));
    let batchDoc = null;
    let batchId = null;

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.name === batchName) {
        batchDoc = data;
        batchId = docSnap.id;
      }
    });

    if (!batchId) {
      alert("Batch name not found!");
      return;
    }

    const batchRef = doc(db, "batches", batchId);

    if (!batchDoc.subjects[subject]) {
      batchDoc.subjects[subject] = [];
    }

    batchDoc.subjects[subject].push({ title, url, type });

    await setDoc(batchRef, batchDoc);
    alert("Content added to subject");
  } catch (error) {
    alert("Error: " + error.message);
  }
};

window.assignBatch = async () => {
  const email = document.getElementById("student-email").value.trim();
  const batchName = document.getElementById("assign-batch-id").value.trim();

  try {
    const querySnapshot = await getDocs(collection(db, "batches"));
    let batchId = null;

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.name === batchName) {
        batchId = docSnap.id;
      }
    });

    if (!batchId) {
      alert("Batch name not found!");
      return;
    }

    const studentRef = doc(db, "students", email);
    await updateDoc(studentRef, {
      batches: arrayUnion(batchId)
    });
    alert("Batch assigned to student");
  } catch (error) {
    alert("Error assigning batch: " + error.message);
  }
};
