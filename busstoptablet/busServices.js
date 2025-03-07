import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const API_URL = "https://datamall2.mytransport.sg/ltaodataservice/BusServices";

app.get("/BusServices", async (req, res) => {
    try {
        const response = await fetch(API_URL, {
            headers: {
                "AccountKey": process.env.LTA_ACCOUNT_KEY,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();

        // Extract Query Parameter for ServiceNo (Bus Number)
        const busNo = req.query.busNo;

        // If `busNo` exists, filter by `ServiceNo`
        if (busNo) {
            const filteredData = data.value.filter(bus => bus.ServiceNo === busNo);
            return res.json(filteredData.length > 0 ? filteredData : { message: "No bus service found." });
        }

        // Return all bus services if no filter is applied
        res.json(data.value);
    } catch (error) {
        console.error("Error fetching bus services:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));