
const Vendor = require("../models/vendor.model");

class VendorService {

 async create(data) {
  const existingVendor = await Vendor.findOne({ email: data.email });

  if (existingVendor) {
    throw new Error("Vendor with this email already exists.");
  }

  const vendor = await Vendor.create(data);
  return vendor;
}

  async findAll(filters = {}) {
    const vendors = await Vendor.find(filters);
    return vendors;
  }

  async findById(id) {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      const error = new Error("Vendor not found");
      error.statusCode = 404;
      throw error;
    }
    return vendor;
  }

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
