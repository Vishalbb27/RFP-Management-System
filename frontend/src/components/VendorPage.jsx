// src/components/VendorModal.js (Updated)

import React, { useState } from "react";
import { useCreateVendorMutation } from "../slices/apiSlice";

const VendorModal = ({ onClose }) => {
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    contactPerson: "",
    phone: "",
  });

  const [apiError, setApiError] = useState(null); 

  const handleChange = (e) => {
    setApiError(null); 
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null); 
    
    try {
      await createVendor(form).unwrap();
      setForm({ name: "", email: "", contactPerson: "", phone: "" });
      onClose();
    } catch (err) {
      console.error("Failed to create vendor", err);
      
      if (err.data && err.data.message) {
        setApiError(err.data.message);
      } else if (err.status === 409) {
        setApiError("A vendor with this email already exists. Please use a different email.");
      } else {
        setApiError("An unknown error occurred while creating the vendor.");
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {apiError && <p className="error-display">{apiError}</p>}
        <div className="modal-header">
          <h3>Create New Vendor</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vendor-modal-form">
          <div className="form-field">
            <label htmlFor="name">Vendor Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="contactPerson">Contact Person</label>
            <input
              id="contactPerson"
              name="contactPerson"
              type="text"
              value={form.contactPerson}
              onChange={handleChange}
            />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={isCreating} className="save-btn">
            {isCreating ? "Saving..." : "Save Vendor"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;