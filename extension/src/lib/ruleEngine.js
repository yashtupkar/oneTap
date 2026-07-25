/**
 * ruleEngine.js — Client-side rule-based field matcher.
 * Runs in the content script for fast, offline first-pass matching.
 * Mirrors the server-side matchingService but lighter weight.
 */

const FIELD_RULES = [
  { key: 'firstName',         keywords: ['first name', 'firstname', 'given name', 'fname', 'first_name'] },
  { key: 'middleName',        keywords: ['middle name', 'middlename', 'mname'] },
  { key: 'lastName',          keywords: ['last name', 'lastname', 'surname', 'family name', 'lname'] },
  { key: 'fullName',          keywords: ['full name', 'fullname', 'your name', 'name'] },
  { key: 'dateOfBirth',       keywords: ['date of birth', 'dob', 'birth date', 'birthday'] },
  { key: 'gender',            keywords: ['gender', 'sex'] },
  { key: 'nationality',       keywords: ['nationality', 'citizen'] },
  { key: 'email',             keywords: ['email', 'e-mail', 'mail'] },
  { key: 'phone',             keywords: ['phone', 'mobile', 'cell', 'telephone', 'contact number'] },
  { key: 'linkedIn',          keywords: ['linkedin'] },
  { key: 'website',           keywords: ['website', 'portfolio', 'personal url'] },
  { key: 'github',            keywords: ['github'] },
  { key: 'addressLine1',      keywords: ['address line 1', 'address1', 'street address', 'street'] },
  { key: 'addressLine2',      keywords: ['address line 2', 'address2', 'apartment', 'suite', 'apt'] },
  { key: 'city',              keywords: ['city', 'town'] },
  { key: 'state',             keywords: ['state', 'province', 'region'] },
  { key: 'postalCode',        keywords: ['postal code', 'postcode', 'zip', 'pin code', 'pincode'] },
  { key: 'country',           keywords: ['country', 'nation'] },
  { key: 'yearsOfExperience', keywords: ['years of experience', 'experience', 'total experience'] },
  { key: 'skills',            keywords: ['skills', 'technologies', 'tech stack', 'expertise'] },
  { key: 'summary',           keywords: ['summary', 'about', 'bio', 'introduction', 'about me'] },
  { key: 'expectedSalary',    keywords: ['expected salary', 'salary expectation', 'ctc', 'desired salary'] },
  { key: 'noticePeriod',      keywords: ['notice period', 'notice', 'availability'] },
  { key: 'passportNumber',    keywords: ['passport', 'passport number', 'passport no'] },
  { key: 'panNumber',         keywords: ['pan', 'pan number', 'pan card', 'pan no'] },
  { key: 'aadhaarNumber',     keywords: ['aadhaar', 'aadhar', 'aadhaar number'] },
  { key: 'drivingLicenseNumber', keywords: ['driving license', 'driving licence', 'dl number'] },
];

/**
 * Normalizes a string for comparison.
 * @param {string} str
 * @returns {string}
 */
export function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
}

/**
 * Scores a field against all rules and returns the best matching profile key.
 *
 * @param {{ name?: string, id?: string, label?: string, placeholder?: string, type?: string }} field
 * @returns {{ profileKey: string | null, confidence: number }}
 */
export function matchField(field) {
  if (field.type === 'file') return { profileKey: null, confidence: 0 };

  const tokens = [
    normalize(field.label || ''),
    normalize(field.name || ''),
    normalize(field.id || ''),
    normalize(field.placeholder || ''),
  ];

  let bestKey = null;
  let bestScore = 0;

  for (const rule of FIELD_RULES) {
    for (const keyword of rule.keywords) {
      const kw = normalize(keyword);
      for (const token of tokens) {
        if (!token) continue;
        let score = 0;
        if (token === kw) score = 1.0;
        else if (token.includes(kw) || kw.includes(token)) score = 0.85;
        else {
          const tWords = new Set(token.split(' '));
          const kWords = kw.split(' ');
          const overlap = kWords.filter(w => tWords.has(w)).length;
          if (overlap > 0) score = 0.6 * (overlap / kWords.length);
        }
        if (score > bestScore) {
          bestScore = score;
          bestKey = rule.key;
        }
      }
    }
  }

  return {
    profileKey: bestScore >= 0.4 ? bestKey : null,
    confidence: bestScore,
  };
}
