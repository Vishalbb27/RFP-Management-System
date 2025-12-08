// App.js

import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import RfpChatPage from "./components/RfpChatPage";
import VendorPage from "./components/VendorPage";
import RfpDetailPage from "./components/RfpDetailPage";
import Sidebar from "./components/Sidebar";
import { useGetRfpHistoryQuery } from "./slices/apiSlice"; 
import "./index.css";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const navigate = useNavigate();
  const { data: historyData } = useGetRfpHistoryQuery();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNewRfp = () => {
    navigate("/rfps/new");
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {isModalOpen && <VendorPage onClose={handleCloseModal} />}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        history={historyData?.rfps || []}
        onNewRfpClick={handleNewRfp}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className={`main-content ${
          isSidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        <header className="main-header">
          <h2>RFP Management AI</h2>
          <button
            className="poll-email-btn"
            onClick={handleOpenModal} 
          >
            Create Vendor
          </button>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<RfpChatPage />} />
            <Route path="/rfps/:rfpId" element={<RfpDetailPage />} />
            <Route path="/rfps/new" element={<RfpChatPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;