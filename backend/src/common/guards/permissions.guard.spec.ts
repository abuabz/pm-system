import { PermissionsGuard } from './permissions.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access if route is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access if no permissions are required', () => {
    // isPublic = false
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    // requiredPermissions = undefined
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(undefined);

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException if user has no role/permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['projects:create']);

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should allow access if user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['tasks:read', 'tasks:update']);

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: {
              permissions: [
                { permission: { resource: 'tasks', action: 'read' } },
                { permission: { resource: 'tasks', action: 'update' } },
                { permission: { resource: 'comments', action: 'create' } },
              ],
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing a required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(false);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(['projects:create']);

    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: {
              permissions: [
                { permission: { resource: 'tasks', action: 'read' } },
              ],
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
