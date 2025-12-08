import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetProposalsByRfpQuery,
  usePollEmailsMutation,
  useSendRfpToVendorsMutation,
  useGetVendorsQuery,
  useGetRfpByIdQuery,
} from "../slices/apiSlice";
import { useState } from "react";

const ProposalsPage = () => {
  const { rfpId } = useParams();
  const { data: rfpData } = useGetRfpByIdQuery(rfpId);
  const { data: vendorsData } = useGetVendorsQuery();
  const { data, isLoading, error, refetch } = useGetProposalsByRfpQuery(rfpId);
  const [pollEmails, { isLoading: isPolling }] = usePollEmailsMutation();
  const [sendRfp, { isLoading: isSending }] = useSendRfpToVendorsMutation();
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);

  const handlePollEmails = async () => {
    try {
      await pollEmails().unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to poll emails", err);
    }
  };

  const toggleVendor = (id) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSendRfp = async () => {
    if (!rfpId || selectedVendorIds.length === 0) return;
    try {
      await sendRfp({ rfpId, vendorIds: selectedVendorIds }).unwrap();
      alert("RFP sent to selected vendors");
    } catch (err) {
      console.error("Failed to send RFP", err);
    }
  };

  return (
    <div>
      <h2>Proposals for RFP {rfpId}</h2>

      {rfpData?.rfp && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Title:</strong> {rfpData.rfp.title}
        </div>
      )}

      {/* Vendor selection and send RFP */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Select Vendors & Send RFP</h3>
        {vendorsData?.vendors?.map((v) => (
          <label key={v._id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selectedVendorIds.includes(v._id)}
              onChange={() => toggleVendor(v._id)}
            />
            {v.name} ({v.email})
          </label>
        ))}
        <button
          onClick={handleSendRfp}
          disabled={isSending || !selectedVendorIds.length}
          style={{ marginTop: "0.5rem" }}
        >
          {isSending ? "Sending..." : "Send RFP to Selected Vendors"}
        </button>
      </div>

      <button onClick={handlePollEmails} disabled={isPolling}>
        {isPolling ? "Checking emails..." : "Poll Emails for New Proposals"}
      </button>

      {isLoading && <p>Loading proposals...</p>}
      {error && <p style={{ color: "red" }}>Error loading proposals</p>}

      {data?.proposals && data.proposals.length > 0 && (
        <table
          style={{
            marginTop: "1rem",
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Total Price</th>
              <th>Lead Time</th>
              <th>Warranty</th>
              <th>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {data.proposals.map((p) => (
              <tr key={p._id}>
                <td>{p.vendorId?.name || p.vendorId}</td>
                <td>{p.parsedData?.pricing?.totalPrice ?? "-"}</td>
                <td>{p.parsedData?.deliveryDetails?.leadTime ?? "-"}</td>
                <td>{p.parsedData?.terms?.warranty ?? "-"}</td>
                <td>{p.scoredByAI?.overall ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProposalsPage;
