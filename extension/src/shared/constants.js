/**
 * constants.js — Shared constants for the extension
 */

/** Backend API base URL */
export const API_BASE = 'http://localhost:3001/api';

export const STORAGE_KEYS = {
  DEVICE_ID: 'deviceId',
  TOKEN: 'token',
  SETTINGS: 'settings',
  AI_CACHE: 'aiCache',
  ENABLED: 'autofillEnabled',
};

/** Default user settings */
export const DEFAULT_SETTINGS = {
  enabled: true,
  ruleConfidenceThreshold: 0.8,    // Fill without asking above this
  sensitiveThreshold: 0.95,         // Fill sensitive fields without asking
  showOverlays: true,
  askBeforeFileUpload: true,
  askBeforeSensitiveFields: true,
  openrouterApiKey: '',
  serverUrl: 'http://localhost:3001',
};

/** Autofill statuses */
export const STATUS = {
  FILLED: 'filled',
  SUGGESTED: 'suggested',
  MISSING: 'missing',
};

/** Status colors (Tailwind classes) */
export const STATUS_COLORS = {
  filled: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  suggested: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  missing: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' },
};

/** Status labels */
export const STATUS_LABELS = {
  filled: '✅ Filled',
  suggested: '💡 Suggested',
  missing: '❌ Missing',
};

/** Document category display names */
export const DOCUMENT_CATEGORIES = [
  { value: 'resume', label: 'Resume / CV', icon: '📄' },
  { value: 'cover_letter', label: 'Cover Letter', icon: '✉️' },
  { value: 'passport', label: 'Passport', icon: '🛂' },
  { value: 'aadhaar', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'pan_card', label: 'PAN Card', icon: '💳' },
  { value: 'driving_license', label: 'Driving License', icon: '🚗' },
  { value: 'photo', label: 'Photo / Profile Picture', icon: '📸' },
  { value: 'certificate', label: 'Certificate / Transcript', icon: '🎓' },
  { value: 'other', label: 'Other Document', icon: '📎' },
];

/** Default Profile Schema Definitions (for options page) */
export const DEFAULT_SCHEMA_DEFINITIONS = [
  {
    id: "personal_info",
    title: "Personal Information",
    icon: "👤",
    isArray: false,
    fields: [
      {
        key: "firstName",
        label: "First Name",
        type: "text",
        aiAliases: [
          "given name"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "middleName",
        label: "Middle Name",
        type: "text",
        aiAliases: [],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "text",
        aiAliases: [
          "surname",
          "family name"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "fullName",
        label: "Full Name",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "name"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        aiAliases: [
          "dob",
          "birth date"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: [
          "Male",
          "Female",
          "Other",
          "Prefer not to say"
        ],
        aiAliases: [
          "sex"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "nationality",
        label: "Nationality",
        type: "text",
        aiAliases: [
          "citizenship"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "maritalStatus",
        label: "Marital Status",
        type: "select",
        options: [
          "Single",
          "Married",
          "Divorced",
          "Widowed"
        ],
        aiAliases: [
          "civil status"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "contact_details",
    title: "Contact Details",
    icon: "📞",
    isArray: false,
    fields: [
      {
        key: "email",
        label: "Email Address",
        type: "email",
        autofillPriority: "HIGH",
        aiAliases: [
          "email address",
          "e-mail"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "alternateEmail",
        label: "Alternate Email",
        type: "email",
        aiAliases: [
          "email",
          "secondary email",
          "other email"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "phone",
        label: "Phone Number",
        type: "tel",
        autofillPriority: "HIGH",
        aiAliases: [
          "mobile",
          "cell",
          "contact number"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "alternatePhone",
        label: "Alternate Phone",
        type: "tel",
        aiAliases: [
          "phone",
          "secondary phone",
          "home phone"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "linkedIn",
        label: "LinkedIn URL",
        type: "url",
        aiAliases: [
          "linkedin profile"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "website",
        label: "Portfolio Website",
        type: "url",
        aiAliases: [
          "personal website",
          "blog"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "github",
        label: "GitHub URL",
        type: "url",
        aiAliases: [
          "github profile"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "addresses",
    title: "Addresses",
    icon: "🏠",
    isArray: true,
    fields: [
      {
        key: "addressType",
        label: "Address Type",
        type: "select",
        options: [
          "Permanent",
          "Temporary",
          "Current",
          "Office",
          "Other"
        ],
        aiAliases: [
          "type of address"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "addressLine1",
        label: "Address Line 1",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "address 1",
          "line 1",
          "street"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "addressLine2",
        label: "Address Line 2",
        type: "text",
        aiAliases: [
          "address 2",
          "line 2",
          "apt",
          "suite"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "city",
        label: "City",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "town",
          "municipality"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "state",
        label: "State / Province",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "region",
          "province"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "postalCode",
        label: "Postal / ZIP Code",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "zip",
          "pin code",
          "zipcode"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "country",
        label: "Country",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "nation"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "professional_info",
    title: "Professional Info",
    icon: "💼",
    isArray: false,
    fields: [
      {
        key: "currentJobTitle",
        label: "Current Job Title",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "role",
          "designation"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "currentCompany",
        label: "Current Company",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "employer",
          "organization"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "yearsOfExperience",
        label: "Years of Experience",
        type: "number",
        autofillPriority: "HIGH",
        aiAliases: [
          "total experience"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "summary",
        label: "Professional Summary",
        type: "textarea",
        aiAliases: [
          "about me",
          "bio",
          "profile summary"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "expectedSalary",
        label: "Expected Salary",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "expected ctc",
          "desired pay"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "noticePeriod",
        label: "Notice Period",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "days to join"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "portfolio",
        label: "Portfolio Link",
        type: "url",
        aiAliases: [
          "work samples"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "resumeFile",
        label: "Resume Link",
        type: "url",
        aiAliases: [
          "cv link"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "work_experience",
    title: "Work Experience",
    icon: "🏢",
    isArray: true,
    fields: [
      {
        key: "jobTitle",
        label: "Job Title",
        type: "text",
        aiAliases: [
          "designation",
          "position"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "company",
        label: "Company Name",
        type: "text",
        aiAliases: [
          "employer",
          "organization"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "location",
        label: "Location",
        type: "text",
        aiAliases: [
          "city",
          "job location"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "text",
        aiAliases: [
          "from date",
          "joined on"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "endDate",
        label: "End Date",
        type: "text",
        aiAliases: [
          "to date",
          "left on"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        aiAliases: [
          "job description",
          "responsibilities summary"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "education_history",
    title: "Education History",
    icon: "🎓",
    isArray: true,
    fields: [
      {
        key: "degree",
        label: "Degree",
        type: "text",
        aiAliases: [
          "qualification",
          "course"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "fieldOfStudy",
        label: "Field of Study",
        type: "text",
        aiAliases: [
          "stream",
          "discipline",
          "major"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "university",
        label: "University / College",
        type: "text",
        aiAliases: [
          "institution",
          "school"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "text",
        aiAliases: [
          "from",
          "enrolled on"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "endDate",
        label: "End Date / Graduation",
        type: "text",
        aiAliases: [
          "to",
          "graduated on"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "percentage",
        label: "Percentage / CGPA",
        type: "text",
        aiAliases: [
          "%",
          "grade",
          "score"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "identity_documents",
    title: "Identity Documents",
    icon: "🪪",
    isArray: false,
    fields: [
      {
        key: "passportNumber",
        label: "Passport Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "passport no"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "panNumber",
        label: "PAN Card Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "pan no",
          "permanent account number"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "aadhaarNumber",
        label: "Aadhaar Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "uidai"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "drivingLicenseNumber",
        label: "Driving License Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "dl number"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "socialSecurityNumber",
        label: "Social Security Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "ssn"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "banking_details",
    title: "Banking Details",
    icon: "🏦",
    isArray: false,
    fields: [
      {
        key: "bankName",
        label: "Bank Name",
        type: "text",
        aiAliases: [
          "financial institution"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "accountHolderName",
        label: "Account Holder Name",
        type: "text",
        autofillPriority: "HIGH",
        aiAliases: [
          "name on account"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "accountNumber",
        label: "Account Number",
        type: "text",
        sensitive: true,
        encrypted: true,
        autofillPriority: "HIGH",
        aiAliases: [
          "bank account no"
        ],
        required: false,
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "routingNumber",
        label: "Routing Number / IFSC",
        type: "text",
        sensitive: true,
        encrypted: true,
        aiAliases: [
          "ifsc",
          "sort code"
        ],
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "skills",
    title: "Skills",
    icon: "⚡",
    isArray: true,
    fields: [
      {
        key: "skillName",
        label: "Skill Name",
        type: "text",
        aiAliases: [
          "skill",
          "technology"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "proficiency",
        label: "Proficiency",
        type: "select",
        options: [
          "Beginner",
          "Intermediate",
          "Advanced",
          "Expert"
        ],
        aiAliases: [
          "level"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "yearsOfExperience",
        label: "Years of Experience",
        type: "number",
        aiAliases: [
          "experience in skill"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "projects",
    title: "Projects",
    icon: "🚀",
    isArray: true,
    fields: [
      {
        key: "projectName",
        label: "Project Name",
        type: "text",
        aiAliases: [
          "title"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "role",
        label: "Role",
        type: "text",
        aiAliases: [
          "contribution"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "description",
        label: "Project Description",
        type: "textarea",
        aiAliases: [
          "details"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "link",
        label: "Project URL",
        type: "url",
        aiAliases: [
          "github",
          "live demo"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  },
  {
    id: "custom_fields",
    title: "Custom Fields",
    icon: "✨",
    isArray: true,
    fields: [
      {
        key: "fieldName",
        label: "Field Name",
        type: "text",
        aiAliases: [
          "key"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      },
      {
        key: "fieldValue",
        label: "Field Value",
        type: "textarea",
        aiAliases: [
          "value"
        ],
        sensitive: false,
        encrypted: false,
        required: false,
        autofillPriority: "MEDIUM",
        helpText: "",
        defaultValue: "",
        validation: ""
      }
    ]
  }
];

/** Message types for background script communication */
export const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_DEVICE_ID: 'GET_DEVICE_ID',
  FETCH_SUGGESTIONS: 'FETCH_SUGGESTIONS',
  SAVE_SUBMISSION: 'SAVE_SUBMISSION',
  RECORD_CORRECTION: 'RECORD_CORRECTION',
  GET_PROFILE: 'GET_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  GET_TOKEN: 'GET_TOKEN',
  ASK_AI_ASSISTANT: 'ASK_AI_ASSISTANT',
};

/** Merges user's DB schemas with DEFAULT_SCHEMA_DEFINITIONS to ensure all new default categories/fields appear */
export function mergeSchemaDefinitions(dbSchemas) {
  if (!dbSchemas || dbSchemas.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_SCHEMA_DEFINITIONS));
  }
  const merged = JSON.parse(JSON.stringify(dbSchemas));
  DEFAULT_SCHEMA_DEFINITIONS.forEach(defSec => {
    const exSec = merged.find(s => s.id === defSec.id);
    if (!exSec) {
      merged.push(JSON.parse(JSON.stringify(defSec)));
    } else {
      const exFields = new Set((exSec.fields || []).map(f => f.key));
      const mergedFields = [...(exSec.fields || [])];
      (defSec.fields || []).forEach(defF => {
        if (!exFields.has(defF.key)) {
          mergedFields.push(JSON.parse(JSON.stringify(defF)));
        }
      });
      exSec.fields = mergedFields;
    }
  });
  return merged;
}
