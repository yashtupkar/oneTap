require('dotenv').config();
const mongoose = require('mongoose');
const UserProfile = require('./src/models/UserProfile');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const profile = await UserProfile.findOne({});
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  console.log("Raw object customFields:", obj.customFields);
  console.log("JSON.stringify output:", JSON.stringify(obj));
  mongoose.disconnect();
});
