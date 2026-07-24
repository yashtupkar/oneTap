const crypto = require('crypto');

/**
 * matchingService.js
 *
 * Rule-based field → profile key matcher.
 * Uses normalized labels, name/id/placeholder heuristics, and keyword lists.
 * Returns confidence 0–1. Confidence ≥ 0.8 means "fill without asking".
 */

// ── Profile key → keywords mapping ───────────────────────────────────────────
const FIELD_RULES = [
  // Personal
  { key: 'firstName',         keywords: ['first name', 'firstname', 'given name', 'fname', 'first_name'] },
  { key: 'middleName',        keywords: ['middle name', 'middlename', 'middle_name', 'mname'] },
  { key: 'lastName',          keywords: ['last name', 'lastname', 'surname', 'family name', 'lname', 'last_name'] },
  { key: 'fullName',          keywords: ['full name', 'fullname', 'your name', 'full_name'] },
  { key: 'dateOfBirth',       keywords: ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday', 'born'] },
  { key: 'gender',            keywords: ['gender', 'sex'] },
  { key: 'nationality',       keywords: ['nationality', 'citizen', 'citizenship'] },

  // Contact
  { key: 'email',             keywords: ['email', 'e-mail', 'email address', 'mail'] },
  { key: 'phone',             keywords: ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'phone number', 'mobile number'] },
  { key: 'alternatePhone',    keywords: ['alternate phone', 'secondary phone', 'other phone', 'alt phone'] },
  { key: 'linkedIn',          keywords: ['linkedin', 'linked in', 'linkedin url', 'linkedin profile'] },
  { key: 'website',           keywords: ['website', 'portfolio', 'personal website', 'personal url', 'url', 'web'] },
  { key: 'github',            keywords: ['github', 'git hub', 'github url', 'github profile'] },

  // Address
  { key: 'addressLine1',      keywords: ['address line 1', 'address1', 'street address', 'street', 'address'] },
  { key: 'addressLine2',      keywords: ['address line 2', 'address2', 'apartment', 'suite', 'unit', 'apt'] },
  { key: 'city',              keywords: ['city', 'town', 'municipality'] },
  { key: 'state',             keywords: ['state', 'province', 'region'] },
  { key: 'postalCode',        keywords: ['postal code', 'postcode', 'zip', 'zip code', 'pin', 'pin code', 'pincode'] },
  { key: 'country',           keywords: ['country', 'nation'] },

  // Professional
  { key: 'currentJobTitle',   keywords: ['job title', 'designation', 'title', 'position', 'role', 'current role', 'current title'] },
  { key: 'currentCompany',    keywords: ['company', 'employer', 'organization', 'organisation', 'current company', 'current employer', 'workplace'] },
  { key: 'yearsOfExperience', keywords: ['years of experience', 'experience', 'total experience', 'work experience', 'years exp'] },
  { key: 'skills',            keywords: ['skills', 'technologies', 'tech stack', 'expertise', 'competencies'] },
  { key: 'summary',           keywords: ['summary', 'about', 'bio', 'introduction', 'profile summary', 'about me', 'professional summary'] },
  { key: 'expectedSalary',    keywords: ['expected salary', 'salary expectation', 'ctc', 'expected ctc', 'desired salary', 'salary'] },
  { key: 'noticePeriod',      keywords: ['notice period', 'notice', 'available from', 'joining date', 'availability'] },

  // Education
  { key: 'highestDegree',     keywords: ['degree', 'qualification', 'highest qualification', 'education level', 'highest degree'] },
  { key: 'fieldOfStudy',      keywords: ['field of study', 'major', 'specialization', 'branch', 'discipline', 'stream'] },
  { key: 'university',        keywords: ['university', 'college', 'institution', 'school', 'alma mater'] },
  { key: 'graduationYear',    keywords: ['graduation year', 'passed out', 'batch', 'year of graduation', 'passing year'] },

  // Identity (sensitive — high threshold enforced in autofill route)
  { key: 'passportNumber',    keywords: ['passport', 'passport number', 'passport no'] },
  { key: 'panNumber',         keywords: ['pan', 'pan number', 'pan card', 'pan no', 'permanent account number'] },
  { key: 'aadhaarNumber',     keywords: ['aadhaar', 'aadhar', 'aadhaar number', 'aadhaar no', 'uid'] },
  { key: 'drivingLicenseNumber', keywords: ['driving license', 'driving licence', 'dl number', 'license number', 'dl no'] },
];

/** Sensitive keys that require a confirmation dialog before filling */
const SENSITIVE_KEYS = new Set([
  'passportNumber', 'panNumber', 'aadhaarNumber', 'drivingLicenseNumber',
  'dateOfBirth', 'expectedSalary',
]);

/**
 * Normalizes a string for comparison: lowercase, trim, collapse spaces.
 * @param {string} str
 * @returns {string}
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
}

/**
 * Computes a SHA-256 fingerprint for a field descriptor.
 * @param {{ name?: string, id?: string, label?: string, type: string }} field
 * @returns {string}
 */
function computeFieldFingerprint(field) {
  const parts = [
    normalize(field.name || ''),
    normalize(field.id || ''),
    normalize(field.label || ''),
    normalize(field.type || 'text'),
  ].join('|');
  return crypto.createHash('sha256').update(parts).digest('hex');
}

/**
 * Scores a single field against a single rule.
 * Returns 0–1 based on how well the keywords match the field descriptors.
 *
 * @param {{ name?: string, id?: string, label?: string, placeholder?: string, type: string }} field
 * @param {{ key: string, keywords: string[] }} rule
 * @returns {number}
 */
function scoreField(field, rule) {
  const tokens = [
    normalize(field.label || ''),
    normalize(field.name || ''),
    normalize(field.id || ''),
    normalize(field.placeholder || ''),
  ];

  let best = 0;

  for (const keyword of rule.keywords) {
    const kw = normalize(keyword);
    for (const token of tokens) {
      if (!token) continue;
      if (token === kw) {
        best = Math.max(best, 1.0);       // exact match
      } else if (kw.length > 4 && (token.includes(kw) || kw.includes(token))) {
        best = Math.max(best, 0.85);      // partial match, only if kw is long enough
      } else {
        // Word-level overlap
        const tokenWords = new Set(token.split(' '));
        const kwWords = kw.split(' ');
        const overlap = kwWords.filter(w => tokenWords.has(w)).length;
        if (overlap > 0) {
          best = Math.max(best, 0.6 * (overlap / kwWords.length));
        }
      }
    }
    if (best >= 1.0) break;
  }

  return best;
}

/**
 * Matches a list of field descriptors against profile keys using rules.
 *
 * @param {Array<{ name?: string, id?: string, label?: string, placeholder?: string, type: string }>} fields
 * @returns {Array<{ fieldIndex: number, profileKey: string | null, confidence: number, source: string, requiresConfirmation: boolean }>}
 */
function matchFields(fields) {
  return fields.map((field, fieldIndex) => {
    // Skip file inputs — handled separately by document matcher
    if (field.type === 'file') {
      return { fieldIndex, profileKey: null, confidence: 0, source: 'rule', isFileInput: true, requiresConfirmation: false };
    }

    let bestKey = null;
    let bestScore = 0;

    for (const rule of FIELD_RULES) {
      const score = scoreField(field, rule);
      if (score > bestScore) {
        bestScore = score;
        bestKey = rule.key;
      }
    }

    const requiresConfirmation = bestKey ? SENSITIVE_KEYS.has(bestKey) : false;

    return {
      fieldIndex,
      profileKey: bestScore >= 0.65 ? bestKey : null,
      confidence: bestScore,
      source: 'rule',
      isFileInput: false,
      requiresConfirmation,
    };
  });
}

/**
 * Suggests the most appropriate document category for a file input field.
 *
 * @param {{ name?: string, id?: string, label?: string, placeholder?: string, accept?: string }} field
 * @returns {{ category: string | null, confidence: number }}
 */
function matchFileInputToCategory(field) {
  const text = normalize(
    [field.label, field.name, field.id, field.placeholder].join(' ')
  );

  const categoryRules = [
    { category: 'resume',          keywords: ['resume', 'cv', 'curriculum vitae'] },
    { category: 'cover_letter',    keywords: ['cover letter', 'cover', 'letter'] },
    { category: 'passport',        keywords: ['passport'] },
    { category: 'aadhaar',         keywords: ['aadhaar', 'aadhar', 'uid'] },
    { category: 'pan_card',        keywords: ['pan', 'pan card'] },
    { category: 'driving_license', keywords: ['driving license', 'driving licence', 'dl'] },
    { category: 'photo',           keywords: ['photo', 'photograph', 'picture', 'image', 'profile pic'] },
    { category: 'certificate',     keywords: ['certificate', 'degree', 'transcript', 'marksheet'] },
  ];

  let best = { category: null, confidence: 0 };

  for (const rule of categoryRules) {
    for (const kw of rule.keywords) {
      if (text.includes(normalize(kw))) {
        const score = kw.split(' ').length > 1 ? 0.95 : 0.8;
        if (score > best.confidence) {
          best = { category: rule.category, confidence: score };
        }
      }
    }
  }

  return best;
}

module.exports = {
  matchFields,
  matchFileInputToCategory,
  computeFieldFingerprint,
  normalize,
  SENSITIVE_KEYS,
};
