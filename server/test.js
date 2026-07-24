const { matchFields } = require('./src/services/matchingService');

const fields = [
  { name: 'pet_name', id: 'pet-name', label: "Pet's Name", placeholder: "e.g. Fluffy", type: "text" }
];

console.log(JSON.stringify(matchFields(fields), null, 2));
