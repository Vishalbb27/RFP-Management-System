const VendorCard = ({ vendor, isSelected, onToggle }) => (
  <div 
    className={`vendor-card ${isSelected ? 'selected' : ''}`} 
    onClick={onToggle}
  >
    <div className="vendor-info">
      <h4>{vendor.name}</h4>
      <p>{vendor.email}</p>
    </div>
    <span className="checkbox-indicator">{isSelected ? '✓' : '☐'}</span>
  </div>
);

export default VendorCard;