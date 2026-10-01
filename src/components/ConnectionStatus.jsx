import React, { useEffect, useRef, useState } from 'react'
import { useMqtt } from '../store/MqttContext';
import { IoWifiSharp } from 'react-icons/io5';

const ConnectionStatus = () => {
    const [connected, setConnected] = useState("Connected");
    const lastMessageTimeRef = useRef(Date.now());

    const { data } = useMqtt();
    const rawStatus = data["feeder/fdtryA00/heartbeat"] || ["alive"];

    useEffect(() => {
        setConnected("Connected");
    }, [rawStatus]);


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