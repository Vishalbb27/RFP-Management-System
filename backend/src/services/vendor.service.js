// vendor.service.js
const Vendor = require("../models/vendor.model"); // update path as per your structure

class VendorService {
  // Create vendor
  async create(data) {
    const vendor = await Vendor.create(data);
    return vendor;
  }

  // Get all vendors
  async findAll(filters = {}) {
    const vendors = await Vendor.find(filters);
    return vendors;
  }

  // Get vendor by ID
  async findById(id) {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      const error = new Error("Vendor not found");
      error.statusCode = 404;
      throw error;
    }
    return vendor;
  }

  // Update vendor by ID
  async update(id, data) {
    const vendor = await Vendor.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!vendor) {
      const error = new Error("Vendor not found");
      error.statusCode = 404;
      throw error;
    }

    return vendor;
  }

  // Delete vendor
  async delete(id) {
    const vendor = await Vendor.findByIdAndDelete(id);

    if (!vendor) {
      const error = new Error("Vendor not found");
      error.statusCode = 404;
      throw error;
    }

    return { message: "Vendor deleted successfully" };
  }
}

module.exports = new VendorService();
