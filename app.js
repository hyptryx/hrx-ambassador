/* ===========================
   HRX Ambassador – Firebase Setup
   =========================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================
   Firebase Config einfügen
   =========================== */

const firebaseConfig = {
  apiKey: "AIzaSyDTLt6sI8eu_YszVxlYy-YbNMdR981BjQo",
  authDomain: "hrx-ambassador.firebaseapp.com",
  projectId: "hrx-ambassador",
  storageBucket: "hrx-ambassador.firebasestorage.app",
  messagingSenderId: "496071665310",
  appId: "1:496071665310:web:add23c7e301852f998bd8f"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===========================
   DOM Elemente
   =========================== */

const werberSelect = document.getElementById("werberSelect");
const addAmbassadorBtn = document.getElementById("addAmbassadorBtn");
const inviteForm = document.getElementById("inviteForm");
const invitesTableBody = document.querySelector("#invitesTable tbody");

/* ===========================
   Collections
   =========================== */

const ambassadorsCol = collection(db, "ambassadors");
const invitesCol = collection(db, "ambassadorInvites");

/* ===========================
   Ambassadors laden
   =========================== */

async function loadAmbassadors() {
  const snapshot = await getDocs(ambassadorsCol);

  // Dropdown leeren
  werberSelect.innerHTML = '<option value="">Bitte auswählen...</option>';

  snapshot.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.name;
    werberSelect.appendChild(option);
  });
}

loadAmbassadors();

/* ===========================
   Neuen Ambassador hinzufügen
   =========================== */

addAmbassadorBtn.addEventListener("click", async () => {
  const name = prompt("Name des neuen Ambassadors:");

  if (!name || name.trim() === "") return;

  await addDoc(ambassadorsCol, {
    name: name.trim(),
    createdAt: serverTimestamp()
  });

  loadAmbassadors();
});

/* ===========================
   Formular speichern
   =========================== */

inviteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const werberId = werberSelect.value;
  const werberName = werberSelect.options[werberSelect.selectedIndex]?.text || "";
  const geworbenerName = document.getElementById("geworbenerName").value.trim();
  const twitchLink = document.getElementById("twitchLink").value.trim();
  const datum = document.getElementById("datum").value;
  const aktivitaet = document.getElementById("aktivitaet").value;
  const zusageGesendet = document.getElementById("zusageGesendet").value === "ja";
  const modsAktionen = document.getElementById("modsAktionen").value.trim();

  if (!werberId || !geworbenerName || !datum) {
    alert("Bitte Werber, Geworbenen und Datum ausfüllen.");
    return;
  }

  await addDoc(invitesCol, {
    werberId,
    werberName,
    geworbenerName,
    twitchLink,
    datum,
    aktivitaet,
    zusageGesendet,
    modsAktionen,
    createdAt: serverTimestamp()
  });

  inviteForm.reset();
  werberSelect.value = "";
});

/* ===========================
   Tabelle live aktualisieren
   =========================== */

function renderInviteRow(doc) {
  const data = doc.data();
  const tr = document.createElement("tr");

  const twitchCell = data.twitchLink
    ? `<a href="${data.twitchLink}" target="_blank" class="twitch-link">Link</a>`
    : "-";

  tr.innerHTML = `
    <td>${data.werberName || ""}</td>
    <td>${data.geworbenerName || ""}</td>
    <td>${twitchCell}</td>
    <td>${data.datum || ""}</td>
    <td>${data.aktivitaet || ""}</td>
    <td>${data.zusageGesendet ? "ja" : "nein"}</td>
    <td>${data.modsAktionen || ""}</td>
  `;

  return tr;
}

function subscribeInvites() {
  const q = query(invitesCol, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    invitesTableBody.innerHTML = "";

    snapshot.forEach((doc) => {
      const row = renderInviteRow(doc);
      invitesTableBody.appendChild(row);
    });
  });
}

subscribeInvites();

