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
  serverTimestamp,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================
   Firebase Config
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

// Filter
const filterWerber = document.getElementById("filterWerber");
const filterAktivitaet = document.getElementById("filterAktivitaet");
const sortDatum = document.getElementById("sortDatum");

// Statistik
const statTotal = document.getElementById("statTotal");
const statAktiv = document.getElementById("statAktiv");
const statSehrAktiv = document.getElementById("statSehrAktiv");
const statAbgelehnt = document.getElementById("statAbgelehnt");

// CSV Export Button
const exportCsvBtn = document.getElementById("exportCsvBtn");

// Bearbeiten-Overlay Elemente
const editOverlay = document.getElementById("editOverlay");
const editAktivitaet = document.getElementById("editAktivitaet");
const editModsAktionen = document.getElementById("editModsAktionen");
const saveEditBtn = document.getElementById("saveEdit");
const cancelEditBtn = document.getElementById("cancelEdit");

// aktuell bearbeitetes Dokument
let currentEditId = null;

/* ===========================
   Collections
   =========================== */

const ambassadorsCol = collection(db, "ambassadors");
const invitesCol = collection(db, "ambassadorInvites");
let allInvites = [];

/* ===========================
   Ambassadors laden
   =========================== */

async function loadAmbassadors() {
  const snapshot = await getDocs(ambassadorsCol);

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

async function loadWerberFilter() {
  const snapshot = await getDocs(ambassadorsCol);

  filterWerber.innerHTML = '<option value="">Alle Werber</option>';

  snapshot.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = data.name;
    option.textContent = data.name;
    filterWerber.appendChild(option);
  });
}

loadWerberFilter();

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
  loadWerberFilter();
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
   Tabelle neu rendern
   =========================== */

function renderTable(list) {
  invitesTableBody.innerHTML = "";

  list.forEach((data) => {
    const tr = document.createElement("tr");

    const twitchCell = data.twitchLink
      ? `<a href="${data.twitchLink}" target="_blank" class="twitch-link">Link</a>`
      : "-";

    tr.innerHTML = `
      <td>${data.werberName}</td>
      <td>${data.geworbenerName}</td>
      <td>${twitchCell}</td>
      <td>${data.datum}</td>
      <td>${data.aktivitaet}</td>
      <td>${data.zusageGesendet ? "ja" : "nein"}</td>
      <td>${data.modsAktionen || ""}</td>
      <td>
        <button class="edit-btn" data-id="${data.id}">Bearbeiten</button>
      </td>
    `;

    invitesTableBody.appendChild(tr);
  });

  // Bearbeiten-Buttons nach dem Rendern verdrahten
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openEditForm(id);
    });
  });
}

function openEditForm(id) {
  currentEditId = id;

  const entry = allInvites.find(i => i.id === id);
  if (!entry) {
    console.error("Eintrag für Bearbeitung nicht gefunden:", id);
    return;
  }

  // Felder im Overlay mit aktuellen Werten füllen
  editAktivitaet.value = entry.aktivitaet || "probezeit";
  editModsAktionen.value = entry.modsAktionen || "";

  editOverlay.classList.remove("hidden");
}

/* ===========================
   Filter anwenden
   =========================== */

function applyFilters() {
  let filtered = [...allInvites];

  if (filterWerber.value !== "") {
    filtered = filtered.filter(i => i.werberName === filterWerber.value);
  }

  if (filterAktivitaet.value !== "") {
    filtered = filtered.filter(i => i.aktivitaet === filterAktivitaet.value);
  }

  filtered.sort((a, b) => {
    if (sortDatum.value === "desc") {
      return b.datum.localeCompare(a.datum);
    } else {
      return a.datum.localeCompare(b.datum);
    }
  });

  renderTable(filtered);
}

/* ===========================
   Statistik aktualisieren
   =========================== */

function updateStats() {
  statTotal.textContent = allInvites.length;
  statAktiv.textContent = allInvites.filter(i => i.aktivitaet === "aktiv").length;
  statSehrAktiv.textContent = allInvites.filter(i => i.aktivitaet === "sehr_aktiv").length;
  statAbgelehnt.textContent = allInvites.filter(i => i.aktivitaet === "abgelehnt").length;
}

/* ===========================
   Live-Daten aus Firestore
   =========================== */

function subscribeInvites() {
  const q = query(invitesCol, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    allInvites = [];

    snapshot.forEach((d) => {
  allInvites.push({
    id: d.id,
    ...d.data()
  });
});

    applyFilters();
    updateStats();
  });
}

subscribeInvites();

/* ===========================
   CSV Export
   =========================== */

function exportCSV() {
  if (allInvites.length === 0) {
    alert("Keine Daten zum Exportieren.");
    return;
  }

  const header = [
    "Werber",
    "Geworbener",
    "Twitch",
    "Datum",
    "Aktivität",
    "Zusage",
    "Mods"
  ];

  const rows = allInvites.map(i => [
    i.werberName,
    i.geworbenerName,
    i.twitchLink,
    i.datum,
    i.aktivitaet,
    i.zusageGesendet ? "ja" : "nein",
    i.modsAktionen
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [header, ...rows].map(e => e.join(";")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "hrx-ambassador-export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

exportCsvBtn.addEventListener("click", exportCSV);

/* ===========================
   Filter Events
   =========================== */

filterWerber.addEventListener("change", applyFilters);
filterAktivitaet.addEventListener("change", applyFilters);
sortDatum.addEventListener("change", applyFilters);

// Bearbeiten abbrechen
cancelEditBtn.addEventListener("click", () => {
  editOverlay.classList.add("hidden");
  currentEditId = null;
});

// Bearbeitung speichern
saveEditBtn.addEventListener("click", async () => {
  if (!currentEditId) return;

  const newAktivitaet = editAktivitaet.value;
  const newModsAktionen = editModsAktionen.value.trim();

  try {
    const ref = doc(db, "ambassadorInvites", currentEditId);

    await updateDoc(ref, {
      aktivitaet: newAktivitaet,
      modsAktionen: newModsAktionen
    });

    editOverlay.classList.add("hidden");
    currentEditId = null;
  } catch (err) {
    console.error("Fehler beim Speichern der Bearbeitung:", err);
    alert("Fehler beim Speichern. Bitte Konsole prüfen.");
  }
});
