const { describe, beforeEach, it, expect } = require('@jest/globals');
const jwt = require('jsonwebtoken');
const { createJwtService } = require('../../services/jwt.service');

jest.mock('jsonwebtoken');

describe('JWT Service', () => {
  let jwtService;
  const testSecret = 'test-secret-key-for-testing';
  const testExpiresIn = '1h';

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = createJwtService({
      secret: testSecret,
      expiresIn: testExpiresIn,
    });
  });

  describe('createJwtService', () => {
    it('should create a jwtService with sign and verify methods', () => {
      expect(jwtService).toHaveProperty('sign');
      expect(jwtService).toHaveProperty('verify');
      expect(typeof jwtService.sign).toBe('function');
      expect(typeof jwtService.verify).toBe('function');
    });
  });

  describe('sign', () => {
    it('should call jwt.sign with correct arguments', () => {
      const payload = { userId: 'user123' };
      jwt.sign.mockReturnValue('mocked-token');

      const token = jwtService.sign(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, testSecret, { expiresIn: testExpiresIn });
      expect(token).toBe('mocked-token');
    });

    it('should pass different payloads to jwt.sign', () => {
      jwt.sign.mockReturnValueOnce('token1').mockReturnValueOnce('token2');

      const token1 = jwtService.sign({ userId: 'user1' });
      const token2 = jwtService.sign({ userId: 'user2' });

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenNthCalledWith(1, { userId: 'user1' }, testSecret, {
        expiresIn: testExpiresIn,
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(2, { userId: 'user2' }, testSecret, {
        expiresIn: testExpiresIn,
      });
      expect(token1).toBe('token1');
      expect(token2).toBe('token2');
    });

    it('should use the configured secret and expiresIn', () => {
      const customService = createJwtService({
        secret: 'custom-secret',
        expiresIn: '30d',
      });
      jwt.sign.mockReturnValue('custom-token');

      customService.sign({ userId: 'user123' });

      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'user123' }, 'custom-secret', {
        expiresIn: '30d',
      });
    });
  });

  describe('verify', () => {
    it('should call jwt.verify with correct arguments', () => {
      const token = 'valid-token';
      const decodedPayload = { userId: 'user123', iat: 1234567890, exp: 1234571490 };
      jwt.verify.mockReturnValue(decodedPayload);

      const result = jwtService.verify(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, testSecret);
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error when jwt.verify throws for invalid token', () => {
      const invalidToken = 'invalid-token';
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => jwtService.verify(invalidToken)).toThrow('jwt malformed');
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, testSecret);
    });

    it('should throw error when jwt.verify throws for expired token', () => {
      const expiredToken = 'expired-token';
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => jwtService.verify(expiredToken)).toThrow('jwt expired');
    });

    it('should throw error when jwt.verify throws for invalid signature', () => {
      const tamperedToken = 'tampered-token';
      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => jwtService.verify(tamperedToken)).toThrow('invalid signature');
    });
  });

  describe('service isolation', () => {
    it('should create isolated services with different configurations', () => {
      const service1 = createJwtService({ secret: 'secret1', expiresIn: '1h' });
      const service2 = createJwtService({ secret: 'secret2', expiresIn: '2h' });

      jwt.sign.mockReturnValueOnce('token1').mockReturnValueOnce('token2');

      service1.sign({ userId: 'user1' });
      service2.sign({ userId: 'user2' });

      expect(jwt.sign).toHaveBeenNthCalledWith(1, { userId: 'user1' }, 'secret1', {
        expiresIn: '1h',
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(2, { userId: 'user2' }, 'secret2', {
        expiresIn: '2h',
      });
    });

    it('should verify tokens with respective secrets', () => {
      const service1 = createJwtService({ secret: 'secret1', expiresIn: '1h' });
      const service2 = createJwtService({ secret: 'secret2', expiresIn: '2h' });

      jwt.verify.mockReturnValue({ userId: 'user1' });

      service1.verify('token1');
      service2.verify('token2');

      expect(jwt.verify).toHaveBeenNthCalledWith(1, 'token1', 'secret1');
      expect(jwt.verify).toHaveBeenNthCalledWith(2, 'token2', 'secret2');
    });
  });
});
