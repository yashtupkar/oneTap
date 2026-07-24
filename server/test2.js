require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const FieldMapping = require('./src/models/FieldMapping');
  const UserProfile = require('./src/models/UserProfile');
  
  const mappings = await FieldMapping.find({});
  console.log("MAPPINGS:", mappings.map(m => ({ 
    fingerprint: m.fieldFingerprint, 
    key: m.profileKey, 
    conf: m.confidence,
    label: m.fieldDescriptor?.label
  })));

  const profile = await UserProfile.findOne({});
  console.log("PROFILE:", profile);
  
  mongoose.disconnect();
}).catch(console.error);
