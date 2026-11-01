
// ================= Default module configuration =================
// These are only used when a collection is empty. As soon as a collection has
// documents, the columns and the form are built from the real MongoDB fields.
const modules = {
    patients: {
        title: "Patients",
        idField: "patientId",
        fields: [
            { name: "patientId", label: "Patient ID", type: "text", required: true },
            { name: "name", label: "Name", type: "text", required: true },
            { name: "age", label: "Age", type: "number" },
            { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
            { name: "phone", label: "Phone", type: "text" },
            { name: "address", label: "Address", type: "text" },
            { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
            { name: "hospitalId", label: "Hospital ID", type: "text" }
        ]
    },
    doctors: {
        title: "Doctors",
        idField: "doctorId",
        fields: [
            { name: "doctorId", label: "Doctor ID", type: "text", required: true },
            { name: "name", label: "Name", type: "text", required: true },
            { name: "specialization", label: "Specialization", type: "text" },
            { name: "departmentId", label: "Department ID", type: "text" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "experience", label: "Experience (years)", type: "number" },
            { name: "consultationFee", label: "Consultation Fee", type: "number" },
            { name: "hospitalId", label: "Hospital ID", type: "text" }
        ]
    },
    appointments: {
        title: "Appointments",
        idField: "appointmentId",
        fields: [
            { name: "appointmentId", label: "Appointment ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text" },
            { name: "doctorId", label: "Doctor ID", type: "text" },
            { name: "date", label: "Date", type: "date" },
            { name: "time", label: "Time", type: "time" },
            { name: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] }
        ]
    },
    departments: {
        title: "Departments",
        idField: "departmentId",
        fields: [
            { name: "departmentId", label: "Department ID", type: "text", required: true },
            { name: "name", label: "Department Name", type: "text" },
            { name: "head", label: "Head of Department", type: "text" },
            { name: "location", label: "Location / Floor", type: "text" }
        ]
    },
    medicalRecords: {
        title: "Medical Records",
        idField: "recordId",
        fields: [
            { name: "recordId", label: "Record ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text" },
            { name: "doctorId", label: "Doctor ID", type: "text" },
            { name: "diagnosis", label: "Diagnosis", type: "text" },
            { name: "date", label: "Date", type: "date" },
            { name: "notes", label: "Notes", type: "text" }
        ]
    },
    prescriptions: {
        title: "Prescriptions",
        idField: "prescriptionId",
        fields: [
            { name: "prescriptionId", label: "Prescription ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text" },
            { name: "doctorId", label: "Doctor ID", type: "text" },
            { name: "hospitalId", label: "Hospital ID", type: "text" },
            { name: "medicines", label: "Medicines", type: "json" },
            { name: "prescriptionDate", label: "Prescription Date", type: "date" }
        ]
    },
    billing: {
        title: "Billing",
        idField: "billId",
        fields: [
            { name: "billId", label: "Bill ID", type: "text", required: true },
            { name: "patientId", label: "Patient ID", type: "text" },
            { name: "amount", label: "Amount", type: "number" },
            { name: "date", label: "Date", type: "date" },
            { name: "status", label: "Payment Status", type: "select", options: ["Paid", "Pending", "Partial"] }
        ]
    },
    hospitals: {
        title: "Hospitals",
        idField: "hospitalId",
        fields: [
            { name: "hospitalId", label: "Hospital ID", type: "text", required: true },
            { name: "name", label: "Hospital Name", type: "text" },
            { name: "city", label: "City", type: "text" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "beds", label: "Total Beds", type: "number" }
        ]
    }
};
 
// ================= State & elements =================
let currentModule = null;
let currentRecords = [];
let currentSchema = [];
 
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
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const TIME_ONLY = /^\d{2}:\d{2}(:\d{2})?$/;
 
function escapeHtml(value) {
    if (value === undefined || value === null) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
 
function prettyLabel(key) {
    return key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, c => c.toUpperCase());
}
 
// Turn any MongoDB value into readable text
function formatValue(value) {
    if (value === undefined || value === null) return "";
 
    if (Array.isArray(value)) {
        return value.map(formatValue).join("\n");
    }
 
    if (typeof value === "object") {
        return Object.entries(value)
            .map(([k, v]) => `${k}: ${formatValue(v)}`)
            .join(", ");
    }
 
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date)) {
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }
    }
 
    return String(value);
}
 
function inferType(sample) {
    if (sample !== null && typeof sample === "object") return "json";
    if (typeof sample === "number") return "number";
    if (typeof sample === "boolean") return "boolean";
    if (typeof sample === "string") {
        if (ISO_DATE.test(sample)) return "date";
        if (TIME_ONLY.test(sample)) return "time";
    }
    return "text";
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
 
// Build the list of fields (used for BOTH the form and the table) from the
// documents that really exist in MongoDB.
function getSchema(config, records) {
    const defaults = config.fields;
 
    if (records.length === 0) {
        return defaults.map(f => ({ ...f }));
    }
 
    const keys = [];
    const samples = {};
    const seenValues = {};
 
    records.forEach(record => {
        Object.entries(record).forEach(([key, value]) => {
            if (key === "_id") return;
 
            if (!(key in samples)) {
                keys.push(key);
                samples[key] = value;
                seenValues[key] = new Set();
            } else if ((samples[key] === null || samples[key] === undefined) && value != null) {
                samples[key] = value;
            }
 
            if (typeof value === "string" && value !== "") {
                seenValues[key].add(value);
            }
        });
    });
 
    // The ID field always comes first (the server needs it to add a record)
    const ordered = [config.idField, ...keys.filter(k => k !== config.idField)];
 
    return ordered.map(key => {
        const def = defaults.find(f => f.name === key);
        const sample = samples[key];
 
        let type = def ? def.type : inferType(sample);
        let options;
 
        if (sample !== null && typeof sample === "object") {
            type = "json";
        }
 
        if (type === "select") {
            options = [...new Set([...(def.options || []), ...(seenValues[key] || [])])];
        }
 
        return {
            name: key,
            label: def ? def.label : prettyLabel(key),
            type,
            options,
            required: key === config.idField || Boolean(def && def.required),
            hint: type === "json" ? JSON.stringify(sample).slice(0, 150) : undefined
        };
    });
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
 
    await loadRecords();
}
 
// ================= Form =================
function buildForm(schema) {
    formFields.innerHTML = schema.map(field => {
        const required = field.required ? "required" : "";
        let input;
        let wrapperStyle = "";
 
        if (field.type === "select") {
            input = `<select name="${escapeHtml(field.name)}" ${required}>
                <option value="">Select</option>
                ${field.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}
            </select>`;
        } else if (field.type === "boolean") {
            input = `<select name="${escapeHtml(field.name)}" ${required}>
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>`;
        } else if (field.type === "json") {
            wrapperStyle = 'style="grid-column: 1 / -1;"';
            const placeholder = field.hint
                ? `Valid JSON, e.g. ${field.hint}`
                : 'Valid JSON, e.g. [{"name":"Medicine A"}]';
            input = `<textarea name="${escapeHtml(field.name)}" rows="2" ${required}
                placeholder="${escapeHtml(placeholder)}"></textarea>`;
        } else {
            input = `<input type="${field.type}" name="${escapeHtml(field.name)}" ${required}
                ${field.type === "number" ? 'min="0" step="any"' : ""}>`;
        }
 
        return `<div class="field" ${wrapperStyle}>
            <label>${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
            ${input}
        </div>`;
    }).join("");
}
 
recordForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentModule) return;
 
    const formData = new FormData(recordForm);
    const record = {};
 
    for (const field of currentSchema) {
        const raw = (formData.get(field.name) || "").toString().trim();
 
        if (raw === "") continue; // skip empty optional fields
 
        let value = raw;
 
        if (field.type === "number") {
            value = Number(raw);
        } else if (field.type === "boolean") {
            value = raw === "true";
        } else if (field.type === "json") {
            try {
                value = JSON.parse(raw);
            } catch {
                alert(`"${field.label}" must be valid JSON.\nExample: ${field.hint || '[{"name":"Medicine A"}]'}`);
                return;
            }
        }
 
        record[field.name] = value;
    }
 
    try {
        await api(`/api/${currentModule}`, {
            method: "POST",
            body: JSON.stringify(record)
        });
 
        await loadRecords();
        alert("Record saved to MongoDB!");
    } catch (error) {
        alert("Error: " + error.message);
    }
});
 
// ================= Table =================
async function loadRecords() {
    const config = modules[currentModule];
 
    try {
        currentRecords = await api(`/api/${currentModule}`);
        currentSchema = getSchema(config, currentRecords);
 
        buildForm(currentSchema);
        applySearch();
    } catch (error) {
        currentRecords = [];
        currentSchema = getSchema(config, []);
 
        buildForm(currentSchema);
        tableHead.innerHTML = "";
        tableBody.innerHTML = `<tr><td class="empty-message" colspan="20">
            Could not load records: ${escapeHtml(error.message)}</td></tr>`;
    }
}
 
function renderTable(records) {
    tableHead.innerHTML = `<tr>
        ${currentSchema.map(f => `<th>${escapeHtml(f.label)}</th>`).join("")}
        <th>Action</th>
    </tr>`;
 
    if (records.length === 0) {
        tableBody.innerHTML = `<tr><td class="empty-message" colspan="${currentSchema.length + 1}">No records found.</td></tr>`;
        return;
    }
 
    tableBody.innerHTML = records.map(record => `
        <tr>
            ${currentSchema.map(f =>
                `<td>${escapeHtml(formatValue(record[f.name])).replace(/\n/g, "<br>")}</td>`
            ).join("")}
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
function applySearch() {
    const term = searchInput.value.toLowerCase().trim();
 
    if (term === "") {
        renderTable(currentRecords);
        return;
    }
 
    const filtered = currentRecords.filter(record =>
        currentSchema.some(f =>
            formatValue(record[f.name]).toLowerCase().includes(term)
        )
    );
 
    renderTable(filtered);
}
 
searchInput.addEventListener("input", applySearch);
 
// ================= Dashboard =================
// Picks the first field that exists, so different field names still work
function pick(record, names) {
    for (const name of names) {
        if (record[name] !== undefined && record[name] !== null && record[name] !== "") {
            return record[name];
        }
    }
    return "";
}
 
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
                    <td>${escapeHtml(pick(p, ["patientId", "id"]))}</td>
                    <td>${escapeHtml(pick(p, ["name", "patientName", "fullName"]))}</td>
                    <td>${escapeHtml(pick(p, ["age"]))}</td>
                    <td>${escapeHtml(pick(p, ["gender", "sex"]))}</td>
                    <td>${escapeHtml(formatValue(pick(p, ["contact", "phone", "mobile", "phoneNumber", "contactNumber"])))}</td>
                </tr>`).join("");
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}
 
// ================= Start =================
loadDashboard();
 
