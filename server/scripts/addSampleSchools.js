const mongoose = require('mongoose');
const School = require('../models/School');
require('dotenv').config();

// Sample schools data for Bihar
const sampleSchools = [
  {
    name: "Government High School, Patna",
    code: "GHS001",
    location: {
      latitude: 25.5941,
      longitude: 85.1376
    },
    address: {
      street: "Gandhi Maidan Road",
      village: "Patna City",
      block: "Patna Sadar",
      district: "Patna",
      state: "Bihar",
      pincode: "800001"
    },
    boundaryRadius: 100
  },
  {
    name: "Government Middle School, Gaya",
    code: "GMS002",
    location: {
      latitude: 24.7914,
      longitude: 85.0002
    },
    address: {
      street: "Bodh Gaya Road",
      village: "Gaya City",
      block: "Gaya",
      district: "Gaya",
      state: "Bihar",
      pincode: "823001"
    },
    boundaryRadius: 100
  },
  {
    name: "Government Primary School, Muzaffarpur",
    code: "GPS003",
    location: {
      latitude: 26.1209,
      longitude: 85.3647
    },
    address: {
      street: "Station Road",
      village: "Muzaffarpur City",
      block: "Muzaffarpur",
      district: "Muzaffarpur",
      state: "Bihar",
      pincode: "842001"
    },
    boundaryRadius: 100
  },
  {
    name: "Government High School, Bhagalpur",
    code: "GHS004",
    location: {
      latitude: 25.2445,
      longitude: 86.9718
    },
    address: {
      street: "Adampur Road",
      village: "Bhagalpur City",
      block: "Bhagalpur",
      district: "Bhagalpur",
      state: "Bihar",
      pincode: "812001"
    },
    boundaryRadius: 100
  },
  {
    name: "Government Middle School, Darbhanga",
    code: "GMS005",
    location: {
      latitude: 26.1522,
      longitude: 85.8971
    },
    address: {
      street: "Tower Chowk",
      village: "Darbhanga City",
      block: "Darbhanga",
      district: "Darbhanga",
      state: "Bihar",
      pincode: "846001"
    },
    boundaryRadius: 100
  }
];

async function addSampleSchools() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database: shikshak_watch');
    console.log('🌐 Cluster: MongoDB Atlas');
    console.log('');

    // Clear existing schools (optional - comment out if you want to keep existing)
    // await School.deleteMany({});
    // console.log('🗑️  Cleared existing schools');

    let addedCount = 0;
    let existingCount = 0;

    console.log('🏫 Adding sample schools to database...');
    console.log('');

    // Add sample schools
    for (const schoolData of sampleSchools) {
      const existingSchool = await School.findOne({ code: schoolData.code });
      if (!existingSchool) {
        const school = new School(schoolData);
        await school.save();
        console.log(`✅ Added: ${school.name} (${school.code})`);
        console.log(`   📍 Location: ${school.location.latitude}, ${school.location.longitude}`);
        console.log(`   🏘️  Address: ${school.address.village}, ${school.address.block}, ${school.address.district}`);
        console.log('');
        addedCount++;
      } else {
        console.log(`⚠️  Already exists: ${schoolData.name} (${schoolData.code})`);
        existingCount++;
      }
    }

    console.log('🎉 Sample schools process completed!');
    console.log('📈 Summary:');
    console.log(`   ✅ New schools added: ${addedCount}`);
    console.log(`   ⚠️  Schools already existed: ${existingCount}`);
    console.log(`   📊 Total schools in database: ${addedCount + existingCount}`);
    console.log('');
    console.log('🚀 You can now:');
    console.log('   1. Start the frontend: cd ../client && npm start');
    console.log('   2. Register as admin at http://localhost:3000/register');
    console.log('   3. Login and manage schools');
    console.log('   4. Register teachers/principals for these schools');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   • Register as admin user');
    console.log('   • Login to admin dashboard');
    console.log('   • View and manage schools');
    console.log('   • Register teachers and principals');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample schools:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your .env file has MONGODB_URI');
    console.log('   2. Verify MongoDB Atlas connection');
    console.log('   3. Check internet connection');
    process.exit(1);
  }
}

// Run the script
addSampleSchools(); 