// Sortieren
const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

// Diese Namen sollen NICHT in der Grafik erscheinen
const hidden = ["ChatroyX", "HyptryX", "WalkingDavidson", "RoninMartoku"];

// Herausfiltern
const filtered = sorted.filter(([name, _]) => !hidden.includes(name));

// Max-Wert für Skalierung
const max = Math.max(...filtered.map(([_, v]) => v), 1);

// Balken zeichnen
filtered.forEach(([name, score]) => {
    const bar = document.createElement("div");
    bar.className = "chart-bar";

    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = name;

    const track = document.createElement("div");
    track.className = "chart-track";

    const fill = document.createElement("div");
    fill.className = "chart-fill";
    fill.style.width = (score / max * 100) + "%";

    const value = document.createElement("div");
    value.className = "chart-value";
    value.textContent = score;

    track.appendChild(fill);
    bar.appendChild(label);
    bar.appendChild(track);
    bar.appendChild(value);
    chart.appendChild(bar);
});
