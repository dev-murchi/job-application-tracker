const { describe, beforeEach, it, expect } = require('@jest/globals');

// Mock bcrypt to control behavior and avoid CPU work
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS } = require('../../../shared/constants');
const {
  createBcryptCryptoService,
} = require('../../../adapters/infrastructure/crypto/bcrypt-crypto.service');

describe('hasher service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes hash and compare functions', () => {
    const hasher = createBcryptCryptoService();
    expect(typeof hasher.hash).toBe('function');
    expect(typeof hasher.compare).toBe('function');
  });

  it('hash calls genSalt with configured rounds and returns hashed value', async () => {
    bcrypt.genSalt.mockResolvedValue('salt-123');
    bcrypt.hash.mockResolvedValue('hashed-xyz');

    const hasher = createBcryptCryptoService();
    const result = await hasher.hash('plain-password');

    expect(bcrypt.genSalt).toHaveBeenCalledWith(BCRYPT_SALT_ROUNDS);
    expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 'salt-123');
    expect(result).toBe('hashed-xyz');
  });

  it('compare returns boolean result from bcrypt.compare', async () => {
    bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const hasher = createBcryptCryptoService();
    const match = await hasher.compare('plain', 'hashed');
    expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
    expect(match).toBe(true);

    const noMatch = await hasher.compare('x', 'y');
    expect(noMatch).toBe(false);
  });

  it('propagates errors from genSalt', async () => {
    const err = new Error('gen failure');
    bcrypt.genSalt.mockRejectedValue(err);

    const hasher = createBcryptCryptoService();
    await expect(hasher.hash('p')).rejects.toThrow(err);
  });

  it('propagates errors from bcrypt.hash', async () => {
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockRejectedValue(new Error('hash failure'));

    const hasher = createBcryptCryptoService();
    await expect(hasher.hash('p')).rejects.toThrow('hash failure');
  });

  it('propagates errors from bcrypt.compare', async () => {
    bcrypt.compare.mockRejectedValue(new Error('compare failure'));

    const hasher = createBcryptCryptoService();
    await expect(hasher.compare('a', 'b')).rejects.toThrow('compare failure');
  });
});
