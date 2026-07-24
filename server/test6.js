require('dotenv').config();
const UserProfile = require('./src/models/UserProfile');
const mongoose = require('mongoose');
const { decryptProfileSensitiveFields } = require('./src/services/encryptionService');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const profileDoc = await UserProfile.findOne({});
  const profile = decryptProfileSensitiveFields(profileDoc);
  
  const field = { name: 'pet_name', label: "Pet's Name" };
  
  let customKey = field.name || field.id;
  if (!customKey && field.label) {
    customKey = field.label.toLowerCase().trim().replace(/[\s\W]+/g, '_');
  }
  
  console.log("Custom Key:", customKey);
  console.log("Profile Custom Fields:", profile.customFields);
  
  if (customKey && profile.customFields && profile.customFields[customKey]) {
    console.log("Matched value:", profile.customFields[customKey]);
  } else {
    console.log("Not matched");
  }

  mongoose.disconnect();
});
