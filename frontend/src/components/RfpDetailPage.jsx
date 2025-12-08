import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetProposalsByRfpQuery,
  useGetComparisonQuery,
  useGetRfpByIdQuery,
  usePollEmailsMutation,
} from "../slices/apiSlice";
import ComparisonPage from "./ComparisonPage"; 
import "../index.css";

const ProposalModal = ({ proposal, vendorName, onClose }) => {
  if (!proposal) return null;

  const { parsedData, rawEmailBody, scoredByAI } = proposal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h3>Proposal Details: {vendorName}</h3>
        <h4>Email: {proposal.vendorId.email}</h4>

        <div className="modal-section">
          <h4>AI Summary & Score</h4>
          <p>
            <strong>Overall Score:</strong> {scoredByAI?.overall ?? "-"} / 100
          </p>
          <p>
            <strong>AI Reasoning:</strong> {scoredByAI?.reasoning ?? "N/A"}
          </p>
        </div>

        <div className="modal-section">
          <h4>Pricing</h4>
          <p>
            <strong>Total Price:</strong> {parsedData?.pricing?.totalPrice}{" "}
            {parsedData?.pricing?.currency}
          </p>
          <p>
            <strong>Discounts:</strong>{" "}
            {parsedData?.pricing?.discounts || "None"}
          </p>
          {parsedData?.pricing?.breakdown?.length > 0 && (
            <table className="data-table price-breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.pricing.breakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice}</td>
                    <td>{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-section-grid">
          <div>
            <h4>Delivery Details</h4>
            <p>
              <strong>Lead Time:</strong>{" "}
              {parsedData?.deliveryDetails?.leadTime || "-"}
            </p>
            <p>
              <strong>Estimated Date:</strong>{" "}
              {parsedData?.deliveryDetails?.estimatedDate
                ? new Date(
                    parsedData.deliveryDetails.estimatedDate
                  ).toLocaleDateString()
                : "-"}
            </p>
            <p>
              <strong>Shipping Cost:</strong>{" "}
              {parsedData?.deliveryDetails?.shippingCost ?? "-"}
            </p>
          </div>
          <div>
            <h4>Terms & Compliance</h4>
            <p>
              <strong>Payment Terms:</strong>{" "}
              {parsedData?.terms?.paymentTerms || "-"}
            </p>
            <p>
              <strong>Warranty:</strong> {parsedData?.terms?.warranty || "-"}
            </p>
            <p>
              <strong>Compliance Matched:</strong>{" "}
              {parsedData?.compliance?.specsMatched?.length ?? 0} specs
            </p>
          </div>
        </div>
        <div className="modal-section">
          <h4>Raw Email Body</h4>
          <pre className="raw-content">
            {rawEmailBody || "No raw email body stored."}
          </pre>
        </div>
      </div>
    </div>
  );
};

const RfpDetailPage = () => {
  const { rfpId } = useParams();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [pollEmails, { isLoading: isPolling }] = usePollEmailsMutation();

  useEffect(
    () => async () => {
      try {
        await pollEmails().unwrap();
      } catch (err) {
        console.error("Failed to poll emails", err);
      }
    },
    [pollEmails]
  );

  const {
    data: proposalsData,
    isLoading: isProposalsLoading,
    error: proposalsError,
  } = useGetProposalsByRfpQuery(rfpId);

  const {
    data: comparisonData,
    isLoading: isComparisonLoading,
    error: comparisonError,
  } = useGetComparisonQuery(rfpId);

  const { data: rfpData } = useGetRfpByIdQuery(rfpId);

  const proposals = proposalsData?.proposals || [];

  const openProposalModal = (proposal) => {
    setSelectedProposal(proposal);
  };

  const closeProposalModal = () => {
    setSelectedProposal(null);
  };

  return (
    <div className="rfp-detail-page">
      <ProposalModal
        proposal={selectedProposal}
        vendorName={
          selectedProposal?.vendorId?.name || selectedProposal?.vendorId
        }
        onClose={closeProposalModal}
      />

      {rfpData && <h2>RFP Detail: {rfpData.rfp.title}</h2>}

      <div className="section-card">
        <h3>Received Proposals ({proposals.length})</h3>
        {isProposalsLoading && isPolling && <p>Loading proposals...</p>}
        {proposalsError && (
          <p className="error-message">Error loading proposals</p>
        )}

        {proposals.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Total Price</th>
                <th>Overall Score</th>
                <th>View Details</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p._id}>
                  <td>{p.vendorId?.name || p.vendorId}</td>
                  <td>{p.parsedData?.pricing?.totalPrice ?? "-"}</td>
                  <td>{p.scoredByAI?.overall ?? "-"}</td>
                  <td>
                    <button
                      onClick={() => openProposalModal(p)}
                      className="view-details-btn"
                    >
                      View Proposal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No proposals received yet.</p>
        )}
      </div>

      <div className="section-card comparison-section">
        <h3 style={{ marginBottom: "1rem" }}>AI Comparison & Recommendation</h3>

        <ComparisonPage
          rfpId={rfpId} 
          data={comparisonData}
          isLoading={isComparisonLoading}
          error={comparisonError}
        />
      </div>
    </div>
  );
};

export default RfpDetailPage;
