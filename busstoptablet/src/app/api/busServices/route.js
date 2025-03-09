import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const busNo = searchParams.get("busNo");

    const API_URL = "https://datamall2.mytransport.sg/ltaodataservice/BusServices";
    const API_KEY = process.env.NEXT_PUBLIC_LTA_ACCOUNT_KEY; // ✅ Ensure it's set correctly in .env.local

    try {
        console.log("Fetching from LTA DataMall API...");
        
        const response = await fetch(API_URL, {
            headers: {
                "AccountKey": API_KEY,
                "Accept": "application/json",
            },
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Data received:", data);

        if (!data || !data.value) {
            throw new Error("Invalid response structure: 'value' not found in API response.");
        }

        const filteredData = busNo ? data.value.filter(bus => bus.ServiceNo === busNo) : data.value;
        const busAPIURL = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";
        

        console.log("Filtered data:", filteredData);

        return NextResponse.json(filteredData, { status: 200 });
    } catch (error) {
        console.error("Error fetching bus services:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
    }
}

