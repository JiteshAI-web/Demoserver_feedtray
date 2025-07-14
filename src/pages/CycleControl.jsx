import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useMqtt } from '../store/MqttContext';
import ConnectionStatus from '../components/ConnectionStatus';

const CycleControl = () => {
    const [inputValue, setInputValue] = useState('');
    const [apiData, setApiData] = useState([]);
    const [loading, setLoading] = useState(false);

    const { data, publishMessage } = useMqtt()

    const trayStatus = data["feeder/fdtryA00/cycle_status"] || [];

    const deviceStatus = data["feeder/fdtryA00/device_status"] || [];

    console.log(deviceStatus);
    


    const latestTrayStatus = trayStatus.length > 0
        ? trayStatus[trayStatus.length - 1]
        : "No cycle status available";

    console.log(latestTrayStatus);

    const latestDeviceStatus = deviceStatus.length > 0
        ? deviceStatus[deviceStatus.length - 1]
        : "No Device status available";

console.log(latestDeviceStatus);


    const apiUrl = import.meta.env.VITE_API_URL

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/latest_cycles/`);
            console.log(res.data.recent_cycles);

            const fetchedData = res.data.recent_cycles || [];  // safe access and fallback
            setApiData(fetchedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setApiData([]);  // fallback on error as well
        } finally {
            setLoading(false);
        }
    };


    const handlePost = async () => {
        if (!inputValue.trim()) return;
        try {
            const res = await axios.post(`${apiUrl}/post_cyclecount/`, { cyclecount: inputValue })
            console.log('Posted:', res);

            if (res.status === 200) {
                publishMessage("feeder/fdtryA00/cycle_request", inputValue);
                setInputValue('');
                fetchData();
            }
        } catch (error) {
            console.error('Error posting data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [latestTrayStatus]);

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Cycle Control</h2>

            <div className="mb-4 flex justify-around ">
                <div className='flex items-center space-x-2'>
                    <p className="text-gray-700 font-medium">Cycle Status:</p>
                    <div className="w-60 px-3 py-1 border border-gray-400 rounded bg-gray-100 text-gray-800 text-center">
                        {latestTrayStatus}
                    </div>
                </div>
                    <p className='font-bold'>{latestDeviceStatus}</p>
                <div>
                    
                </div>

                <div>
                    <ConnectionStatus />
                </div>
            </div>




            <div className="flex mb-6">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter message..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handlePost}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Post
                </button>
            </div>



            {loading ? (
                <p className="text-gray-600 mt-5">Loading data...</p>
            ) : (
                <div className="overflow-auto shadow-md rounded-lg max-h-96 mt-5">
                    <table className="min-w-full bg-white border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">id.</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">cyclecount</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">start_time</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">end_time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiData.map((item, index) => {
                                const {
                                    id,
                                    cyclecount,
                                    start_time,
                                    end_time
                                } = item;
                                return (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 border-b border-gray-200">{id}</td>

                                        <td className="py-3 px-4 border-b border-gray-200">{cyclecount}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{start_time}</td>
                                        <td className="py-3 px-4 border-b border-gray-200">{end_time}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            )}
        </div>
    );
};

export default CycleControl;