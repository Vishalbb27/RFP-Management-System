import React, { useState } from "react";
import { useCreateRfpFromTextMutation, useGetVendorsQuery, useSendRfpToVendorsMutation } from "../slices/apiSlice";
import { useNavigate } from "react-router-dom";
import VendorCard from "./VendorCard"; 
import "../index.css"

const RfpChatPage = () => {
  const [text, setText] = useState("");
  const [createdRfpId, setCreatedRfpId] = useState(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  
  const [createRfp, { data: rfpData, isLoading: isCreating, error: rfpError }] =
    useCreateRfpFromTextMutation();
  const { data: vendorsData, isLoading: isVendorsLoading } = useGetVendorsQuery();
  const [sendRfp, { isLoading: isSending }] = useSendRfpToVendorsMutation();
  
  const navigate = useNavigate();

  const handleCreateRfp = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const result = await createRfp(text).unwrap();
      if (result?.rfp?._id) {
        setCreatedRfpId(result.rfp._id);
        setText(""); 
      }
    } catch (err) {
      console.error("Failed to create RFP", err);
    }
  };

  const toggleVendor = (id) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };
  
  const handleSendRfp = async () => {
    if (!createdRfpId || selectedVendorIds.length === 0) return;
    try {
      await sendRfp({ rfpId: createdRfpId, vendorIds: selectedVendorIds }).unwrap();
      alert("RFP sent to selected vendors");
      // Navigate to the detail page after sending
      navigate(`/rfps/${createdRfpId}`);
    } catch (err) {
      console.error("Failed to send RFP", err);
    }
  };

  if (createdRfpId) {
    return (
      <div className="rfp-selection-container">
        <h2>RFP Generated! Select Vendors to Send To:</h2>
        
        {rfpData?.rfp && (
          <div className="rfp-summary-card">
            <h4>{rfpData.rfp.title || `RFP ${createdRfpId.substring(0, 8)}`}</h4>
            <p>RFP specifications are ready for distribution.</p>
          </div>
        )}
        
        <div className="vendor-card-list">
          {isVendorsLoading ? (
            <p>Loading vendors...</p>
          ) : (
            vendorsData?.vendors?.map((v) => (
              <VendorCard
                key={v._id}
                vendor={v}
                isSelected={selectedVendorIds.includes(v._id)}
                onToggle={() => toggleVendor(v._id)}
              />
            ))
          )}
        </div>
        
        <button
          className="send-rfp-btn"
          onClick={handleSendRfp}
          disabled={isSending || selectedVendorIds.length === 0}
        >
          {isSending ? "Sending..." : `Send RFP to ${selectedVendorIds.length} Vendor(s)`}
        </button>
      </div>
    );
  }

  return (
    <div className="rfp-chat-page">
      <form onSubmit={handleCreateRfp} className="chat-form">
        <textarea
          className="chat-textarea"
          rows={4}
          placeholder="Describe what you want to procure in natural language (e.g., 'I need 100 high-performance servers with 32GB RAM and a 3-year warranty')..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="chat-submit-btn"
          disabled={isCreating || !text.trim()}
        >
          {isCreating ? "Generating RFP..." : "Generate RFP"}
        </button>
      </form>
      {rfpError && (
        <p className="error-message">Error creating RFP. Please try again.</p>
      )}
      <div className="welcome-message">
        <p>✨ **RFP AI Assistant**</p>
        <p>Start a new request by describing your procurement needs.</p>
      </div>
    </div>
  );
};

// Helper component for the vendor card



export default RfpChatPage;