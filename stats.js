/* ===========================
   HRX Ambassador – Statistik
   =========================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================
   Firebase Setup
   =========================== */

const firebaseConfig = {
  apiKey: "AIzaSyDTLt6sI8eu_YszVxlYy-YbNMdR981BjQo",
  authDomain: "hrx-ambassador.firebaseapp.com",
  projectId: "hrx-ambassador",
  storageBucket: "hrx-ambassador.firebasestorage.app",
  messagingSenderId: "496071665310",
  appId: "1:496071665310:web:add23c7e301852f998bd8f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const invitesCol = collection(db, "ambassadorInvites");

/* ===========================
   Canvas Elemente
   =========================== */

const chartAktivitaetCanvas = document.getElementById("chartAktivitaet");
const growthCanvas = document.getElementById("growthChart");
const topWerberCanvas = document.getElementById("topWerberChart");

/* ===========================
   KPI Elemente
   =========================== */

const kpiTotal = document.getElementById("kpiTotal");
const kpiAktiv = document.getElementById("kpiAktiv");
const kpiSehrAktiv = document.getElementById("kpiSehrAktiv");
const kpiAbgelehnt = document.getElementById("kpiAbgelehnt");

/* ===========================
   Charts
   =========================== */

let chartAktivitaet = null;
let growthChart = null;
let topWerberChart = null;

/* ===========================
   DataLabels Plugin registrieren
   =========================== */

if (window.Chart && window.ChartDataLabels) {
  Chart.register(ChartDataLabels);
}

/* ===========================
   Daten laden
   =========================== */

async function loadData() {
  const snapshot = await getDocs(invitesCol);

  const allInvites = [];
  snapshot.forEach((doc) => {
    allInvites.push({ id: doc.id, ...doc.data() });
  });

  renderKPIs(allInvites);
  renderAktivitaetChart(allInvites);

  // abgelehnte Bewerbungen NICHT mitzählen in den unteren Charts
  const validInvites = allInvites.filter(i => i.aktivitaet !== "abgelehnt");

  renderGrowth(validInvites);
  renderTopWerber(validInvites);
}

/* ===========================
   KPIs
   =========================== */

function renderKPIs(invites) {
  kpiTotal.textContent = invites.length;
  kpiAktiv.textContent = invites.filter(i => i.aktivitaet === "aktiv").length;
  kpiSehrAktiv.textContent = invites.filter(i => i.aktivitaet === "sehr_aktiv").length;
  kpiAbgelehnt.textContent = invites.filter(i => i.aktivitaet === "abgelehnt").length;
}

/* ===========================
   Tortendiagramm – Aktivität
   =========================== */

function renderAktivitaetChart(invites) {
  const counts = {
    probezeit: invites.filter(i => i.aktivitaet === "probezeit").length,
    aktiv: invites.filter(i => i.aktivitaet === "aktiv").length,
    sehr_aktiv: invites.filter(i => i.aktivitaet === "sehr_aktiv").length,
    abgelehnt: invites.filter(i => i.aktivitaet === "abgelehnt").length
  };

  if (chartAktivitaet) chartAktivitaet.destroy();

  chartAktivitaet = new Chart(chartAktivitaetCanvas, {
    type: "pie",
    data: {
      labels: ["Probezeit", "Aktiv", "Sehr aktiv", "Abgelehnt"],
      datasets: [{
        data: [
          counts.probezeit,
          counts.aktiv,
          counts.sehr_aktiv,
          counts.abgelehnt
        ],
        backgroundColor: [
          "#c7a6ff",
          "#7b3fe4",
          "#5b2bb0",
          "#ff6b6b"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      animation: {
        duration: 900,
        easing: "easeOutCubic"
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20 }
        },
        datalabels: {
          color: "#333",
          font: { weight: "bold", size: 12 },
          delay: 200
        }
      }
    }
  });
}

/* ===========================
   Wachstum über Zeit
   =========================== */

function renderGrowth(invites) {
  const monthlyCounts = {};

  invites.forEach(i => {
    const month = i.datum.slice(0, 7); // YYYY-MM
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  const labels = Object.keys(monthlyCounts).sort();
  const values = labels.map(m => monthlyCounts[m]);

  if (growthChart) growthChart.destroy();

  growthChart = new Chart(growthCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Geworbene pro Monat",
        data: values,
        borderColor: "#7b3fe4",
        backgroundColor: "rgba(123, 63, 228, 0.25)",
        borderWidth: 3,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      layout: {
        padding: { top: 30 }
      },
      animation: {
        duration: 900,
        easing: "easeOutCubic"
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 2 },
          grace: 2
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20 }
        },
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#333",
          font: { weight: "bold", size: 12 },
          delay: 200
        }
      }
    }
  });
}

/* ===========================
   Top Werber
   =========================== */

function renderTopWerber(invites) {
  const werberCounts = {};

  invites.forEach(i => {
    werberCounts[i.werberName] = (werberCounts[i.werberName] || 0) + 1;
  });

  // ❗ Diese Namen sollen NICHT angezeigt werden
  const hidden = ["ChatroyX", "HyptryX", "WalkingDavidson", "RoninMartoku"];

  // Labels + Werte filtern
  const labels = Object.keys(werberCounts).filter(w => !hidden.includes(w));
  const values = labels.map(w => werberCounts[w]);

  if (topWerberChart) topWerberChart.destroy();

  topWerberChart = new Chart(topWerberCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Geworbene",
        data: values,
        backgroundColor: "#7b3fe4",
        borderColor: "#5b2bb0",
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      layout: {
        padding: { top: 30 }
      },
      animation: {
        duration: 900,
        easing: "easeOutCubic"
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 2 },
          grace: 2
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 20 }
        },
        datalabels: {
          anchor: "end",
          align: "top",
          color: "#333",
          font: { weight: "bold", size: 12 },
          delay: 200
        }
      }
    }
  });
}

/* ===========================
   Start
   =========================== */

window.addEventListener("DOMContentLoaded", () => {
  loadData();
});

