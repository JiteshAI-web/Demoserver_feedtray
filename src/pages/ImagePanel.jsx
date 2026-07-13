import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiDownload } from "react-icons/fi";

const ImagePanel = () => {

  const [imageData, setImageData] = useState([]);
  const [colorImageData, setColorImageData] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL

  const galleryImages = [];

  // Add thermal images
  imageData.forEach((item, index) => {
    galleryImages.push({
      type: "thermal",
      image: item.thermal_image,
      created_at: item.created_at,
      index,
    });
  });

  // Add color images
  colorImageData.forEach((item, index) => {
    galleryImages.push({
      type: "color",
      image: item.colour_image,
      created_at: item.created_at,
      index,
    });
  });

  // Sort by timestamp (latest first)
  galleryImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  useEffect(() => {
    const socket = new WebSocket(`${wsUrl}/ws/thermal-images/`);
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);



    socket.onopen = () => {
      console.log("WebSocket Connected");
    };



    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Message Received:", data);

        if (
          data.type === "thermal_images" &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setImageData(data.data);
        } else if (
          data.type === "colour_images" &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setColorImageData(data.data);
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      clearInterval(pingInterval);
      socket.close();
    };
  }, []);

  const handleDownloadAll = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/download_all_thermal_images/`,
        null,
        { responseType: "blob" }
      );

      const fileURL = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = "thermal_images.zip";
      link.click();
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error during downloading thermal images:", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full mt-4 px-2 max-w-screen-xl mx-auto">
     
      {/* Unified Mobile-Style Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mt-6">
        {galleryImages.map((img, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-xl p-3 flex flex-col gap-2 hover:shadow-2xl transition"
          >
            {/* Image */}
            <div className="rounded-xl overflow-hidden border-4 border-gray-200">
              {img.image ? (
                <img
                  src={`data:image/${img.type === "thermal" ? "png" : "jpeg"};base64,${img.image}`}
                  alt={`${img.type} image ${i + 1}`}
                  className="w-full object-cover h-auto transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="text-red-500 text-xs p-2 text-center">
                  ⚠️ {img.type === "thermal" ? "Thermal" : "Color"} image not available
                </div>
              )}
            </div>

            {/* Timestamp and Download */}
            <div className="flex justify-between items-center text-xs text-gray-700 mt-1 flex-wrap gap-2">
              <div className="bg-gray-200 px-2 py-1 rounded-md shadow-sm text-[10px]">
                {new Date(img.created_at).toLocaleString()}
              </div>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `data:image/${img.type === "thermal" ? "png" : "jpeg"};base64,${img.image}`;
                  link.download = `${img.type}_image_${img.index + 1}.${img.type === "thermal" ? "png" : "jpg"}`;
                  link.click();
                }}
                className={`text-white px-3 py-1 rounded-md shadow-sm ${img.type === "thermal"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                <FiDownload className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePanel;