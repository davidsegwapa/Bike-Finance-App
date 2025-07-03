const bikes = [];
let totalMoney = 0;

document.addEventListener("DOMContentLoaded", () => {
  const date = new Date().toLocaleDateString();
  document.getElementById("current-date").textContent = date;
  updateDashboard();
});

function updateDashboard() {
  document.getElementById("total-money").textContent = totalMoney;
  const activeBikes = bikes.filter(b => b.active).length;
  document.getElementById("active-bikes").textContent = activeBikes;
  document.getElementById("can-buy").textContent = totalMoney >= 15000 ? "Yes" : "No";
  renderBikes();
}

function renderBikes() {
  const container = document.getElementById("bikes-container");
  container.innerHTML = "";
  bikes.forEach((bike, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${bike.name}</strong> - R${bike.income}/mo - ${bike.active ? "🟢 Active" : "⚪ Inactive"}
      <br>Driver: ${bike.driver}
      <br><button onclick="toggleBike(${index})">Toggle Active</button>
    `;
    div.style.marginBottom = "10px";
    container.appendChild(div);
  });
}

function adjustMoney(type) {
  const amount = parseFloat(prompt(`Enter amount to ${type}:`));
  if (!isNaN(amount)) {
    totalMoney += type === "add" ? amount : -amount;
    updateDashboard();
  }
}

function openAddBikeForm() {
  document.getElementById("add-bike-form").style.display = "block";
}

function addBike(event) {
  event.preventDefault();
  const name = document.getElementById("bike-name").value;
  const income = parseFloat(document.getElementById("monthly-income").value);
  const cut = parseFloat(document.getElementById("dashboard-cut").value);
  const driver = document.getElementById("driver-name").value;

  if (income > 2500 || cut > income) {
    alert("Invalid amounts");
    return;
  }

  bikes.push({
    name,
    income,
    dashboardCut: cut,
    driver,
    active: true,
    monthsActive: 0
  });

  totalMoney += cut;
  document.getElementById("add-bike-form").reset();
  document.getElementById("add-bike-form").style.display = "none";
  updateDashboard();
}
