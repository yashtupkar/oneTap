require('dotenv').config();
const { classifyField } = require('./src/services/aiService');

const fieldDescriptor = { name: 'pet_name', id: 'pet-name', label: "Pet's Name", placeholder: "e.g. Fluffy", type: "text" };
classifyField(fieldDescriptor, process.env.OPENROUTER_API_KEY).then(res => {
  console.log("AI Result:", res);
});
