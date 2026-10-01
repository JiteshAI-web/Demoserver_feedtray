// src/utils/mockData.js

export const createThermalSvgUri = (code, timestamp) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#0d140e"/>
    <!-- Simulated thermal gradient/contour background -->
    <path d="M0,150 Q300,230 600,180 L600,450 L0,450 Z" fill="#18271b" opacity="0.9"/>
    <path d="M0,250 Q300,310 600,270 L600,450 L0,450 Z" fill="#29402e" opacity="0.85"/>
    <path d="M50,320 Q300,360 550,330 L550,450 L50,450 Z" fill="#3b5c43" opacity="0.6"/>
    <!-- Stamp / Emblem Box in Top Right like in screenshot -->
    <rect x="410" y="80" width="110" height="75" rx="8" fill="none" stroke="#486950" stroke-width="2.5" opacity="0.6"/>
    <path d="M430,118 L500,118 M465,95 L465,140" stroke="#486950" stroke-width="2" opacity="0.5"/>
    <rect x="445" y="102" width="40" height="32" rx="4" fill="none" stroke="#486950" stroke-width="1.5" opacity="0.5"/>
    <!-- Bottom info line -->
    <text x="25" y="425" font-family="monospace" font-size="13" fill="#558866" font-weight="bold">FEEDTRAY A00 | THERMAL CAM [${code}]</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const createColorSvgUri = (code, timestamp) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#b0ceb6"/>
    <rect x="0" y="0" width="600" height="450" fill="#a4c6aa" opacity="0.95"/>
    <!-- Tray structure background overlay -->
    <circle cx="300" cy="210" r="130" fill="#c4e2c9" opacity="0.6"/>
    <!-- Metal stand structure in bottom right matching screenshot -->
    <path d="M430,350 L570,350 L540,440 L460,440 Z" fill="#2a382c" opacity="0.85"/>
    <path d="M455,350 L450,440 M540,350 L530,440 M430,380 L570,380" stroke="#1b261d" stroke-width="5"/>
    <!-- Feed Tray Label -->
    <text x="25" y="425" font-family="monospace" font-size="13" fill="#203022" font-weight="bold">FEEDTRAY A00 | COLOR CAM [${code}]</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const initialSchedulesData = [
  { id: 43, schedule_id: "001", start_time: "2026-09-25T18:15:00", cyclecount: 1, status: "Completed" },
  { id: 42, schedule_id: "003", start_time: "2026-08-31T11:25:00", cyclecount: 1, status: "Completed" },
  { id: 41, schedule_id: "002", start_time: "2026-08-31T11:03:00", cyclecount: 1, status: "Completed" },
  { id: 40, schedule_id: "001", start_time: "2026-08-31T11:00:00", cyclecount: 1, status: "Aborted" },
  { id: 39, schedule_id: "002", start_time: "2026-08-31T09:58:00", cyclecount: 1, status: "Pending" }
];

export const initialScheduleIds = ["001", "002", "003"];

export const initialCycleLogs = [
  { id: 101, cyclecount: 1, start_time: "2026-10-01 10:15:00", end_time: "2026-10-01 10:30:00" },
  { id: 102, cyclecount: 1, start_time: "2026-10-01 11:00:00", end_time: "2026-10-01 11:15:00" },
  { id: 103, cyclecount: 1, start_time: "2026-10-01 14:20:00", end_time: "2026-10-01 14:35:00" },
  { id: 104, cyclecount: 1, start_time: "2026-10-01 16:45:00", end_time: "2026-10-01 17:00:00" }
];

export const mockThermalImages = [
  { thermal_image: createThermalSvgUri("TH-01", "9/25/2026, 6:16:54 PM"), created_at: "2026-09-25T18:16:54Z" },
  { thermal_image: createThermalSvgUri("TH-02", "9/25/2026, 6:16:43 PM"), created_at: "2026-09-25T18:16:43Z" },
  { thermal_image: createThermalSvgUri("TH-03", "9/25/2026, 6:15:35 PM"), created_at: "2026-09-25T18:15:35Z" },
  { thermal_image: createThermalSvgUri("TH-04", "9/25/2026, 6:15:20 PM"), created_at: "2026-09-25T18:15:20Z" },
];

export const mockColorImages = [
  { colour_image: createColorSvgUri("CLR-01", "9/25/2026, 6:15:10 PM"), created_at: "2026-09-25T18:15:10Z" },
  { colour_image: createColorSvgUri("CLR-02", "9/25/2026, 6:15:00 PM"), created_at: "2026-09-25T18:15:00Z" },
];
