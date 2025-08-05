import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ImagePanel from './pages/ImagePanel';
import CycleControl from './pages/CycleControl';
import { useMqtt } from './store/MqttContext';
import FilterData from './pages/FilterData';
import Login from './pages/Login';
import Logout from './pages/Logout';


const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

const AppLayout = ({ children }) => {
  const { connectionStatus = 'disconnected' } = useMqtt();
  const isConnected = connectionStatus === 'connected';

  return (
    <>
      <nav className="relative bg-gray-800 p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Nav Links */}
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <NavLink
            to="/pilotfeedtraydashboard/image"
            end
            className={({ isActive }) =>
              `px-3 py-1 rounded-md transition ${isActive ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
              }`
            }
          >
            Image Display Panel
          </NavLink>

          <NavLink
            to="/pilotfeedtraydashboard"
            end
            className={({ isActive }) =>
              `px-3 py-1 rounded-md transition ${isActive ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
              }`
            }
          >
            Cycle Control Panel
          </NavLink>
        </div>

        {/* Mobile-only title + connection in one row */}
        <div className="flex sm:hidden items-center w-full px-6 justify-center">
          <div className="text-xl font-bold text-white justify-center">Feed Tray</div>
          <div className="flex items-center gap-2">
            {/* <span
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              title={`MQTT status: ${connectionStatus}`}
            />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span> */}
          </div>
        </div>

        {/* Desktop-only centered title */}
        <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 text-xl font-bold tracking-widest text-white">
          Feed Tray
        </div>

        {/* Right - Connection Status */}
        <div className="flex items-center gap-4 justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={`MQTT status: ${connectionStatus}`}
            />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <NavLink
            to="/logout"
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md transition text-white"
          >
            Logout
          </NavLink>
        </div>

      </nav>


      <main className="px-2 sm:px-4 py-2">{children}</main>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/pilotfeedtraydashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-[73%] p-3 border border-gray-300 rounded-xl">
                    <CycleControl />
                  </div>
                  <div className="w-full md:w-[25%] p-2 md:p-4 overflow-auto border-t md:border-t-0 md:border-l border-gray-300 rounded-xl md:rounded-none">
                    <FilterData />
                  </div>
                </div>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/pilotfeedtraydashboard/image"
          element={
            <PrivateRoute>
              <AppLayout>
                <ImagePanel />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
};

export default App;
