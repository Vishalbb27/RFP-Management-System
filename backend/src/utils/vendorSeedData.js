const { Vendor } = require('../models')

const seedData = async () => {
  try {
    // Check if already seeded (prevent duplicates)
    const seeded = await Vendor.countDocuments({ email: 'sales@technova-systems.com' });
    if (seeded > 0) {
      console.log('✅ Seed data already exists, skipping...');
      return;
    }

    console.log('🌱 Seeding demo data...');

    // Insert demo vendors
    const vendors = await Vendor.insertMany([
      {
        name: "TechNova Systems",
        email: "sales@technova-systems.com",
        contactPerson: "Alice Johnson",
        phone: "+1-415-555-1020",
        status: "active"
      },
      {
        name: "Global IT Solutions", 
        email: "rfp@globalitsolutions.co",
        contactPerson: "Rahul Mehta",
        phone: "+91-22-5555-2200",
        status: "active"
      },
      {
        name: "Prime Hardware Supplies",
        email: "vishalbb178@gmail.com", 
        contactPerson: "Vishal B B",
        phone: "+1-212-555-7845",
        status: "active"
      }
    ]);

    console.log(`✅ Seeded ${vendors.length} vendors!`);


    // Create sample RFP with proposals
//     const rfp = new RFP({
//       title: "Office Equipment Procurement (Sample)",
//       description: "Sample RFP for demo purposes",
//       specifications: {
//         items: [
//           { name: "Laptop", quantity: 20, specs: { memory: "16GB RAM" } },
//           { name: "Monitor", quantity: 15, specs: { size: "27-inch" } }
//         ],
//         budget: { total: 50000, currency: "USD" },
//         deliveryTerms: { leadTimeDays: 30 }
//       },
//       vendors: vendors.map(v => v._id),
//       status: "responses_received"
//     });
//     await rfp.save();

//     console.log(`✅ Seeded ${vendors.length} vendors + 1 sample RFP!`);
//   } catch (error) {
//     console.error('❌ Seed failed:', error.message);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  }
}

module.exports = seedData;
