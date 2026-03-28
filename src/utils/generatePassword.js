export default function generatePassword(length = 8) {
  const minLen = 8;
  if (length < minLen) length = minLen;

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const randChar = s => s.charAt(Math.floor(Math.random() * s.length));

  const required = [randChar(upper), randChar(lower), randChar(special)];

  const all = upper + lower + digits + special;
  const remainingCount = length - required.length;
  for (let i = 0; i < remainingCount; i++) {
    required.push(randChar(all));
  }

  // shuffle
  for (let i = required.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = required[i];
    required[i] = required[j];
    required[j] = tmp;
  }

  return required.join('');
}
