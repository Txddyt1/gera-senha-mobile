import * as Clipboard from 'expo-clipboard';

export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (err) {
    return false;
  }
}
