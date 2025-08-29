import React, { useState } from "react";
import axios from "axios";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const apiUrl = import.meta.env.VITE_API_URL;

const FilterData = () => {
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    const [fuelEntries, setFuelEntries] = useState([]);

    const handleGetMessages = async () => {
        setDataLoading(true);
        try {
            const start = format(dateRange[0].startDate, "yyyy-MM-dd");
            const end = format(dateRange[0].endDate, "yyyy-MM-dd");

            const response = await axios.get(`${apiUrl}/getall_cycle/`, {
                params: {
                    start_date: start,
                    end_date: end,
                },
            });

            console.log("📥 GET success:", response.data);
            setFuelEntries(response.data || []);
        } catch (error) {
            console.error("❌ GET error:", error);
        } finally {
            setDataLoading(false);
        }
    };


    const handleCSVDownload = async () => {
        setDownloadLoading(true);
        try {
            const start = format(dateRange[0].startDate, "yyyy-MM-dd");
            const end = format(dateRange[0].endDate, "yyyy-MM-dd");

            const response = await axios.post(`${apiUrl}/download_csv/`,
                {
                    from_date: start,
                    to_date: end,
                },
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "feedtray_data.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("❌ Download failed:", error.response || error);
        } finally {
            setDownloadLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow-lg border border-gray-300">
            {/* Download CSV Button */}
            <div className="mb-4 flex justify-between items-center">
                {/* Heading */}
                <h2 className="text-lg font-semibold">Cycle Count</h2>

                {/* Download CSV Button */}
                <button
                    onClick={handleCSVDownload}
                    disabled={downloadLoading}
                    className="flex items-center gap-0.5 bg-blue-500 hover:bg-blue-600 text-white py-0.5 px-2 rounded transition disabled:opacity-50"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                        />
                    </svg>
                    .csv
                </button>
            </div>

            {/* Start Date Input */}
            <div className="mb-4 relative">
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                    type="text"
                    readOnly
                    value={format(dateRange[0].startDate, "dd/MM/yyyy")}
                    onClick={() => {
                        setShowStartCalendar(!showStartCalendar);
                        setShowEndCalendar(false);
                    }}
                    className="w-full border px-3 py-2 rounded cursor-pointer text-sm bg-white shadow-sm"
                />
                {showStartCalendar && (
                    <div className="absolute z-10 w-full">
                        <DateRange
                            editableDateInputs={true}
                            onChange={(item) => {
                                setDateRange([
                                    {
                                        ...dateRange[0],
                                        startDate: item.selection.startDate,
                                        endDate: dateRange[0].endDate,
                                        key: "selection",
                                    },
                                ]);
                                setShowStartCalendar(false);
                            }}
                            moveRangeOnFirstSelection={false}
                            ranges={dateRange}
                            rangeColors={["#3b82f6"]}
                            showDateDisplay={false}
                        />
                    </div>
                )}
            </div>

            {/* End Date Input */}
            <div className="mb-4 relative">
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                    type="text"
                    readOnly
                    value={format(dateRange[0].endDate, "dd/MM/yyyy")}
                    onClick={() => {
                        setShowEndCalendar(!showEndCalendar);
                        setShowStartCalendar(false);
                    }}
                    className="w-full border px-3 py-2 rounded cursor-pointer text-sm bg-white shadow-sm"
                />
                {showEndCalendar && (
                    <div className="absolute z-10 w-full">
                        <DateRange
                            editableDateInputs={true}
                            onChange={(item) => {
                                setDateRange([
                                    {
                                        ...dateRange[0],
                                        startDate: dateRange[0].startDate,
                                        endDate: item.selection.endDate,
                                        key: "selection",
                                    },
                                ]);
                                setShowEndCalendar(false);
                            }}
                            moveRangeOnFirstSelection={false}
                            ranges={dateRange}
                            rangeColors={["#3b82f6"]}
                            showDateDisplay={false}
                        />
                    </div>
                )}
            </div>

            {/* Button */}
            <button
                onClick={handleGetMessages}
                disabled={dataLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-4 transition disabled:opacity-50"
            >
                {dataLoading ? "Loading..." : "Get Message Count"}
            </button>

            <div>
                {/* Display result list */}
                {fuelEntries.length > 0 && (
                    <div className="mt-2 border-t pt-2">
                        <h3 className="text-md font-semibold mb-2">Cycle Log:</h3>
                        <div className="space-y-2 max-h-66 overflow-y-auto border rounded p-3 bg-gray-50">
                            {fuelEntries.map((entry, index) => (
                                <div key={index} className="p-2 border-b last:border-b-0">
                                    <p><strong>id:</strong> {entry.id}</p>
                                    <p><strong>cyclecount:</strong> {entry.cyclecount}</p>
                                    <p><strong>start_time:</strong> {entry.start_time}</p>
                                    <p><strong>end_time:</strong> {entry.end_time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterData;