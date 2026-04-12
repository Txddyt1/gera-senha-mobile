const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Chave fixa apenas para demonstracao/aula. Em producao, use segredo fora do codigo.
const PASSWORD_ENCRYPTION_SECRET = 'demo-password-encryption-secret';
const PASSWORD_ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(PASSWORD_ENCRYPTION_SECRET)
  .digest();

function encryptPasswordValue(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, PASSWORD_ENCRYPTION_KEY, iv);
  const encryptedValue = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    authTag: authTag.toString('base64'),
    encryptedValue: encryptedValue.toString('base64'),
    iv: iv.toString('base64'),
  };
}

function decryptPasswordValue({ authTag, encryptedValue, iv }) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    PASSWORD_ENCRYPTION_KEY,
    Buffer.from(iv, 'base64'),
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = {
  decryptPasswordValue,
  encryptPasswordValue,
};
