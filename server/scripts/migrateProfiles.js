require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const UserProfile = require('../src/models/UserProfile');
    
    // We want to unset all old root-level fields that are no longer used
    const updateResult = await UserProfile.updateMany({}, {
      $unset: {
        skills: 1,
        preferredLanguage: 1,
        addresses: 1,
        workExperience: 1,
        educationHistory: 1,
        customFields: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        dateOfBirth: 1,
        gender: 1,
        nationality: 1,
        email: 1,
        phone: 1,
        alternatePhone: 1,
        linkedIn: 1,
        website: 1,
        github: 1,
        currentJobTitle: 1,
        professional_info: 1,
        identity_documents: 1,
        contact_details: 1,
        personal_info: 1
      }
    }, { strict: false });

    console.log(`Migration complete. Modified ${updateResult.modifiedCount} documents.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    mongoose.disconnect();
  }
}

migrate();
