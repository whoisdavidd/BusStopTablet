import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const app = express();
app.use(cors());

const LTA_ACCOUNT_KEY = process.env.LTA_ACCOUNT_KEY;

app.get("/api/bus-stops", async (req, res) => {
    try {
        const response = await axios.get("https://datamall2.mytransport.sg/ltaodataservice/BusStops", {
            headers: { AccountKey: LTA_ACCOUNT_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from LTA" });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});