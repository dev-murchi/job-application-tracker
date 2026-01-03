const { describe, beforeEach, afterEach, it, expect } = require('@jest/globals');

const { attachCookie } = require('../../utils');

describe('attachCookie', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set secure flag to false when secure param is false', () => {
    const token = 'test-jwt-token';

    attachCookie({ res: mockRes, token, secure: false });

    expect(mockRes.cookie).toHaveBeenCalledWith('token', token, {
      httpOnly: true,
      expires: expect.any(Date),
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('should set secure flag to true when secure param is true', () => {
    const token = 'test-jwt-token';

    attachCookie({ res: mockRes, token, secure: true });

    expect(mockRes.cookie).toHaveBeenCalledWith('token', token, {
      httpOnly: true,
      expires: expect.any(Date),
      path: '/',
      sameSite: 'strict',
      secure: true,
    });
  });

  it('should default secure to true when not provided', () => {
    const token = 'test-jwt-token';

    attachCookie({ res: mockRes, token });

    expect(mockRes.cookie).toHaveBeenCalledWith('token', token, {
      httpOnly: true,
      expires: expect.any(Date),
      path: '/',
      sameSite: 'strict',
      secure: true,
    });
  });
});
