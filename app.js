import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0dQtToOsQD6Luv0YOmeethDO5kyimSKA",
  authDomain: "abpclass-7c802.firebaseapp.com",
  projectId: "abpclass-7c802",
  storageBucket: "abpclass-7c802.appspot.com",
  messagingSenderId: "841554153669",
  appId: "1:841554153669:web:6c9d4d84bf521c531b60ac",
  measurementId: "G-Y8HBFK4EV3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.register = async function() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  await createUserWithEmailAndPassword(auth, email, password);
  alert("Registered successfully!");
};

window.login = async function() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  await signInWithEmailAndPassword(auth, email, password);
};

window.logout = async function() {
  await signOut(auth);
  location.reload();
};

onAuthStateChanged(auth, user => {
  if (user) {
    if (user.email === "admin@abp.com") {
      document.getElementById("auth-section").classList.add("hidden");
      document.getElementById("admin-panel").classList.remove("hidden");
    } else {
      loadStudentDashboard(user.email);
    }
  }
});

function loadStudentDashboard(email) {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("student-panel").classList.remove("hidden");

  const studentBatchesContainer = document.getElementById("student-batches");
  studentBatchesContainer.innerHTML = "<h3>Your Batches:</h3>";

  getDoc(doc(db, "students", email)).then(studentDoc => {
    const assignedBatches = studentDoc.data()?.batches || [];
    assignedBatches.forEach(batchName => {
      const batchDiv = document.createElement("div");
      batchDiv.textContent = batchName;
      batchDiv.style.cursor = "pointer";
      batchDiv.style.fontWeight = "bold";

      batchDiv.addEventListener("click", () => {
        showSubjects(batchName, batchDiv);
      });

      studentBatchesContainer.appendChild(batchDiv);
    });
  });
}

function showSubjects(batchName, parentDiv) {
  const subjectsContainer = document.createElement("div");
  subjectsContainer.innerHTML = "<em>Loading subjects...</em>";
  parentDiv.appendChild(subjectsContainer);

  const subjectsRef = collection(db, "batches", batchName, "subjects");
  getDocs(subjectsRef).then(snapshot => {
    subjectsContainer.innerHTML = "";
    snapshot.forEach(docSnap => {
      const subjectName = docSnap.id;
      const subjectDiv = document.createElement("div");
      subjectDiv.textContent = subjectName;
      subjectDiv.style.marginLeft = "15px";
      subjectDiv.style.cursor = "pointer";

      subjectDiv.addEventListener("click", () => {
        showContent(batchName, subjectName, subjectDiv);
      });

      subjectsContainer.appendChild(subjectDiv);
    });
  });
}

function showContent(batchName, subjectName, parentDiv) {
  const contentDiv = document.createElement("div");
  contentDiv.innerHTML = "<em>Loading content...</em>";
  parentDiv.appendChild(contentDiv);

  const subjectDocRef = doc(db, "batches", batchName, "subjects", subjectName);
  getDoc(subjectDocRef).then(docSnap => {
    contentDiv.innerHTML = "";
    const contents = docSnap.data()?.contents || [];
    contents.forEach(item => {
      const itemEl = document.createElement("div");
      itemEl.innerHTML = `<strong>${item.title}</strong> - <a href="\${item.url}" target="_blank">\${item.type}</a>`;
      itemEl.style.marginLeft = "30px";
      contentDiv.appendChild(itemEl);
    });
  });
}

window.createBatch = async function() {
  const batchName = document.getElementById("batch-name").value;
  await setDoc(doc(db, "batches", batchName), {});
  alert("Batch created!");
};

window.addSubjectContent = async function() {
  const batchName = document.getElementById("batch-id-subject").value;
  const subjectName = document.getElementById("subject-name").value;
  const title = document.getElementById("content-title").value;
  const url = document.getElementById("content-url").value;
  const type = document.getElementById("content-type").value;

  const subjectRef = doc(db, "batches", batchName, "subjects", subjectName);
  const existing = await getDoc(subjectRef);
  const contents = existing.exists() ? existing.data().contents || [] : [];
  contents.push({ title, url, type });
  await setDoc(subjectRef, { contents });
  alert("Content added!");
};

window.assignBatch = async function() {
  const email = document.getElementById("student-email").value;
  const batchName = document.getElementById("assign-batch-id").value;

  const studentRef = doc(db, "students", email);
  const studentDoc = await getDoc(studentRef);
  const currentBatches = studentDoc.exists() ? studentDoc.data().batches || [] : [];
  if (!currentBatches.includes(batchName)) currentBatches.push(batchName);
  await setDoc(studentRef, { batches: currentBatches });
  alert("Batch assigned!");
};
