
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
 
const app = express();
const PORT = 3000;
 
app.use(express.json());
app.use(express.static(__dirname));
 
const MONGO_URL = "mongodb://127.0.0.1:27017";
const DATABASE_NAME = "HospitalDB";
 
const client = new MongoClient(MONGO_URL);
 
// module name (used in URL) -> MongoDB collection + custom ID field
const configurations = {
    patients:       { collection: "patients",       idField: "patientId" },
    doctors:        { collection: "doctors",        idField: "doctorId" },
    appointments:   { collection: "appointments",   idField: "appointmentId" },
    departments:    { collection: "departments",    idField: "departmentId" },
    medicalRecords: { collection: "medicalRecords", idField: "recordId" },
    prescriptions:  { collection: "prescriptions",  idField: "prescriptionId" },
    billing:        { collection: "billing",        idField: "billId" },
    hospitals:      { collection: "hospitals",      idField: "hospitalId" }
};
 
let db;
 
function getCollection(moduleName) {
    const config = configurations[moduleName];
    if (!config) return null;
    return db.collection(config.collection);
}
 
// Health check: http://localhost:3000/api/health
app.get("/api/health", async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.json({ success: true, message: "Server and MongoDB are connected." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
 
// GET: all records of a module
app.get("/api/:module", async (req, res) => {
    try {
        const collection = getCollection(req.params.module);
        if (!collection) return res.status(404).json({ error: "Module not found." });
 
        const records = await collection.find({}).toArray();
        res.json(records);
    } catch (error) {
        console.error("GET error:", error);
        res.status(500).json({ error: error.message });
    }
});
 
// POST: add a record
app.post("/api/:module", async (req, res) => {
    try {
        const moduleName = req.params.module;
        const config = configurations[moduleName];
        const collection = getCollection(moduleName);
 
        if (!collection || !config) {
            return res.status(404).json({ error: "Module not found." });
        }
 
        const record = { ...req.body };
        delete record._id; // never accept MongoDB's internal id from the browser
 
        // Save date fields (e.g. prescriptionDate) as real MongoDB Date values
        Object.keys(record).forEach(key => {
            if (
                /date/i.test(key) &&
                typeof record[key] === "string" &&
                /^\d{4}-\d{2}-\d{2}/.test(record[key])
            ) {
                const parsed = new Date(record[key]);
                if (!isNaN(parsed)) record[key] = parsed;
            }
        });
 
        const idField = config.idField;
 
        if (!record[idField] || String(record[idField]).trim() === "") {
            return res.status(400).json({ error: `${idField} is required.` });
        }
 
        record[idField] = String(record[idField]).trim();
 
        const existing = await collection.findOne({ [idField]: record[idField] });
        if (existing) {
            return res.status(409).json({
                error: `${record[idField]} already exists. Please use a different ID.`
            });
        }
 
        const result = await collection.insertOne(record);
        const savedRecord = await collection.findOne({ _id: result.insertedId });
 
        res.status(201).json({ message: "Record saved successfully.", record: savedRecord });
    } catch (error) {
        console.error("POST error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ error: "This ID already exists. Please use a different ID." });
        }
        res.status(500).json({ error: error.message });
    }
});
 
// PUT: update a record
app.put("/api/:module/:id", async (req, res) => {
    try {
        const collection = getCollection(req.params.module);
        if (!collection) return res.status(404).json({ error: "Module not found." });
 
        let objectId;
        try {
            objectId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: "Invalid MongoDB record ID." });
        }
 
        const updatedRecord = { ...req.body };
        delete updatedRecord._id;
 
        if (Object.keys(updatedRecord).length === 0) {
            return res.status(400).json({ error: "No update data provided." });
        }
 
        const result = await collection.updateOne({ _id: objectId }, { $set: updatedRecord });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Record not found." });
        }
 
        const record = await collection.findOne({ _id: objectId });
        res.json({ message: "Record updated successfully.", record });
    } catch (error) {
        console.error("PUT error:", error);
        res.status(500).json({ error: error.message });
    }
});
 
// DELETE: remove a record
app.delete("/api/:module/:id", async (req, res) => {
    try {
        const collection = getCollection(req.params.module);
        if (!collection) return res.status(404).json({ error: "Module not found." });
 
        let objectId;
        try {
            objectId = new ObjectId(req.params.id);
        } catch {
            return res.status(400).json({ error: "Invalid MongoDB record ID." });
        }
 
        const result = await collection.deleteOne({ _id: objectId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Record not found." });
        }
 
        res.json({ message: "Record deleted successfully." });
    } catch (error) {
        console.error("DELETE error:", error);
        res.status(500).json({ error: error.message });
    }
});
 
async function startServer() {
    try {
        await client.connect();
        db = client.db(DATABASE_NAME);
        await db.command({ ping: 1 });
 
        console.log("MongoDB connected successfully!");
        console.log("Database:", DATABASE_NAME);
 
        app.listen(PORT, () => {
            console.log(`Hospital Management System running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error.message);
        process.exit(1);
    }
}
 
startServer();
 

