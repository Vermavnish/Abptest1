
import { db } from "./firebase-config.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const batchId = sessionStorage.getItem("selectedBatchId");
const contentContainer = document.getElementById("content-container");

if (!batchId) {
  contentContainer.innerHTML = "<p>No batch selected.</p>";
} else {
  const loadContent = async () => {
    const batchSnap = await getDoc(doc(db, "batches", batchId));
    if (!batchSnap.exists()) {
      contentContainer.innerHTML = "<p>Batch not found.</p>";
      return;
    }

    const batchData = batchSnap.data();
    for (let subject in batchData.subjects) {
      const subjectWrapper = document.createElement("div");
      subjectWrapper.style.marginBottom = "20px";

      const subjectHeader = document.createElement("h3");
      subjectHeader.textContent = subject;
      subjectHeader.style.cursor = "pointer";
      subjectHeader.style.color = "#007bff";

      const contentDiv = document.createElement("div");
      contentDiv.style.display = "none";

      subjectHeader.onclick = () => {
        contentDiv.style.display = contentDiv.style.display === "none" ? "block" : "none";
      };

      batchData.subjects[subject].forEach(item => {
        if (item.type === "video") {
          const match = item.url.match(/(?:v=|\.be\/)([\w-]+)/);
          if (match) {
            const videoId = match[1];
            contentDiv.innerHTML += \`
              <div>
                <p><strong>\${item.title}</strong></p>
                <iframe style="width:100%; aspect-ratio: 16/9;" src="https://www.youtube.com/embed/\${videoId}" frameborder="0" allowfullscreen></iframe>
              </div>
            \`;
          }
        } else {
          contentDiv.innerHTML += `<p><a href="\${item.url}" target="_blank">\${item.title} (\${item.type})</a></p>`;
        }
      });

      subjectWrapper.appendChild(subjectHeader);
      subjectWrapper.appendChild(contentDiv);
      contentContainer.appendChild(subjectWrapper);
    }
  };

  loadContent();
}
