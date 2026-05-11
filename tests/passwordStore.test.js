const mockPasswordService = {
  deletePassword: jest.fn(),
  listPasswords: jest.fn(),
};

const mockPasswordSyncService = {
  syncPasswordWithBackend: jest.fn(),
};

const mockStorageData = new Map();
const mockAsyncStorage = {
  getItem: jest.fn(async key => (mockStorageData.has(key) ? mockStorageData.get(key) : null)),
  removeItem: jest.fn(async (key) => {
    mockStorageData.delete(key);
  }),
  setItem: jest.fn(async (key, value) => {
    mockStorageData.set(key, value);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));
jest.mock('../src/services/passwordService', () => mockPasswordService);
jest.mock('../src/services/passwordSyncService', () => mockPasswordSyncService);

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

async function loadPasswordStoreModule() {
  let passwordStoreModule;

  jest.isolateModules(() => {
    passwordStoreModule = require('../src/stores/passwordStore');
  });

  await passwordStoreModule.usePasswordStore.persist.rehydrate();
  await flushPromises();
  return passwordStoreModule;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStorageData.clear();
});

test('saves passwords offline and syncs them when the connection comes back', async () => {
  const { usePasswordStore } = await loadPasswordStoreModule();

  usePasswordStore.getState().setOnlineStatus(false);

  const savedItem = usePasswordStore.getState().addPassword({
    appName: 'GitHub',
    pending: true,
    value: 'abc123',
  });

  expect(savedItem.pending).toBe(true);
  expect(usePasswordStore.getState().passwords[0]).toMatchObject({
    appName: 'GitHub',
    pending: true,
    remoteId: null,
  });

  usePasswordStore.getState().setOnlineStatus(true);
  mockPasswordSyncService.syncPasswordWithBackend.mockResolvedValue({
    data: {
      password: {
        id: 'remote-1',
      },
    },
  });

  await usePasswordStore.getState().syncPendingPasswords('jwt-token');

  expect(mockPasswordSyncService.syncPasswordWithBackend).toHaveBeenCalledWith(
    expect.objectContaining({
      appName: 'GitHub',
      password: 'abc123',
    }),
    'jwt-token',
  );
  expect(usePasswordStore.getState().passwords[0]).toMatchObject({
    pending: false,
    remoteId: 'remote-1',
  });
  expect(usePasswordStore.getState().isSyncing).toBe(false);
});

test('preserves remote identifiers when a password is already saved online', async () => {
  const { usePasswordStore } = await loadPasswordStoreModule();

  const savedItem = usePasswordStore.getState().addPassword({
    appName: 'Bank',
    createdAt: '2026-05-10T10:00:00.000Z',
    pending: false,
    remoteId: 'remote-42',
    value: 'secure-pass',
  });

  expect(savedItem.remoteId).toBe('remote-42');
  expect(usePasswordStore.getState().passwords[0]).toMatchObject({
    pending: false,
    remoteId: 'remote-42',
  });
});

test('deletes local passwords offline and blocks remote deletion while offline', async () => {
  const { usePasswordStore } = await loadPasswordStoreModule();

  const localItem = usePasswordStore.getState().addPassword({
    appName: 'Docs',
    pending: true,
    value: 'local-pass',
  });
  const remoteItem = usePasswordStore.getState().addPassword({
    appName: 'Email',
    pending: false,
    remoteId: 'remote-99',
    value: 'remote-pass',
  });

  usePasswordStore.getState().setOnlineStatus(false);

  const blockedRemoteDelete = await usePasswordStore.getState().deletePasswordItem(remoteItem, 'jwt-token');

  expect(blockedRemoteDelete).toBe(false);
  expect(usePasswordStore.getState().passwords).toHaveLength(2);

  const localDelete = await usePasswordStore.getState().deletePasswordItem(localItem, null);

  expect(localDelete).toBe(true);
  expect(usePasswordStore.getState().passwords).toHaveLength(1);
  expect(usePasswordStore.getState().passwords[0].appName).toBe('Email');
  expect(mockPasswordService.deletePassword).not.toHaveBeenCalled();
});

test('deletes remote passwords when online', async () => {
  const { usePasswordStore } = await loadPasswordStoreModule();

  const remoteItem = usePasswordStore.getState().addPassword({
    appName: 'Email',
    pending: false,
    remoteId: 'remote-77',
    value: 'remote-pass',
  });

  usePasswordStore.getState().setOnlineStatus(true);
  mockPasswordService.deletePassword.mockResolvedValue({ message: 'ok' });

  const deleted = await usePasswordStore.getState().deletePasswordItem(remoteItem, 'jwt-token');

  expect(deleted).toBe(true);
  expect(mockPasswordService.deletePassword).toHaveBeenCalledWith('jwt-token', 'remote-77');
  expect(usePasswordStore.getState().passwords).toHaveLength(0);
});
