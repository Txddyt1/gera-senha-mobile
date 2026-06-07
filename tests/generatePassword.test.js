const generatePassword = require('../src/utils/generatePassword').default;

describe('generatePassword', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('retorna uma string com o tamanho solicitado quando o comprimento e pelo menos oito', () => {
    const password = generatePassword(12);

    expect(password).toHaveLength(12);
    expect(typeof password).toBe('string');
  });

  test('respeita o tamanho minimo de oito caracteres', () => {
    const password = generatePassword(4);

    expect(password).toHaveLength(8);
  });

  test('inclui letras maiusculas, minusculas e caracteres especiais', () => {
    const password = generatePassword(16);

    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
  });

  test('gera uma senha deterministica quando Math.random esta mockado', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const password = generatePassword(8);

    expect(password).toBe('a!AAAAAA');
  });
});
