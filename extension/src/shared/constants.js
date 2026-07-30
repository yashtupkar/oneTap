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
    id: 'personal_info',
    title: 'Personal Information',
    icon: '👤',
    isArray: false,
    fields: [
      { key: 'firstName', label: 'First Name', type: 'text' },
      { key: 'middleName', label: 'Middle Name', type: 'text' },
      { key: 'lastName', label: 'Last Name', type: 'text' },
      { key: 'fullName', label: 'Full Name', type: 'text' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'text' },
      { key: 'nationality', label: 'Nationality', type: 'text' },
    ],
  },
  {
    id: 'contact_details',
    title: 'Contact Details',
    icon: '📞',
    isArray: false,
    fields: [
      { key: 'email', label: 'Email Address', type: 'email' },
      { key: 'phone', label: 'Phone Number', type: 'tel' },
      { key: 'alternatePhone', label: 'Alternate Phone', type: 'tel' },
      { key: 'linkedIn', label: 'LinkedIn URL', type: 'url' },
      { key: 'website', label: 'Portfolio Website', type: 'url' },
      { key: 'github', label: 'GitHub URL', type: 'url' },
    ],
  },
  {
    id: 'addresses',
    title: 'Addresses',
    icon: '🏠',
    isArray: true,
    fields: [
      { key: 'addressType', label: 'Address Type', type: 'select', options: ['Permanent', 'Temporary', 'Current', 'Office', 'Other'] },
      { key: 'addressLine1', label: 'Address Line 1', type: 'text' },
      { key: 'addressLine2', label: 'Address Line 2', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State / Province', type: 'text' },
      { key: 'postalCode', label: 'Postal / ZIP Code', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
    ],
  },
  {
    id: 'professional_info',
    title: 'Professional Info',
    icon: '💼',
    isArray: false,
    fields: [
      { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
      { key: 'skills', label: 'Skills (comma-separated)', type: 'text' },
      { key: 'summary', label: 'Professional Summary', type: 'textarea' },
      { key: 'expectedSalary', label: 'Expected Salary', type: 'text', sensitive: true },
      { key: 'noticePeriod', label: 'Notice Period', type: 'text' },
    ],
  },
  {
    id: 'work_experience',
    title: 'Work Experience',
    icon: '🏢',
    isArray: true,
    fields: [
      { key: 'jobTitle', label: 'Job Title', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'startDate', label: 'Start Date (Month/Year)', type: 'text' },
      { key: 'endDate', label: 'End Date', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'skillsUsed', label: 'Skills Used', type: 'text' },
    ],
  },
  {
    id: 'education_history',
    title: 'Education History',
    icon: '🎓',
    isArray: true,
    fields: [
      { key: 'degree', label: 'Degree', type: 'text' },
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'text' },
      { key: 'university', label: 'University / College', type: 'text' },
      { key: 'startDate', label: 'Start Date', type: 'text' },
      { key: 'endDate', label: 'End Date / Graduation', type: 'text' },
      { key: 'marks', label: 'Marks / CGPA', type: 'text' },
    ],
  },
  {
    id: 'identity_documents',
    title: 'Identity Documents',
    icon: '🪪',
    isArray: false,
    fields: [
      { key: 'passportNumber', label: 'Passport Number', type: 'text', sensitive: true },
      { key: 'panNumber', label: 'PAN Card Number', type: 'text', sensitive: true },
      { key: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', sensitive: true },
      { key: 'drivingLicenseNumber', label: 'Driving License Number', type: 'text', sensitive: true },
    ],
  },
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
