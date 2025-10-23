const { describe, it, expect } = require('@jest/globals');

const checkPermissions = require('../../utils/check-permissions');
const { UnauthorizedError } = require('../../errors');

describe('checkPermissions', () => {
  it('should not throw error when user owns the resource', () => {
    const requestUser = { userId: 'user123' };
    const resourceUserId = 'user123';

    expect(() => checkPermissions(requestUser, resourceUserId)).not.toThrow();
  });

  it('should throw UnauthorizedError when user does not own the resource', () => {
    const requestUser = { userId: 'user123' };
    const resourceUserId = 'user456';

    expect(() => checkPermissions(requestUser, resourceUserId)).toThrow(
      UnauthorizedError
    );
    expect(() => checkPermissions(requestUser, resourceUserId)).toThrow(
      'Not authorized to access this route'
    );
  });

  it('should handle ObjectId comparison', () => {
    const requestUser = { userId: 'user123' };
    const resourceUserId = { toString: () => 'user123' }; // Mock ObjectId

    expect(() => checkPermissions(requestUser, resourceUserId)).not.toThrow();
  });

  it('should throw error when comparing different ObjectIds', () => {
    const requestUser = { userId: 'user123' };
    const resourceUserId = { toString: () => 'user456' }; // Mock ObjectId

    expect(() => checkPermissions(requestUser, resourceUserId)).toThrow(
      UnauthorizedError
    );
  });
});
