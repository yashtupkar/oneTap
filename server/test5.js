require('dotenv').config();
const { matchFields } = require('./src/services/matchingService');
const { encryptProfileSensitiveFields, decryptProfileSensitiveFields } = require('./src/services/encryptionService');
const mongoose = require('mongoose');

const fields = [
  { name: 'pet_name', id: 'pet-name', label: "Pet's Name", placeholder: "e.g. Fluffy", type: "text" }
];

console.log("Match Result:", JSON.stringify(matchFields(fields), null, 2));

const UserProfile = require('./src/models/UserProfile');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const profile = await UserProfile.findOne({});
  const decrypted = decryptProfileSensitiveFields(profile);
  console.log("Decrypted profile customFields:", decrypted.customFields);
  console.log("JSON.stringify output:", JSON.stringify(decrypted));
  mongoose.disconnect();
});
