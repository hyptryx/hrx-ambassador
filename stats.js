/* ===========================
   HRX Statistik – Firebase Setup
   =========================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy
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
   Collections
   =========================== */

const invitesCol = collection(db, "ambassadorInvites");

/* ===========================
   DOM Elemente
   =========================== */

const kpiTotal = document.getElementById("kpiTotal");
const kpiAktiv = document.getElementById("kpiAktiv");
const kpiSehrAktiv = document.getElementById("kpiSehrAktiv");
const kpiAbgelehnt = document.getElementById("kpiAbgelehnt");

/* ===========================
   Chart Variablen
   =========================== */

let chartAktivitaet;
let chartWachstum;
let chartTopWerber;

/* ===========================
   Daten live laden
   =========================== */

function subscribeStats() {
  const q = query(invitesCol, orderBy("createdAt", "asc"));

  onSnapshot(q, (snapshot) => {
    const all = [];
    snapshot.forEach((doc) => all.push(doc.data()));

    updateKPIs(all);
    updateCharts(all);
  });
}

subscribeStats();

/* ===========================
   KPI Werte aktualisieren
   =========================== */

function updateKPIs(list) {
  kpiTotal.textContent = list.length;
  kpiAktiv.textContent = list.filter(i => i.aktivitaet === "aktiv").length;
  kpiSehrAktiv.textContent = list.filter(i => i.aktivitaet === "sehr_aktiv").length;
  kpiAbgelehnt.textContent = list.filter(i => i.aktivitaet === "abgelehnt").length;
}

/* ===========================
   Charts aktualisieren
   =========================== */

function updateCharts(list) {

  /* ---------------------------
     1) Aktivität Kreisdiagramm
     --------------------------- */

  const aktivCounts = {
    probezeit: list.filter(i => i.aktivitaet === "probezeit").length,
    aktiv: list.filter(i => i.aktivitaet === "aktiv").length,
    sehr_aktiv: list.filter(i => i.aktivitaet === "sehr_aktiv").length,
    abgelehnt: list.filter(i => i.aktivitaet === "abgelehnt").length
  };

  if (chartAktivitaet) chartAktivitaet.destroy();

  chartAktivitaet = new Chart(
    document.getElementById("chartAktivitaet"),
    {
      type: "pie",
      data: {
        labels: ["Probezeit", "Aktiv", "Sehr aktiv", "Abgelehnt"],
        datasets: [{
          data: [
            aktivCounts.probezeit,
            aktivCounts.aktiv,
            aktivCounts.sehr_aktiv,
            aktivCounts.abgelehnt
          ],
          backgroundColor: [
            "#d6c4ff",
            "#7b3fe4",
            "#5b2bb0",
            "#ff6b6b"
          ]
        }]
      }
    }
  );

  /* ---------------------------
     2) Wachstum über Zeit
     --------------------------- */

  const monthly = {};

  list.forEach(i => {
    if (!i.datum) return;
    const month = i.datum.substring(0, 7); // YYYY-MM
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const months = Object.keys(monthly).sort();
  const values = months.map(m => monthly[m]);

  if (chartWachstum) chartWachstum.destroy();

  chartWachstum = new Chart(
    document.getElementById("chartWachstum"),
    {
      type: "line",
      data: {
        labels: months,
        datasets: [{
          label: "Geworbene pro Monat",
          data: values,
          borderColor: "#7b3fe4",
          backgroundColor: "rgba(123,63,228,0.2)",
          borderWidth: 3,
          tension: 0.3
        }]
      }
    }
  );

  /* ---------------------------
     3) Top Werber
     --------------------------- */

  const werberMap = {};

  list.forEach(i => {
    if (!i.werberName) return;
    werberMap[i.werberName] = (werberMap[i.werberName] || 0) + 1;
  });

  const sortedWerber = Object.entries(werberMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const werberNames = sortedWerber.map(e => e[0]);
  const werberCounts = sortedWerber.map(e => e[1]);

  if (chartTopWerber) chartTopWerber.destroy();

  chartTopWerber = new Chart(
    document.getElementById("chartTopWerber"),
    {
      type: "bar",
      data: {
        labels: werberNames,
        datasets: [{
          label: "Geworbene",
          data: werberCounts,
          backgroundColor: "#7b3fe4"
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    }
  );
}
