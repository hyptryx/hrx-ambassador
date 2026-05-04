/* ===========================
   HRX Ambassador – Statistik
   =========================== */

// Firestore laden
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore();

// Collections
const invitesCol = collection(db, "ambassadorInvites");

// Canvas Elemente
const growthCanvas = document.getElementById("growthChart");
const topWerberCanvas = document.getElementById("topWerberChart");

// Charts
let growthChart = null;
let topWerberChart = null;

/* ===========================
   Daten laden & filtern
   =========================== */

async function loadData() {
  const snapshot = await getDocs(invitesCol);

  const allInvites = [];
  snapshot.forEach((doc) => {
    allInvites.push({ id: doc.id, ...doc.data() });
  });

  // ❗ Abgelehnte Bewerbungen rausfiltern
  const validInvites = allInvites.filter(i => i.aktivitaet !== "abgelehnt");

  renderGrowth(validInvites);
  renderTopWerber(validInvites);
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
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 2 }
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
          font: { weight: "bold", size: 12 }
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

  const labels = Object.keys(werberCounts);
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
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 2 }
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
          font: { weight: "bold", size: 12 }
        }
      }
    }
  });
}

/* ===========================
   Start
   =========================== */

loadData();
