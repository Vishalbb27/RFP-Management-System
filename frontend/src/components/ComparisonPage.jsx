import React from "react";


const ComparisonPage = ({  data, isLoading, error }) => {
  if (isLoading) return <p className="loading-text">Generating comparison...</p>;
  if (error) return <p className="error-text">Error loading comparison</p>;

  const proposals = data?.proposals || [];
  const recommendation = data?.recommendation;

  if (proposals.length < 2) {
    const message = proposals.length === 0 
        ? "No proposals have been received yet."
        : "Need at least two proposals to compare. Only one proposal received.";
    return <p className="no-data">{message}</p>;
  }


  return (
    <div className="comparison-container">
      {proposals.length >= 2 && (
        <div className="card">
          <h3 className="section-title">Proposal Score Breakdown</h3>

          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Total Price</th>
                  <th>Price Score</th>
                  <th>Delivery Score</th>
                  <th>Compliance Score</th>
                  <th>Support Score</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.proposal._id}>
                    <td>{p.vendor.name}</td>
                    <td>{p.proposal.parsedData?.pricing?.totalPrice ?? "-"}</td>
                    <td>{p.scores?.priceScore ?? "-"}</td>
                    <td>{p.scores?.deliveryScore ?? "-"}</td>
                    <td>{p.scores?.complianceScore ?? "-"}</td>
                    <td>{p.scores?.supportScore ?? "-"}</td>
                    <td className="highlight">{p.scores?.overall ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recommendation && (
        <div className="card" style={{marginTop:"10px"}}>
          <h3 className="section-title">AI Recommendation</h3>

          <p className="recommended-vendor">
            <strong>Recommended Vendor:</strong>{" "}
            <span>{recommendation.recommendedVendor}</span>
          </p>

          <p className="description">
            <strong>Reasoning:</strong> {recommendation.overallReasoning}
          </p>

          {recommendation.keyStrengths && (
            <div className="list-block">
              <strong>Key Strengths:</strong>
              <ul>
                {recommendation.keyStrengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.riskFactors && (
            <div className="list-block">
              <strong>Risk Factors:</strong>
              <ul>
                {recommendation.riskFactors.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;