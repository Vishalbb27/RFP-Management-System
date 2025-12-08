import React from "react";
import { Link } from "react-router-dom";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";

const Sidebar = ({ isOpen, toggleSidebar, history, onNewRfpClick }) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <RxHamburgerMenu />
        </button>

        <button
          className={`new-chat-btn ${!isOpen ? "icon-only" : "full-text"}`} 
          onClick={onNewRfpClick}
          title="Start a New RFP"
        >
          <IoChatbubbleEllipsesOutline />

          {isOpen && <span className="new-rfp-text">New RFP</span>}
        </button>
      </div>

      <div className="history-section">
        {isOpen && <h4 className="history-title">RFP History</h4>}
        <ul className="history-list">
          {history.map((rfp) => (
            <li key={rfp._id} className="history-item">
              <Link
                to={`/rfps/${rfp._id}`}
                className="history-link"
                title={rfp.title || `RFP ${rfp._id.substring(0, 8)}`}
              >
              {rfp.title || `RFP ${rfp._id.substring(0, 8)}...`}
              </Link>
            </li>
          ))}
          {history.length === 0 && isOpen && (
            <p className="no-history">No history yet.</p>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
