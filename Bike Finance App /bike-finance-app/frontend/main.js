const STORAGE_KEY = "bikeFinanceAppData";

let bikes = [];
let totalMoney = 0;
let editIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const currentDate = new Date();

const day = String(currentDate.getDate()).padStart(2, "0"); // e.g., "04"
const month = currentDate.toLocaleString("en-US", { month: "long" }); // e.g., "July"
const year = currentDate.getFullYear(); // e.g., 2025

const formattedDate = `${day} ${month} ${year}`; // e.g., "04 July 2025"
document.getElementById("current-date").textContent = formattedDate;

  updateDashboard();
});

function saveData() {
  const data = { bikes, totalMoney };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const data = JSON.parse(savedData);
    bikes = data.bikes || [];
    totalMoney = data.totalMoney || 0;
  }
}

function updateDashboard() {
  document.getElementById("total-money").textContent = totalMoney.toFixed(2);

  const activeBikes = bikes.filter(b => b.active).length;
  document.getElementById("active-bikes").textContent = activeBikes;

  // Outstanding Money = unpaid active bikes
  const outstandingMoney = bikes.reduce(
    (sum, b) => (b.active && !b.paidThisMonth) ? sum + b.dashboardCut : sum, 0
  );
  document.getElementById("outstanding-money").textContent = outstandingMoney.toFixed(2);

  // Monthly Income Summary = active bikes total
  const monthlyIncome = bikes.reduce(
    (sum, b) => b.active ? sum + b.dashboardCut : sum, 0
  );
  document.getElementById("monthly-income").textContent = monthlyIncome.toFixed(2);

  // Bikes close to expiry (22–23 months)
  const closeToExpire = bikes.filter(
    b => b.active && b.monthsActive >= 22 && b.monthsActive < 24
  ).length;
  document.getElementById("close-expiry").textContent = closeToExpire;

  // Expired bikes (>=24 months)
  const expiredBikes = bikes.filter(b => b.monthsActive >= 24).length;
  document.getElementById("expired-bikes").textContent = expiredBikes;

  // Drivers who haven’t paid
  const unpaidDrivers = bikes.filter(b => b.active && !b.paidThisMonth).length;
  document.getElementById("unpaid-drivers").textContent = unpaidDrivers;

  // Can buy new bike logic (show how many)
  const bikePrice = 18000;
  const bikesYouCanBuy = Math.floor(totalMoney / bikePrice);
  document.getElementById("can-buy").textContent =
    bikesYouCanBuy > 0 ? `${bikesYouCanBuy} bike${bikesYouCanBuy > 1 ? "s" : ""}` : "No";

  renderBikes();
  saveData();
}

function renderBikes(filteredBikes = bikes) {
  const tbody = document.getElementById("bikes-table-body");
  tbody.innerHTML = "";

  filteredBikes.forEach((bike, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${bike.name}</td>
      <td>${bike.driver.name}</td>
      <td>${bike.driver.phone}</td>
      <td>${bike.licensePlate}</td>
      <td>${bike.dateBought}</td>
      <td>
        <button class="status-button ${bike.active ? "active" : "inactive"}" onclick="toggleBike(${index})">
          ${bike.active ? "Active" : "Inactive"}
        </button>
      </td>
      <td>
        <button class="paid-button ${bike.paidThisMonth ? "paid" : "not-paid"}" onclick="togglePayment(${index})">
          ${bike.paidThisMonth ? "Paid" : "Not Paid"}
        </button>
      </td>
      <td>
        <button class="edit-btn" onclick="editBike(${index})">Edit</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function adjustMoney(type) {
  const amount = parseFloat(prompt(`Enter amount to ${type}:`));
  if (!isNaN(amount)) {
    totalMoney += type === "add" ? amount : -amount;
    updateDashboard();
  }
}

function buyNewBike() {
  const bikePrice = parseFloat(prompt("Enter the price of the bike you are buying:"));
  if (isNaN(bikePrice) || bikePrice <= 0) {
    alert("Invalid bike price entered.");
    return;
  }
  if (totalMoney >= bikePrice) {
    totalMoney -= bikePrice;
    alert(`R${bikePrice} deducted. Please add your new bike details.`);
    openAddBikeForm();
    updateDashboard();
  } else {
    alert(`You don’t have enough money. You need R${bikePrice} but only have R${totalMoney.toFixed(2)}.`);
  }
}

function openAddBikeForm() {
  editIndex = null;
  document.getElementById("form-title").textContent = "Add a New Bike";
  document.getElementById("bike-modal").style.display = "flex";
  clearForm();
  document.getElementById("date-bought").valueAsDate = new Date();
}

function editBike(index) {
  editIndex = index;
  const bike = bikes[index];
  document.getElementById("form-title").textContent = `Edit Bike: ${bike.name}`;
  document.getElementById("bike-name").value = bike.name;
  document.getElementById("bike-name").disabled = true; // Disable Bike ID
  document.getElementById("license-plate").value = bike.licensePlate;
  document.getElementById("date-bought").value = bike.dateBought;
  document.getElementById("dashboard-cut").value = bike.dashboardCut;
  document.getElementById("driver-name").value = bike.driver.name;
  document.getElementById("driver-phone").value = bike.driver.phone;
  document.getElementById("bike-active").checked = bike.active;
  document.getElementById("bike-modal").style.display = "flex";
}

function cancelEdit() {
  document.getElementById("bike-modal").style.display = "none";
  clearForm();
}

function clearForm() {
  document.querySelector("form").reset();
  document.getElementById("bike-name").disabled = false;
}

function saveBike(event) {
  event.preventDefault();
  const name = document.getElementById("bike-name").value.trim();
  const licensePlate = document.getElementById("license-plate").value.trim();
  const dateBought = document.getElementById("date-bought").value;
  const cut = parseFloat(document.getElementById("dashboard-cut").value);
  const driverName = document.getElementById("driver-name").value.trim();
  const driverPhone = document.getElementById("driver-phone").value.trim();
  const isActive = document.getElementById("bike-active").checked;

  if (!name || !licensePlate || !dateBought || !driverName || !driverPhone || isNaN(cut)) {
    alert("Please fill in all fields.");
    return;
  }

  if (editIndex === null) {
    bikes.push({
      name,
      licensePlate,
      dateBought,
      dashboardCut: cut,
      active: isActive,
      monthsActive: 0,
      paidThisMonth: false,
      driver: {
        name: driverName,
        phone: driverPhone
      }
    });
  } else {
    const bike = bikes[editIndex];
    bike.licensePlate = licensePlate;
    bike.dateBought = dateBought;
    bike.dashboardCut = cut;
    bike.active = isActive;
    bike.driver.name = driverName;
    bike.driver.phone = driverPhone;
  }

  cancelEdit();
  updateDashboard();
}

function toggleBike(index) {
  bikes[index].active = !bikes[index].active;
  updateDashboard();
}

function togglePayment(index) {
  const bike = bikes[index];
  if (!bike.active) {
    alert("This bike is inactive and cannot be paid.");
    return;
  }

  if (bike.paidThisMonth) {
    if (confirm(`Undo payment for ${bike.driver.name}? This will deduct R${bike.dashboardCut} from the dashboard.`)) {
      totalMoney -= bike.dashboardCut;
      bike.paidThisMonth = false;
      alert(`${bike.driver.name}'s payment was undone.`);
    }
  } else {
    totalMoney += bike.dashboardCut;
    bike.paidThisMonth = true;
    alert(`${bike.driver.name} has paid R${bike.dashboardCut} to the dashboard.`);
  }
  updateDashboard();
}

function toggleBikeList() {
  const table = document.getElementById("bikes-table");
  const controls = document.getElementById("bike-controls");
  const toggleIcon = document.getElementById("toggle-icon");

  if (table.style.display === "none") {
    table.style.display = "table";
    controls.style.display = "flex";
    toggleIcon.textContent = "➖";
  } else {
    table.style.display = "none";
    controls.style.display = "none";
    toggleIcon.textContent = "➕";
  }
}

function filterBikes() {
  const searchValue = document.getElementById("search-bar").value.toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;
  const sortValue = document.getElementById("sort-options").value;

  let filtered = bikes.filter(bike => {
    const matchesSearch =
      bike.name.toLowerCase().includes(searchValue) ||
      bike.driver.name.toLowerCase().includes(searchValue) ||
      bike.driver.phone.includes(searchValue) ||
      bike.licensePlate.toLowerCase().includes(searchValue) ||
      bike.dateBought.includes(searchValue);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && bike.active) ||
      (statusFilter === "inactive" && !bike.active);

    return matchesSearch && matchesStatus;
  });

  // Sort filtered array if sort option selected
  switch (sortValue) {
    case "id-asc":
      filtered.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      break;
    case "id-desc":
      filtered.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      break;
    case "date-asc":
      filtered.sort((a, b) => new Date(a.dateBought) - new Date(b.dateBought));
      break;
    case "date-desc":
      filtered.sort((a, b) => new Date(b.dateBought) - new Date(a.dateBought));
      break;
    case "status-asc":
      filtered.sort((a, b) => (a.active === b.active) ? 0 : a.active ? 1 : -1);
      break;
    case "status-desc":
      filtered.sort((a, b) => (a.active === b.active) ? 0 : a.active ? -1 : 1);
      break;
    case "paid-asc":
      filtered.sort((a, b) => (a.paidThisMonth === b.paidThisMonth) ? 0 : a.paidThisMonth ? 1 : -1);
      break;
    case "paid-desc":
      filtered.sort((a, b) => (a.paidThisMonth === b.paidThisMonth) ? 0 : a.paidThisMonth ? -1 : 1);
      break;
  }

  renderBikes(filtered);
}

window.onclick = function (event) {
  const modal = document.getElementById("bike-modal");
  if (event.target === modal) {
    modal.style.display = "none";
    clearForm();
  }
};
