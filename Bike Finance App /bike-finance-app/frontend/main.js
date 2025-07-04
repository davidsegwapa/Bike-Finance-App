const STORAGE_KEY = "bikeFinanceAppData";

let bikes = [];
let totalMoney = 0;
let editIndex = null;
let lastUpdatedMonth = new Date().getMonth(); // ✅ Keep track of month changes

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  updateCurrentDate();
  updateMonthsActive();
  resetPaymentsIfNewMonth();
  updateDashboard();

  // ✅ Auto-check every 24 hours to keep data fresh
  setInterval(() => {
    updateMonthsActive();
    resetPaymentsIfNewMonth();
    updateDashboard();
  }, 86400000); // Every 24 hours
});

function updateCurrentDate() {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = currentDate.toLocaleString("en-US", { month: "long" });
  const year = currentDate.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;
  document.getElementById("current-date").textContent = formattedDate;
}

function saveData() {
  const currentMonth = new Date().getMonth(); // Save current month
  const data = { bikes, totalMoney, lastUpdatedMonth: currentMonth };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const data = JSON.parse(savedData);
    bikes = data.bikes || [];
    totalMoney = data.totalMoney || 0;
    lastUpdatedMonth = data.lastUpdatedMonth ?? new Date().getMonth();
  }
}

// ✅ Increment monthsActive
function updateMonthsActive() {
  const now = new Date();
  bikes.forEach(bike => {
    const boughtDate = new Date(bike.dateBought);
    const months =
      (now.getFullYear() - boughtDate.getFullYear()) * 12 +
      (now.getMonth() - boughtDate.getMonth());
    bike.monthsActive = months;

    // ✅ Mark expired bikes and force inactive
    if (bike.monthsActive >= 24) {
      bike.expired = true;
      bike.active = false; // Force inactive
    } else {
      bike.expired = false;
    }
  });
}

// ✅ Reset payments monthly
function resetPaymentsIfNewMonth() {
  const currentMonth = new Date().getMonth();
  if (lastUpdatedMonth !== currentMonth) {
    bikes.forEach(bike => {
      bike.paidThisMonth = false;
    });
    lastUpdatedMonth = currentMonth;
    alert("New month detected! All bikes have been reset to 'Not Paid'.");
  }
}

function updateDashboard() {
  document.getElementById("total-money").textContent = totalMoney.toFixed(2);

  const activeBikes = bikes.filter(b => b.active).length;
  document.getElementById("active-bikes").textContent = activeBikes;

  const outstandingMoney = bikes.reduce(
    (sum, b) => (b.active && !b.paidThisMonth) ? sum + b.dashboardCut : sum, 0
  );
  document.getElementById("outstanding-money").textContent = outstandingMoney.toFixed(2);

  const monthlyIncome = bikes.reduce(
    (sum, b) => b.active ? sum + b.dashboardCut : sum, 0
  );
  document.getElementById("monthly-income").textContent = monthlyIncome.toFixed(2);

  const closeToExpire = bikes.filter(
    b => b.active && b.monthsActive >= 22 && b.monthsActive < 24
  ).length;
  document.getElementById("close-expiry").textContent = closeToExpire;

  const expiredBikes = bikes.filter(b => b.monthsActive >= 24).length;
  document.getElementById("expired-bikes").textContent = expiredBikes;

  const unpaidDrivers = bikes.filter(b => b.active && !b.paidThisMonth).length;
  document.getElementById("unpaid-drivers").textContent = unpaidDrivers;

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
    // Mark expired bikes
    if (bike.monthsActive >= 24) {
      bike.expired = true;
    } else {
      bike.expired = false;
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${bike.name}</td>
      <td>${bike.driver.name}</td>
      <td>${bike.driver.phone}</td>
      <td>${bike.licensePlate}</td>
      <td>${bike.dateBought}</td>
      <td>${bike.monthsActive}</td> <!-- ✅ Show monthsActive -->
      <td>
        <button 
          class="status-button ${bike.active ? "active" : "inactive"}" 
          onclick="toggleBike(${index})"
          ${bike.expired ? "disabled" : ""}
        >
          ${bike.active ? "Active" : "Inactive"}
        </button>
      </td>
      <td>
        ${
          bike.expired
            ? `<button class="paid-button expired" disabled>Expired</button>`
            : bike.active
              ? `<button class="paid-button ${bike.paidThisMonth ? "paid" : "not-paid"}" onclick="togglePayment(${index})">
                   ${bike.paidThisMonth ? "Paid" : "Not Paid"}
                 </button>`
              : `<button class="paid-button inactive" disabled>Inactive</button>`
        }
      </td>
      <td>
        <button class="edit-btn" onclick="editBike(${index})">Edit</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function toggleBike(index) {
  const bike = bikes[index];
  if (bike.expired) {
    alert("This bike has expired and cannot be activated.");
    return;
  }
  bike.active = !bike.active;
  updateDashboard();
}

function togglePayment(index) {
  const bike = bikes[index];

  if (bike.expired) {
    alert("This bike has expired and cannot be paid.");
    return;
  }

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
  document.getElementById("bike-name").disabled = true;
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
      driver: { name: driverName, phone: driverPhone }
    });
    showSuccessMessage("Bike added successfully!");
  } else {
    const bike = bikes[editIndex];
    bike.licensePlate = licensePlate;
    bike.dateBought = dateBought;
    bike.dashboardCut = cut;
    bike.active = isActive;
    bike.driver.name = driverName;
    bike.driver.phone = driverPhone;
    showSuccessMessage("Bike updated successfully!");
  }

  updateDashboard();
  setTimeout(cancelEdit, 1500); // Auto-close modal after 1.5s
}

function deleteBike() {
  if (editIndex !== null) {
    const bikeName = bikes[editIndex].name;
    if (confirm(`Are you sure you want to delete ${bikeName}? This cannot be undone.`)) {
      bikes.splice(editIndex, 1);
      showSuccessMessage(`${bikeName} deleted successfully!`);
      updateDashboard();
      setTimeout(cancelEdit, 1500); // Auto-close modal
    }
  }
}

function toggleBike(index) {
  const bike = bikes[index];
  if (bike.active && !bike.expired) {
    if (!confirm(`Mark ${bike.name} as inactive? They won’t show in active bikes anymore.`)) return;
  }
  bike.active = !bike.active;
  updateDashboard();
}

function showSuccessMessage(message) {
  const msgBox = document.createElement("div");
  msgBox.textContent = message;
  msgBox.style.position = "fixed";
  msgBox.style.top = "20px";
  msgBox.style.left = "50%";
  msgBox.style.transform = "translateX(-50%)";
  msgBox.style.backgroundColor = "#4CAF50"; // Green
  msgBox.style.color = "white";
  msgBox.style.padding = "10px 20px";
  msgBox.style.borderRadius = "5px";
  msgBox.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  document.body.appendChild(msgBox);

  setTimeout(() => {
    msgBox.remove();
  }, 1500);
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
      (statusFilter === "inactive" && !bike.active) ||
      (statusFilter === "about-to-expire" && bike.monthsActive >= 22 && bike.monthsActive < 24);

    return matchesSearch && matchesStatus;
  });

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
