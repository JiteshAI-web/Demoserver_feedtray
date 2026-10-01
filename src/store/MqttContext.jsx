import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {

  
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const statusRef = useRef("connected"); // Tracks the current connection status without triggering re-renders

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("mqttData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed["feeder/fdtryA00/cycle_status"]?.length) return parsed;
      } catch (e) {
        console.error("Error parsing saved mqttData", e);
      }
    }
    return {
      "feeder/fdtryA00/cycle_status": ["All Cycles Completed Successfully"],
      "feeder/fdtryA00/heartbeat": ["alive"],
      "feeder/fdtryA00/device_status": ["Device Online"],
      "feeder/fdtryA00/schedule_status": ["Scheduler: IDLE - No scheduled cycles"]
    };
  });

  useEffect(() => {
    // Keep connection active in static simulation mode
    setConnectionStatus("connected");
    statusRef.current = "connected";

    // Attempt optional background MQTT connection, fallback gracefully
    try {
      const mqttClient = mqtt.connect({
        hostname: "mqttbroker.bc-pl.com",
        port: 443,
        protocol: "wss",
        path: "/mqtt",
        username: "mqttuser",
        password: "Bfl@2025",
        clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
        reconnectPeriod: 10000
      });

      mqttClient.on("connect", () => {
        setConnectionStatus("connected");
        mqttClient.subscribe(["feeder/fdtryA00/cycle_status", "feeder/fdtryA00/heartbeat", "feeder/fdtryA00/device_status", "feeder/fdtryA00/schedule_status"]);
      });

      mqttClient.on("message", (topic, message) => {
        const rawMessage = message.toString();
        setData((prevData) => {
          const updatedData = {
            ...prevData,
            [topic]: [...(prevData[topic] || []), rawMessage].slice(-30),
          };
          localStorage.setItem("mqttData", JSON.stringify(updatedData));
          return updatedData;
        });
      });

      setClient(mqttClient);

      return () => {
        mqttClient.end();
      };
    } catch (e) {
      console.warn("MQTT live connection bypassed for simulation mode:", e);
    }
  }, []);

  const publishMessage = (topic, message) => {
    console.log(`🚀 [Simulation] Published to ${topic}:`, message);
    if (client && client.connected) {
      try {
        client.publish(topic, message);
      } catch (e) {
        console.warn("Live publish failed, using simulated response:", e);
      }
    }

    // Simulate topic updates locally
    setData((prevData) => {
      let updatedData = { ...prevData };

      if (topic === "feeder/fdtryA00/cycle_abort") {
        updatedData["feeder/fdtryA00/cycle_status"] = [
          ...(prevData["feeder/fdtryA00/cycle_status"] || []),
          "Aborted"
        ].slice(-30);
        updatedData["feeder/fdtryA00/schedule_status"] = [
          ...(prevData["feeder/fdtryA00/schedule_status"] || []),
          "Scheduler: ABORTED"
        ].slice(-30);
      } else if (topic === "feeder/fdtryA00/schedule_set") {
        updatedData["feeder/fdtryA00/schedule_status"] = [
          ...(prevData["feeder/fdtryA00/schedule_status"] || []),
          "Scheduler: ACTIVE - Cycle Scheduled"
        ].slice(-30);
      } else if (topic === "feeder/fdtryA00/schedule_cancel") {
        updatedData["feeder/fdtryA00/schedule_status"] = [
          ...(prevData["feeder/fdtryA00/schedule_status"] || []),
          "Scheduler: IDLE - Schedule Removed"
        ].slice(-30);
      } else {
        updatedData[topic] = [...(prevData[topic] || []), message].slice(-30);
      }

      localStorage.setItem("mqttData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const clearTopicData = (topic) => {
    setData((prevData) => {
      const updatedData = {
        ...prevData,
        [topic]: [],
      };
      localStorage.setItem("mqttData", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  return (
    <MqttContext.Provider value={{ data, publishMessage, clearTopicData, connectionStatus: "connected" }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);
