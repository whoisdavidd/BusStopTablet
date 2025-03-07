"use client";
import { useState, useEffect } from "react";

export default function BusSearch() {
    const [busNo, setBusNo] = useState("");
    const [busData, setBusData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (busNo.trim() === "") {
            setBusData([]);
            return;
        }

        const fetchBuses = async () => {
            try {
                const response = await fetch(`/api/busServices?busNo=${busNo}`); // ✅ Calls Next.js API

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                setBusData(data);
            } catch (error) {
                console.error("Error fetching bus data:", error);
                setError(error.message);
            }
        };

        fetchBuses();
    }, [busNo]);

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-search"></i></span>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search for a bus..." 
                            value={busNo} 
                            onChange={(e) => setBusNo(e.target.value)} 
                        />
                    </div>
                    <div id="bus-results" className="mt-3">
                        {error && <p className="text-danger">{error}</p>}
                        {busData.length === 0 ? (
                            <p className="text-warning">Enter a bus number to search</p>
                        ) : (
                            busData.map((bus, index) => (
                                <div key={index} className="card shadow-sm mb-3">
                                    <div className="card-body">
                                        <h5 className="card-title">Bus {bus.ServiceNo}</h5>
                                        <p className="card-text"><strong>Operator:</strong> {bus.Operator}</p>
                                        <p className="card-text"><strong>Category:</strong> {bus.Category}</p>
                                        <p className="card-text"><strong>Origin:</strong> {bus.OriginCode}</p>
                                        <p className="card-text"><strong>Destination:</strong> {bus.DestinationCode}</p>
                                        <p className="card-text"><strong>Loop:</strong> {bus.LoopDesc || "N/A"}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}