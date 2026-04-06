import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_HISTORY_KEY_PREFIX = '@demo/password-history';

function getPasswordHistoryKey(accountKey) {
  if (!accountKey) {
    return null;
  }

  return `${PASSWORD_HISTORY_KEY_PREFIX}/${accountKey}`;
}

export async function loadSavedPasswords(accountKey) {
  const storageKey = getPasswordHistoryKey(accountKey);

  if (!storageKey) {
    return [];
  }

  try {
    const storedValue = await AsyncStorage.getItem(storageKey);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

export async function saveSavedPasswords(accountKey, passwords) {
  const storageKey = getPasswordHistoryKey(accountKey);

  if (!storageKey) {
    return false;
  }

  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(passwords));
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearSavedPasswords(accountKey) {
  const storageKey = getPasswordHistoryKey(accountKey);

  if (!storageKey) {
    return false;
  }

  try {
    await AsyncStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    return false;
  }
}
