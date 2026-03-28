import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_HISTORY_KEY = '@demo/password-history';

export async function loadSavedPasswords() {
  try {
    const storedValue = await AsyncStorage.getItem(PASSWORD_HISTORY_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

export async function saveSavedPasswords(passwords) {
  try {
    await AsyncStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify(passwords));
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearSavedPasswords() {
  try {
    await AsyncStorage.removeItem(PASSWORD_HISTORY_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
