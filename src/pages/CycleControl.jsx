import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useMqtt } from '../store/MqttContext';
import ConnectionStatus from '../components/ConnectionStatus';
import ScheduleTask from './ScheduleTask';

const CycleControl = () => {
  // const [inputValue, setInputValue] = useState('');
  // const [apiData, setApiData] = useState([]);
  // const [loading, setLoading] = useState(false);

  const { data, publishMessage } = useMqtt()

  const trayStatus = data["feeder/fdtryA00/cycle_status"] || [];
  const scheduleStatus = data["feeder/fdtryA00/schedule_status"] || [];
  const deviceStatus = data["feeder/fdtryA00/device_status"] || [];



  const latestTrayStatus = trayStatus.length > 0
    ? trayStatus[trayStatus.length - 1]
    : "No cycle status available";

  const latestDeviceStatus = deviceStatus.length > 0
    ? deviceStatus[deviceStatus.length - 1]
    : "No Device status available";

  const latestScheduleStatus = scheduleStatus.length > 0
    ? scheduleStatus[scheduleStatus.length - 1]
    : "No Device status available";




  // const fetchData = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await axios.get(`${apiUrl}/latest_cycles/`);
  //     const fetchedData = res.data.recent_cycles || [];  // safe access and fallback
  //     setApiData(fetchedData);
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     setApiData([]);  // fallback on error as well
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // const handlePost = async () => {
  //   if (!inputValue.trim()) return;
  //   try {
  //     const res = await axios.post(`${apiUrl}/post_cyclecount/`, { cyclecount: inputValue })

  //     if (res.status === 200) {
  //       publishMessage("feeder/fdtryA00/cycle_request", inputValue);
  //       setInputValue('');
  //       fetchData();
  //     }
  //   } catch (error) {
  //     console.error('Error posting data:', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchData();
  // }, [latestTrayStatus]);

  const name = localStorage.getItem('User_name') || 'Guest';

  return (
    <>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Floating Welcome Message */}
        <div className="animate-fadeInOut fixed top-18 left-4 z-50 bg-white border-l-4 border-blue-500 shadow-xl rounded-xl px-6 py-4 w-fit max-w-sm">
          <p className="text-lg font-bold text-gray-800">
            Welcome, <span className="text-blue-700">{name}</span>
          </p>
        </div>

        {/* Section Title */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Cycle Control</h2>

        {/* Status Section */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-col gap-2">
            <p className="text-gray-700 font-medium">Cycle Status:</p>
            <div className="w-full px-3 py-1 border border-gray-400 rounded bg-gray-100 text-gray-800 text-center">
              {latestTrayStatus}
            </div>

            <p className="text-gray-700 font-medium">Schedule Status:</p>
            <div className="w-full px-3 py-1 border border-gray-400 rounded bg-gray-100 text-gray-800 text-center">
              {latestScheduleStatus}
            </div>
          </div>

          <p className="font-bold text-gray-800">{latestDeviceStatus}</p>

          <div>
            <button
              onClick={() => publishMessage("feeder/fdtryA00/cycle_abort", "Emergency")}
              className="relative w-20 h-20 bg-red-700 text-white rounded-full flex items-center justify-center text-lg font-bold uppercase tracking-wide shadow-lg hover:shadow-xl active:scale-95 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-300"
            >
              Abort
            </button>
          </div>

          <div className="w-full sm:w-auto">
            <ConnectionStatus />
          </div>


        </div>

        {/* Input & Button */}
        {/* <div className="flex flex-col sm:flex-row mb-6 gap-2 mt-8">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter message..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePost}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md sm:rounded-r-md sm:rounded-l-none hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Post
          </button>
        </div> */}

        {/* Table or Loading State */}
        {/* {loading ? (
          <p className="text-gray-600 mt-5">Loading data...</p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg max-h-96 mt-5">
            <table className="min-w-full bg-white border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">
                    id.
                  </th>
                  <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">
                    cyclecount
                  </th>
                  <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">
                    start_time
                  </th>
                  <th className="py-3 px-4 border-b border-gray-200 text-left text-gray-700 font-semibold">
                    end_time
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiData.map((item, index) => {
                  const { id, cyclecount, start_time, end_time } = item;
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
        )} */}

      </div>
      <ScheduleTask />
    </>
  );
};

export default CycleControl;