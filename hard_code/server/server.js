import express from "express";
import cors from "cors";
import {drivers, buses, students} from "./busData.js";

const app = express();
app.use(cors());

app.get("/api/buses", (req,res) => res.json(buses));
app.get("/api/drivers", (req,res) => res.json(drivers));
app.get("/api/students", (req,res) => res.json(students));

const PORT = 5000;
app.listen(PORT, () => console.log (`Server running on port ${PORT}`));
