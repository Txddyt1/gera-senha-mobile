const mockAuthService = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  validateSession: jest.fn(),
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
jest.mock('../src/services/authService', () => mockAuthService);

function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

async function loadAuthStoreModule() {
  let authStoreModule;

  jest.isolateModules(() => {
    authStoreModule = require('../src/stores/authStore');
  });

  await authStoreModule.useAuthStore.persist.rehydrate();
  await flushPromises();
  return authStoreModule;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStorageData.clear();
});

test('restores a persisted session and validates it during bootstrap', async () => {
  mockAuthService.signIn.mockResolvedValue({
    token: 'valid-token',
    user: { email: 'ana@example.com', id: 1, name: 'Ana' },
  });

  let authStoreModule = await loadAuthStoreModule();
  let authStore = authStoreModule.useAuthStore;

  const signInResult = await authStore.getState().signIn({
    email: 'ana@example.com',
    password: '12345678',
  });

  await flushPromises();

  expect(signInResult).toEqual({ ok: true });
  expect(authStore.getState().authSession).toEqual({
    token: 'valid-token',
    user: { email: 'ana@example.com', id: 1, name: 'Ana' },
  });

  mockAuthService.validateSession.mockResolvedValue({
    user: { email: 'ana@example.com', id: 1, name: 'Ana Silva' },
  });

  authStoreModule = await loadAuthStoreModule();
  authStore = authStoreModule.useAuthStore;

  await authStore.getState().bootstrapAuth();

  expect(mockAuthService.validateSession).toHaveBeenCalledWith('valid-token');
  expect(authStore.getState().authSession).toEqual({
    token: 'valid-token',
    user: { email: 'ana@example.com', id: 1, name: 'Ana Silva' },
  });
  expect(authStore.getState().isBootstrapping).toBe(false);
});

test('clears the persisted session when the token is invalid', async () => {
  mockStorageData.set(
    '@demo/auth-session',
    JSON.stringify({
      state: {
        authSession: {
          token: 'expired-token',
          user: { email: 'ana@example.com', id: 1, name: 'Ana' },
        },
      },
      version: 0,
    }),
  );
  mockAuthService.validateSession.mockRejectedValue(new Error('Token JWT expirado.'));

  const { useAuthStore } = await loadAuthStoreModule();

  await useAuthStore.getState().bootstrapAuth();

  expect(useAuthStore.getState().authSession).toBeNull();
  expect(useAuthStore.getState().isBootstrapping).toBe(false);
});

test('keeps the persisted session when validation fails because of network issues', async () => {
  mockStorageData.set(
    '@demo/auth-session',
    JSON.stringify({
      state: {
        authSession: {
          token: 'cached-token',
          user: { email: 'ana@example.com', id: 1, name: 'Ana' },
        },
      },
      version: 0,
    }),
  );
  mockAuthService.validateSession.mockRejectedValue(new Error('Network Error'));

  const { useAuthStore } = await loadAuthStoreModule();

  await useAuthStore.getState().bootstrapAuth();

  expect(useAuthStore.getState().authSession).toEqual({
    token: 'cached-token',
    user: { email: 'ana@example.com', id: 1, name: 'Ana' },
  });
  expect(useAuthStore.getState().isBootstrapping).toBe(false);
});
