// ================= Module configuration =================
// Each module: API name, heading, ID field, form fields, table columns
const modules = {
    patients: {
        title: "Patients",
        idField: "patientId",
        fields: [
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "name", label: "Name", type: "text", required: true },
            { name: "age", label: "Age", type: "number", required: true },
            { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true },
            { name: "contact", label: "Contact", type: "text", required: true },
            { name: "address", label: "Address", type: "text" },
            { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] }
        ]
    },
    doctors: {
        title: "Doctors",
        idField: "doctorId",
        fields: [
            { name: "doctorId", label: "Doctor ID", type: "text", required: true },
            { name: "name", label: "Name", type: "text", required: true },
            { name: "specialization", label: "Specialization", type: "text", required: true },
            { name: "departmentId", label: "Department ID", type: "text" },
            { name: "contact", label: "Contact", type: "text" },
            { name: "experience", label: "Experience (years)", type: "number" }
        ]
    },
    appointments: {
        title: "Appointments",
        idField: "appointmentId",
        fields: [
            { name: "appointmentId", label: "Appointment ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "doctorId", label: "Doctor ID", type: "text", required: true },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
            { name: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] }
        ]
    },
    departments: {
        title: "Departments",
        idField: "departmentId",
        fields: [
            { name: "departmentId", label: "Department ID", type: "text", required: true },
            { name: "name", label: "Department Name", type: "text", required: true },
            { name: "head", label: "Head of Department", type: "text" },
            { name: "location", label: "Location / Floor", type: "text" }
        ]
    },
    medicalRecords: {
        title: "Medical Records",
        idField: "recordId",
        fields: [
            { name: "recordId", label: "Record ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "doctorId", label: "Doctor ID", type: "text", required: true },
            { name: "diagnosis", label: "Diagnosis", type: "text", required: true },
            { name: "date", label: "Date", type: "date" },
            { name: "notes", label: "Notes", type: "text" }
        ]
    },
    prescriptions: {
        title: "Prescriptions",
        idField: "prescriptionId",
        fields: [
            { name: "prescriptionId", label: "Prescription ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "doctorId", label: "Doctor ID", type: "text", required: true },
            { name: "medicine", label: "Medicine", type: "text", required: true },
            { name: "dosage", label: "Dosage", type: "text" },
            { name: "duration", label: "Duration", type: "text" }
        ]
    },
    billing: {
        title: "Billing",
        idField: "billId",
        fields: [
            { name: "billId", label: "Bill ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "amount", label: "Amount (₹)", type: "number", required: true },
            { name: "date", label: "Date", type: "date" },
            { name: "status", label: "Payment Status", type: "select", options: ["Paid", "Pending", "Partial"] }
        ]
    },
    hospitals: {
        title: "Hospitals",
        idField: "hospitalId",
        fields: [
            { name: "hospitalId", label: "Hospital ID", type: "text", required: true },
            { name: "name", label: "Hospital Name", type: "text", required: true },
            { name: "city", label: "City", type: "text" },
            { name: "contact", label: "Contact", type: "text" },
            { name: "beds", label: "Total Beds", type: "number" }
        ]
    }
};

// ================= State & elements =================
let currentModule = null;
let currentRecords = [];

const navButtons = document.querySelectorAll(".nav-btn");
const dashboardPage = document.getElementById("dashboard");
const managementPage = document.getElementById("managementPage");
const pageTitle = document.getElementById("pageTitle");
const sectionHeading = document.getElementById("sectionHeading");
const tableHeading = document.getElementById("tableHeading");
const formFields = document.getElementById("formFields");
const recordForm = document.getElementById("recordForm");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");

// ================= Helpers =================
function escapeHtml(value) {
    if (value === undefined || value === null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

// ================= Navigation =================
navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(b => b.classList.remove("active"));
        button.classList.add("active");

        const page = button.dataset.page;

        if (page === "dashboard") {
            showDashboard();
        } else {
            showModule(page);
        }
    });
});

async function showDashboard() {
    currentModule = null;
    managementPage.classList.remove("active-page");
    dashboardPage.classList.add("active-page");
    pageTitle.textContent = "Dashboard";
    await loadDashboard();
}

async function showModule(name) {
    currentModule = name;
    const config = modules[name];

    dashboardPage.classList.remove("active-page");
    managementPage.classList.add("active-page");

    pageTitle.textContent = config.title;
    sectionHeading.textContent = `Add ${config.title}`;
    tableHeading.textContent = `All ${config.title}`;
    searchInput.value = "";

    buildForm(config);
    buildTableHead(getColumns(config, []));
    await loadRecords();
}

// ================= Form =================
function buildForm(config) {
    formFields.innerHTML = config.fields.map(field => {
        const required = field.required ? "required" : "";
        let input;

        if (field.type === "select") {
            input = `<select name="${field.name}" ${required}>
                <option value="">Select</option>
                ${field.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
            </select>`;
        } else {
            input = `<input type="${field.type}" name="${field.name}" ${required}
                ${field.type === "number" ? 'min="0" step="any"' : ""}>`;
        }

        return `<div class="field">
            <label>${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
            ${input}
        </div>`;
    }).join("");
}

recordForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentModule) return;

    const config = modules[currentModule];
    const formData = new FormData(recordForm);
    const record = {};

    config.fields.forEach(field => {
        let value = (formData.get(field.name) || "").toString().trim();

        if (field.type === "number" && value !== "") {
            value = Number(value);
        }

        record[field.name] = value;
    });

    try {
        await api(`/api/${currentModule}`, {
            method: "POST",
            body: JSON.stringify(record)
        });

        recordForm.reset();
        await loadRecords();
        alert("Record saved to MongoDB!");
    } catch (error) {
        alert("Error: " + error.message);
    }
});

// ================= Table =================
// Columns = the form fields + any extra fields found in MongoDB documents
// (so data you inserted manually with queries also shows up)
function getColumns(config, records) {
    const columns = config.fields.map(f => ({ name: f.name, label: f.label }));
    const known = new Set(columns.map(c => c.name));

    records.forEach(record => {
        Object.keys(record).forEach(key => {
            if (key !== "_id" && !known.has(key)) {
                known.add(key);
                columns.push({ name: key, label: key });
            }
        });
    });

    return columns;
}

function formatValue(value) {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return value;
}

function buildTableHead(columns) {
    tableHead.innerHTML = `<tr>
        ${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join("")}
        <th>Action</th>
    </tr>`;
}

async function loadRecords() {
    try {
        currentRecords = await api(`/api/${currentModule}`);
        renderTable(currentRecords);
    } catch (error) {
        tableBody.innerHTML = `<tr><td class="empty-message" colspan="20">
            Could not load records: ${escapeHtml(error.message)}</td></tr>`;
    }
}

function renderTable(records) {
    const config = modules[currentModule];
    const columns = getColumns(config, currentRecords);

    buildTableHead(columns);

    if (records.length === 0) {
        tableBody.innerHTML = `<tr><td class="empty-message" colspan="${columns.length + 1}">No records found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = records.map(record => `
        <tr>
            ${columns.map(c => `<td>${escapeHtml(formatValue(record[c.name]))}</td>`).join("")}
            <td><button class="delete-btn" data-id="${record._id}">Delete</button></td>
        </tr>
    `).join("");
}

tableBody.addEventListener("click", async event => {
    const button = event.target.closest(".delete-btn");
    if (!button) return;

    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
        await api(`/api/${currentModule}/${button.dataset.id}`, { method: "DELETE" });
        await loadRecords();
    } catch (error) {
        alert("Error: " + error.message);
    }
});

// ================= Search =================
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase().trim();

    const filtered = currentRecords.filter(record =>
        Object.entries(record)
            .filter(([key]) => key !== "_id")
            .some(([, value]) => String(value).toLowerCase().includes(term))
    );

    renderTable(filtered);
});

// ================= Dashboard =================
async function loadDashboard() {
    try {
        const [patients, doctors, appointments, billing] = await Promise.all([
            api("/api/patients"),
            api("/api/doctors"),
            api("/api/appointments"),
            api("/api/billing")
        ]);

        document.getElementById("patientCount").textContent = patients.length;
        document.getElementById("doctorCount").textContent = doctors.length;
        document.getElementById("appointmentCount").textContent = appointments.length;
        document.getElementById("billingCount").textContent = billing.length;

        const recent = patients.slice(-5).reverse();
        const body = document.getElementById("recentPatients");

        body.innerHTML = recent.length === 0
            ? `<tr><td class="empty-message" colspan="5">No patients yet.</td></tr>`
            : recent.map(p => `
                <tr>
                    <td>${escapeHtml(p.patientId)}</td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${escapeHtml(p.age)}</td>
                    <td>${escapeHtml(p.gender)}</td>
                    <td>${escapeHtml(p.contact)}</td>
                </tr>`).join("");
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

// ================= Start =================
loadDashboard();
