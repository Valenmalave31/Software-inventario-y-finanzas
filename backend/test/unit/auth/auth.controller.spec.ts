/// <reference types="jest" />

import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { AttemptsService } from '../../../src/auth/attempts.service';
import { AuditService } from '../../../src/common/audit.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    createSessionForUser: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    changePassword: jest.fn(),
    closeSession: jest.fn(),
  };

  const attemptsService = {
    isBlocked: jest.fn(),
    getRemainingSeconds: jest.fn(),
    recordFailure: jest.fn(),
    reset: jest.fn(),
  };

  const auditService = {
    logRegister: jest.fn(),
    logLoginBlocked: jest.fn(),
    logLoginFailure: jest.fn(),
    logLoginSuccess: jest.fn(),
    logForgotPassword: jest.fn(),
    logPasswordChangeBlocked: jest.fn(),
    logPasswordChangeFailure: jest.fn(),
    logPasswordChangeSuccess: jest.fn(),
    logLogout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AttemptsService, useValue: attemptsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register should call audit and auth service', async () => {
    const dto = {
      name: 'Test',
      lastName: 'User',
      email: 'test@mail.com',
      password: 'password123',
    };

    const req: any = {
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    authService.register.mockResolvedValue({ mensaje: 'Usuario registrado exitosamente' });

    const result = await controller.register(dto as any, req);

    expect(auditService.logRegister).toHaveBeenCalledWith('test@mail.com', '127.0.0.1', 'jest-agent');
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ mensaje: 'Usuario registrado exitosamente' });
  });

  it('login should throw 429 when attempts are blocked', async () => {
    attemptsService.isBlocked.mockReturnValue(true);
    attemptsService.getRemainingSeconds.mockReturnValue(30);

    const req: any = {
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await expect(controller.login({ email: 'test@mail.com', password: 'x' }, req)).rejects.toBeInstanceOf(HttpException);

    expect(auditService.logLoginBlocked).toHaveBeenCalled();
  });

  it('login should throw UnauthorizedException when credentials are invalid', async () => {
    attemptsService.isBlocked.mockReturnValue(false);
    authService.validateUser.mockResolvedValue(null);

    const req: any = {
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await expect(controller.login({ email: 'test@mail.com', password: 'bad' }, req)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(attemptsService.recordFailure).toHaveBeenCalled();
    expect(auditService.logLoginFailure).toHaveBeenCalled();
  });

  it('login should return session when credentials are valid', async () => {
    const user = { id: 1, correo: 'test@mail.com' };

    attemptsService.isBlocked.mockReturnValue(false);
    authService.validateUser.mockResolvedValue(user);
    authService.createSessionForUser.mockResolvedValue({ token: 'token-123', usuario: user });

    const req: any = {
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    const result = await controller.login({ email: 'test@mail.com', password: 'ok' }, req);

    expect(attemptsService.reset).toHaveBeenCalledWith('test@mail.com');
    expect(auditService.logLoginSuccess).toHaveBeenCalled();
    expect(authService.createSessionForUser).toHaveBeenCalledWith(user);
    expect(result).toEqual({ token: 'token-123', usuario: user });
  });

  it('forgotPassword should call audit and auth service', async () => {
    const dto = { email: 'user@mail.com' };

    const req: any = {
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    authService.forgotPassword.mockResolvedValue({ mensaje: 'Correo enviado con instrucciones' });

    const result = await controller.forgotPassword(dto, req);

    expect(auditService.logForgotPassword).toHaveBeenCalled();
    expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ mensaje: 'Correo enviado con instrucciones' });
  });

  it('changePassword should throw 429 when attempts are blocked', async () => {
    attemptsService.isBlocked.mockReturnValue(true);
    attemptsService.getRemainingSeconds.mockReturnValue(40);

    const req: any = {
      user: { id: 1, correo: 'user@mail.com' },
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await expect(
      controller.changePassword(
        {
          oldPassword: 'old',
          newPassword: 'new-password-123',
          confirmPassword: 'new-password-123',
        },
        req,
      ),
    ).rejects.toBeInstanceOf(HttpException);

    expect(auditService.logPasswordChangeBlocked).toHaveBeenCalled();
  });

  it('changePassword should log success on successful change', async () => {
    attemptsService.isBlocked.mockReturnValue(false);
    authService.changePassword.mockResolvedValue({ mensaje: 'Contraseña cambiada exitosamente' });

    const req: any = {
      user: { id: 1, correo: 'user@mail.com' },
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    const result = await controller.changePassword(
      {
        oldPassword: 'old',
        newPassword: 'new-password-123',
        confirmPassword: 'new-password-123',
      },
      req,
    );

    expect(auditService.logPasswordChangeSuccess).toHaveBeenCalled();
    expect(result).toEqual({ mensaje: 'Contraseña cambiada exitosamente' });
  });

  it('changePassword should log blocked when service throws 429', async () => {
    attemptsService.isBlocked.mockReturnValue(false);

    const tooMany = new HttpException(
      {
        message: 'Bloqueado',
        retryAfterSeconds: 60,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );

    authService.changePassword.mockRejectedValue(tooMany);
    const req: any = {
      user: { id: 1, correo: 'user@mail.com' },
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    await expect(
      controller.changePassword(
        {
          oldPassword: 'old',
          newPassword: 'new-password-123',
          confirmPassword: 'new-password-123',
        },
        req,
      ),
    ).rejects.toBeInstanceOf(HttpException);

    expect(auditService.logPasswordChangeBlocked).toHaveBeenCalled();
  });
});
