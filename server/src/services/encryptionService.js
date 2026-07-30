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

/**
 * Encrypts all sensitive fields in a profile object before saving to DB.
 * Uses the dynamic schemaDefinitions to find which fields are sensitive.
 * @param {object} reqBody - Needs to have schemaDefinitions and profileData
 * @returns {object} Profile object with sensitive fields encrypted
 */
function encryptProfileSensitiveFields(reqBody) {
  const schema = reqBody.schemaDefinitions || [];
  let data = reqBody.profileData ? { ...reqBody.profileData } : {};
  
  schema.forEach(section => {
     if (section.isArray) {
        if (Array.isArray(data[section.id])) {
           data[section.id] = data[section.id].map(item => {
              let newItem = {...item};
              (section.fields || []).forEach(f => {
                 if (f.sensitive && newItem[f.key]) {
                    newItem[f.key] = encrypt(newItem[f.key]);
                 }
              });
              return newItem;
           });
        }
     } else {
        if (data[section.id]) {
           let newObj = {...data[section.id]};
           (section.fields || []).forEach(f => {
              if (f.sensitive && newObj[f.key]) {
                 newObj[f.key] = encrypt(newObj[f.key]);
              }
           });
           data[section.id] = newObj;
        }
     }
  });
  
  return { ...reqBody, profileData: data };
}

/**
 * Decrypts all sensitive fields in a profile object after reading from DB.
 * @param {object} profileDoc - Profile document from DB
 * @returns {object} Profile with sensitive fields decrypted
 */
function decryptProfileSensitiveFields(profileDoc) {
  if (!profileDoc) return profileDoc;
  
  const result = profileDoc.toObject ? profileDoc.toObject({ flattenMaps: true }) : { ...profileDoc };
  const schema = result.schemaDefinitions || [];
  let data = result.profileData ? { ...result.profileData } : {};

  schema.forEach(section => {
     if (section.isArray) {
        if (Array.isArray(data[section.id])) {
           data[section.id] = data[section.id].map(item => {
              let newItem = {...item};
              (section.fields || []).forEach(f => {
                 if (f.sensitive && newItem[f.key]) {
                    newItem[f.key] = decrypt(newItem[f.key]);
                 }
              });
              return newItem;
           });
        }
     } else {
        if (data[section.id]) {
           let newObj = {...data[section.id]};
           (section.fields || []).forEach(f => {
              if (f.sensitive && newObj[f.key]) {
                 newObj[f.key] = decrypt(newObj[f.key]);
              }
           });
           data[section.id] = newObj;
        }
     }
  });

  result.profileData = data;
  return result;
}

module.exports = {
  encrypt,
  decrypt,
  encryptProfileSensitiveFields,
  decryptProfileSensitiveFields,
};
