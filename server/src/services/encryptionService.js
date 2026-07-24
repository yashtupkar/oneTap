const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY || '0'.repeat(64);
const KEY = Buffer.from(KEY_HEX, 'hex');

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a JSON string containing iv, authTag, and ciphertext (all hex).
 *
 * @param {string} plaintext
 * @returns {string} Encrypted JSON payload
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  });
}

/**
 * Decrypts an AES-256-GCM encrypted payload produced by encrypt().
 *
 * @param {string} encryptedPayload - JSON string from encrypt()
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedPayload) {
  if (!encryptedPayload) return encryptedPayload;
  try {
    const { iv, authTag, data } = JSON.parse(encryptedPayload);
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    // Return raw value if decryption fails (e.g. plain text stored before encryption)
    return encryptedPayload;
  }
}

/** Fields in UserProfile that should be encrypted at rest */
const SENSITIVE_FIELDS = [
  'passportNumber',
  'panNumber',
  'aadhaarNumber',
  'drivingLicenseNumber',
];

/**
 * Encrypts all sensitive fields in a profile object before saving to DB.
 * @param {object} profileData
 * @returns {object} Profile with sensitive fields encrypted
 */
function encryptProfileSensitiveFields(profileData) {
  const result = { ...profileData };
  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypts all sensitive fields in a profile object after reading from DB.
 * @param {object} profileData
 * @returns {object} Profile with sensitive fields decrypted
 */
function decryptProfileSensitiveFields(profileData) {
  if (!profileData) return profileData;
  const result = profileData.toObject ? profileData.toObject({ flattenMaps: true }) : { ...profileData };
  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

module.exports = {
  encrypt,
  decrypt,
  encryptProfileSensitiveFields,
  decryptProfileSensitiveFields,
  SENSITIVE_FIELDS,
};
