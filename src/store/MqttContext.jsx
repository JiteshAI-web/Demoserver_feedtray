import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {

  
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const statusRef = useRef("disconnected"); // Tracks the current connection status without triggering re-renders

  const [data, setData] = useState(() => {
    return JSON.parse(localStorage.getItem("mqttData")) || {
      "feeder/fdtryA00/cycle_status": [],
      "feeder/fdtryA00/heartbeat":[],
      "feeder/fdtryA00/device_status":[]
    };
  });

  useEffect(() => {
    const mqttClient = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
      clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
      reconnectPeriod: 5000
    });

    const handleStatusChange = (newStatus) => {
      if (statusRef.current !== newStatus) {
        statusRef.current = newStatus;
        setConnectionStatus(newStatus);
        console.log(`MQTT: ${newStatus}`);
      }
    };

    mqttClient.on("connect", () => {
      handleStatusChange("connected");
      mqttClient.subscribe(["feeder/fdtryA00/cycle_status","feeder/fdtryA00/heartbeat","feeder/fdtryA00/device_status"]);
    });

    mqttClient.on("reconnect", () => {
      handleStatusChange("reconnecting");
    });

    mqttClient.on("offline", () => {
      handleStatusChange("disconnected");
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT error:", err);
      handleStatusChange("error");
    });

   mqttClient.on("message", (topic, message) => {
  const rawMessage = message.toString();
  
  console.log(`${topic} : ${rawMessage}`);

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
      handleStatusChange("disconnected");
    };
  }, []);

  const publishMessage = (topic, message) => {
    if (client && client.connected) {
      client.publish(topic, message);
      console.log(`🚀 Published to ${topic}:`, message);
    } else {
      console.warn("❌ MQTT client not connected");
    }
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
    <MqttContext.Provider value={{ data, publishMessage, clearTopicData, connectionStatus }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);
