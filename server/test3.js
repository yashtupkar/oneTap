require('dotenv').config();
const mongoose = require('mongoose');
const UserProfile = require('./src/models/UserProfile');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const profile = await UserProfile.findOne({});
    console.log("Current customFields:", profile.customFields);

    await UserProfile.findOneAndUpdate(
      { deviceId: profile.deviceId },
      { $set: { 'customFields.pet_name': 'Fluffy' } }
    );

    const updated = await UserProfile.findOne({});
    console.log("Updated customFields:", updated.customFields);
  } catch (err) {
    console.error(err);
  }
  mongoose.disconnect();
});
