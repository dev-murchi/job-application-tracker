const {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} = require('@jest/globals');
jest.mock('../../config/index.js');

const config = require('../../config');
const attachCookie = require('../../utils/attach-cookie');

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

  it('should set secure flag to false in test environment', () => {
    const token = 'test-jwt-token';
    config.isProduction = false;

    attachCookie({ res: mockRes, token });

    expect(mockRes.cookie).toHaveBeenCalledWith('token', token, {
      httpOnly: true,
      expires: expect.any(Date),
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('should set secure flag to true in prod environment', () => {
    config.isProduction = true;
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
