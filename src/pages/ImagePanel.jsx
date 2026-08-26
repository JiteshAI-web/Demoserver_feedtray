import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiDownload } from "react-icons/fi";

const ImagePanel = () => {

  const [imageData, setImageData] = useState([]);
  const [colorImageData, setColorImageData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalSrc, setModalSrc] = useState(null);
  const [modalAlt, setModalAlt] = useState(null);

  const findColorMatchFor = (thermalItem) => {
    if (!colorImageData || colorImageData.length === 0) return null;
    const t = new Date(thermalItem.created_at).getTime();
    let best = null;
    let bestDiff = Infinity;
    colorImageData.forEach((c) => {
      const ct = new Date(c.created_at).getTime();
      const diff = Math.abs(ct - t);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = c;
      }
    });
    return best && bestDiff <= 30000 ? best : null;
  };

  const handleStatusClick = (img) => {
    // If thermal card, try to find a matching color image
    if (img.type === "thermal") {
      const match = findColorMatchFor(img);
      if (match) {
        const src = match.colour_image ?? match.color_image ?? match.image_url ?? null;
        if (src) {
          // If src looks like a full URL, use it directly; otherwise assume base64
          if (typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"))) {
            setModalSrc(src);
            setModalAlt(`Color image ${match.created_at}`);
            setShowModal(true);
            return;
          } else {
            setModalSrc(`data:image/jpeg;base64,${src}`);
            setModalAlt(`Color image ${match.created_at}`);
            setShowModal(true);
            return;
          }
        }
      }
    }

    // fallback: if this card has an image, show it
    if (img.image) {
      const src = img.image;
      const mime = img.type === "thermal" ? "png" : "jpeg";
      setModalSrc(`data:image/${mime};base64,${src}`);
      setModalAlt(`${img.type} image ${img.created_at}`);
      setShowModal(true);
      return;
    }

    alert("No matching image available.");
  };

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
      image: item.colour_image ?? item.color_image ?? item.image_url ?? null,
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
                (() => {
                  const src = img.image;
                  const isUrl = typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"));
                  const finalSrc = isUrl ? src : `data:image/${img.type === "thermal" ? "png" : "jpeg"};base64,${src}`;
                  return (
                    <img
                      src={finalSrc}
                      alt={`${img.type} image ${i + 1}`}
                      className="w-full object-cover h-auto transition-transform duration-300 hover:scale-105"
                    />
                  );
                })()
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStatusClick(img)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStatusClick(img);
                    }
                  }}
                  className="text-red-500 text-xs p-2 text-center cursor-pointer"
                >
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
                  const src = img.image;
                  const isUrl = typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"));
                  const link = document.createElement("a");
                  if (isUrl) {
                    link.href = src;
                    link.target = "_blank";
                    link.rel = "noopener";
                  } else {
                    link.href = `data:image/${img.type === "thermal" ? "png" : "jpeg"};base64,${src}`;
                  }
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full">
            <div className="flex justify-end">
              <button onClick={() => setShowModal(false)} className="text-sm px-2 py-1 border rounded">Close</button>
            </div>
            <div className="mt-2">
              <img src={modalSrc} alt={modalAlt} className="w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePanel;




// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { FiDownload } from "react-icons/fi";

// const ImagePanel = () => {

//     const [imageData, setImageData] = useState([]);
//     const [colorImageData, setColorImageData] = useState([]);

//     const API_BASE_URL = import.meta.env.VITE_API_URL;
//     const wsUrl = import.meta.env.VITE_WS_URL;

//     // --------------------------------------------------
//     // Unified gallery data
//     // --------------------------------------------------

//     const galleryImages = [];

//     // --------------------------------------------------
//     // Add thermal images
//     // --------------------------------------------------

//     imageData.forEach((item, index) => {

//         galleryImages.push({
//             type: "thermal",
//             image: item.image_url,
//             created_at: item.created_at,
//             node_id: item.node_id,
//             index,
//         });

//     });

//     // --------------------------------------------------
//     // Add colour images
//     // --------------------------------------------------

//     colorImageData.forEach((item, index) => {

//         galleryImages.push({
//             type: "color",
//             image: item.image_url,
//             created_at: item.created_at,
//             node_id: item.node_id,
//             index,
//         });

//     });

//     // --------------------------------------------------
//     // Sort latest first
//     // --------------------------------------------------

//     galleryImages.sort(
//         (a, b) =>
//             new Date(b.created_at) -
//             new Date(a.created_at)
//     );

//     // --------------------------------------------------
//     // WebSocket
//     // --------------------------------------------------

//     useEffect(() => {

//         const socket = new WebSocket(
//             `${wsUrl}/ws/thermal-images/`
//         );

//         // --------------------------------------------------
//         // Ping every 30 seconds
//         // --------------------------------------------------

//         const pingInterval = setInterval(() => {

//             if (socket.readyState === WebSocket.OPEN) {

//                 socket.send(
//                     JSON.stringify({
//                         type: "ping",
//                     })
//                 );

//             }

//         }, 30000);

//         // --------------------------------------------------
//         // WebSocket connected
//         // --------------------------------------------------

//         socket.onopen = () => {

//             console.log(
//                 "WebSocket Connected"
//             );

//         };

//         // --------------------------------------------------
//         // WebSocket message
//         // --------------------------------------------------

//         socket.onmessage = (event) => {

//             try {

//                 const data = JSON.parse(
//                     event.data
//                 );

//                 console.log(
//                     "WebSocket Message Received:",
//                     data
//                 );

//                 // --------------------------------------------------
//                 // Thermal images
//                 // --------------------------------------------------

//                 if (
//                     data.type === "thermal_images" &&
//                     Array.isArray(data.data)
//                 ) {

//                     console.log(
//                         `Received ${data.data.length} thermal images`
//                     );

//                     setImageData(
//                         data.data
//                     );

//                 }

//                 // --------------------------------------------------
//                 // Colour images
//                 // --------------------------------------------------

//                 else if (
//                     data.type === "colour_images" &&
//                     Array.isArray(data.data)
//                 ) {

//                     console.log(
//                         `Received ${data.data.length} colour images`
//                     );

//                     setColorImageData(
//                         data.data
//                     );

//                 }

//                 // --------------------------------------------------
//                 // Connection
//                 // --------------------------------------------------

//                 else if (
//                     data.type === "connection_established"
//                 ) {

//                     console.log(
//                         data.message
//                     );

//                 }

//                 // --------------------------------------------------
//                 // Ping
//                 // --------------------------------------------------

//                 else if (
//                     data.type === "ping"
//                 ) {

//                     console.log(
//                         "WebSocket ping received"
//                     );

//                 }

//                 // --------------------------------------------------
//                 // Pong
//                 // --------------------------------------------------

//                 else if (
//                     data.type === "pong"
//                 ) {

//                     console.log(
//                         "WebSocket pong received"
//                     );

//                 }

//                 // --------------------------------------------------
//                 // Error
//                 // --------------------------------------------------

//                 else if (
//                     data.type === "error"
//                 ) {

//                     console.error(
//                         "WebSocket server error:",
//                         data.message
//                     );

//                 }

//             } catch (error) {

//                 console.error(
//                     "❌ Error parsing WebSocket message:",
//                     error
//                 );

//             }

//         };

//         // --------------------------------------------------
//         // WebSocket error
//         // --------------------------------------------------

//         socket.onerror = (error) => {

//             console.error(
//                 "WebSocket Error:",
//                 error
//             );

//         };

//         // --------------------------------------------------
//         // WebSocket closed
//         // --------------------------------------------------

//         socket.onclose = () => {

//             console.log(
//                 "WebSocket Disconnected"
//             );

//         };

//         // --------------------------------------------------
//         // Cleanup
//         // --------------------------------------------------

//         return () => {

//             clearInterval(
//                 pingInterval
//             );

//             socket.close();

//         };

//     }, [wsUrl]);

//     // --------------------------------------------------
//     // Download all thermal images
//     // --------------------------------------------------

//     const handleDownloadAll = async () => {

//         try {

//             const response = await axios.post(
//                 `${API_BASE_URL}/download_all_thermal_images/`,
//                 null,
//                 {
//                     responseType: "blob",
//                 }
//             );

//             const fileURL =
//                 URL.createObjectURL(
//                     response.data
//                 );

//             const link =
//                 document.createElement("a");

//             link.href = fileURL;
//             link.download =
//                 "thermal_images.zip";

//             document.body.appendChild(
//                 link
//             );

//             link.click();

//             document.body.removeChild(
//                 link
//             );

//             URL.revokeObjectURL(
//                 fileURL
//             );

//         } catch (error) {

//             console.error(
//                 "Error during downloading thermal images:",
//                 error
//             );

//         }

//     };

//     // --------------------------------------------------
//     // Download individual image
//     // --------------------------------------------------

//     const handleDownloadImage = async (
//         imageUrl,
//         type,
//         index
//     ) => {

//         try {

//             const response = await fetch(
//                 imageUrl
//             );

//             if (!response.ok) {

//                 throw new Error(
//                     `Image download failed: ${response.status}`
//                 );

//             }

//             const blob =
//                 await response.blob();

//             const fileURL =
//                 URL.createObjectURL(
//                     blob
//                 );

//             const link =
//                 document.createElement("a");

//             link.href = fileURL;

//             link.download =
//                 `${type}_image_${index + 1}.jpg`;

//             document.body.appendChild(
//                 link
//             );

//             link.click();

//             document.body.removeChild(
//                 link
//             );

//             URL.revokeObjectURL(
//                 fileURL
//             );

//         } catch (error) {

//             console.error(
//                 "Error downloading image:",
//                 error
//             );

//         }

//     };

//     // --------------------------------------------------
//     // Render
//     // --------------------------------------------------

//     return (

//         <div
//             className="
//                 flex
//                 flex-col
//                 items-center
//                 w-full
//                 mt-4
//                 px-2
//                 max-w-screen-xl
//                 mx-auto
//             "
//         >

//             <div
//                 className="
//                     grid
//                     grid-cols-1
//                     sm:grid-cols-2
//                     md:grid-cols-3
//                     gap-6
//                     w-full
//                     mt-6
//                 "
//             >

//                 {galleryImages.map(
//                     (img, i) => (

//                         <div
//                             key={`${img.type}-${img.created_at}-${i}`}
//                             className="
//                                 bg-white
//                                 rounded-2xl
//                                 shadow-xl
//                                 p-3
//                                 flex
//                                 flex-col
//                                 gap-2
//                                 hover:shadow-2xl
//                                 transition
//                             "
//                         >

//                             {/* -------------------------------- */}
//                             {/* Image */}
//                             {/* -------------------------------- */}

//                             <div
//                                 className="
//                                     rounded-xl
//                                     overflow-hidden
//                                     border-4
//                                     border-gray-200
//                                     min-h-[40px]
//                                 "
//                             >

//                                 {img.image ? (

//                                     <img
//                                         src={img.image}
//                                         alt={`${img.type} image ${i + 1}`}
//                                         className="
//                                             w-full
//                                             object-cover
//                                             h-auto
//                                             transition-transform
//                                             duration-300
//                                             hover:scale-105
//                                         "
//                                         onLoad={() => {

//                                             console.log(
//                                                 `✓ ${img.type} image loaded:`,
//                                                 img.image
//                                             );

//                                         }}
//                                         onError={(event) => {

//                                             console.error(
//                                                 `❌ ${img.type} image failed to load:`,
//                                                 img.image
//                                             );

//                                             event.currentTarget.style.display =
//                                                 "none";

//                                         }}
//                                     />

//                                 ) : (

//                                     <div
//                                         className="
//                                             text-red-500
//                                             text-xs
//                                             p-2
//                                             text-center
//                                         "
//                                     >
//                                         ⚠️{" "}
//                                         {img.type === "thermal"
//                                             ? "Thermal"
//                                             : "Color"}{" "}
//                                         image not available
//                                     </div>

//                                 )}

//                             </div>

//                             {/* -------------------------------- */}
//                             {/* Timestamp + Download */}
//                             {/* -------------------------------- */}

//                             <div
//                                 className="
//                                     flex
//                                     justify-between
//                                     items-center
//                                     text-xs
//                                     text-gray-700
//                                     mt-1
//                                     flex-wrap
//                                     gap-2
//                                 "
//                             >

//                                 <div
//                                     className="
//                                         bg-gray-200
//                                         px-2
//                                         py-1
//                                         rounded-md
//                                         shadow-sm
//                                         text-[10px]
//                                     "
//                                 >
//                                     {new Date(
//                                         img.created_at
//                                     ).toLocaleString()}
//                                 </div>

//                                 <button
//                                     onClick={() =>
//                                         handleDownloadImage(
//                                             img.image,
//                                             img.type,
//                                             img.index
//                                         )
//                                     }
//                                     className={`
//                                         text-white
//                                         px-3
//                                         py-1
//                                         rounded-md
//                                         shadow-sm
//                                         ${
//                                             img.type === "thermal"
//                                                 ? "bg-green-600 hover:bg-green-700"
//                                                 : "bg-blue-600 hover:bg-blue-700"
//                                         }
//                                     `}
//                                     title="Download image"
//                                 >

//                                     <FiDownload
//                                         className="w-4 h-4"
//                                     />

//                                 </button>

//                             </div>

//                         </div>

//                     )
//                 )}

//             </div>

//         </div>

//     );
// };

// export default ImagePanel;