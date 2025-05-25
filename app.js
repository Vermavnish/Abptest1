// Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "XXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// Login
document.getElementById("login-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});

// Logout
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Create Batch
document.getElementById("create-batch-btn")?.addEventListener("click", async () => {
  const batchName = document.getElementById("batch-name").value;

  if (!batchName) return alert("Enter batch name");

  await addDoc(collection(db, "batches"), {
    name: batchName,
    subjects: {}
  });

  alert("Batch created!");
});

// Assign Batch to Student by Batch Name
document.getElementById("assign-batch-btn")?.addEventListener("click", async () => {
  const studentEmail = document.getElementById("student-email").value;
  const batchName = document.getElementById("batch-name-assign").value;

  try {
    const batchSnap = await getDocs(collection(db, "batches"));
    let found = false;
    let batchId = "";

    batchSnap.forEach(doc => {
      if (doc.data().name === batchName) {
        found = true;
        batchId = doc.id;
      }
    });

    if (!found) return alert("Batch not found");

    const studentRef = doc(db, "students", studentEmail);
    await updateDoc(studentRef, {
      batches: arrayUnion(batchId)
    });

    alert("Batch assigned to student!");
  } catch (e) {
    alert("Error assigning batch: " + e.message);
  }
});

// Load Student Panel
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const studentRef = doc(db, "students", user.email);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      const container = document.getElementById("student-batches");
      if (container) {
        container.innerHTML = "";

        if (!studentData.batches || studentData.batches.length === 0) {
          container.innerHTML = "<p>No batch assigned yet.</p>";
          return;
        }

        for (let batchId of studentData.batches) {
          try {
            const batchSnap = await getDoc(doc(db, "batches", batchId));

            if (batchSnap.exists()) {
              const batchData = batchSnap.data();
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
                div.innerHTML += "<p>No subjects yet.</p>";
              }

              container.appendChild(div);
            }
          } catch (err) {
            console.error("Batch loading error:", err.message);
          }
        }
      }
    }
  }
});
