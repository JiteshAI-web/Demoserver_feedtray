import React, { useEffect, useRef, useState } from 'react'
import { useMqtt } from '../store/MqttContext';
import { IoWifiSharp } from 'react-icons/io5';

const ConnectionStatus = () => {
    const [connected, setConnected] = useState("Disconnected");
    const lastMessageTimeRef = useRef(Date.now());

    const { data, clearTopicData } = useMqtt();
    const rawStatus = data["feeder/fdtryA00/heartbeat"] || [];

    useEffect(() => {
        if (rawStatus.length > 0) {
            lastMessageTimeRef.current = Date.now();
        }
    }, [rawStatus]);

    // console.log(rawStatus);


    useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastMessageTimeRef.current > 6000) {
                setConnected("Disconnected");
                clearTopicData("feeder/fdtryA00/heartbeat");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const lastStatus = rawStatus.length > 0 ? rawStatus[rawStatus.length - 1] : null;
    const wifiStatus = lastStatus || "";

    useEffect(() => {
        if (typeof wifiStatus === 'string' && wifiStatus.toLowerCase().includes("alive")) {
            setConnected("Connected");
        }
    }, [wifiStatus]);


    return (
        <>
            <div className="flex items-center gap-1 bg-gray-300 px-2 py-1 rounded shadow">
                <IoWifiSharp
                    className={`w-5 h-5 ${connected === "Connected" ? "text-green-600" : "text-red-600"}`}
                />
                <span className="text-sm font-semibold text-gray-700">
                    {connected}
                </span>
            </div>
        </>
    )
}

export default ConnectionStatus