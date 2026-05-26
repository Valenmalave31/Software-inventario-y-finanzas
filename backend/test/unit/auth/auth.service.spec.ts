/// <reference types="jest" />

import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/auth/auth.service';
import { MailService } from '../../../src/auth/mail.service';
import { AttemptsService } from '../../../src/auth/attempts.service';
import { Usuario } from '../../../src/auth/entities/usuario.entity';
import { Sesion } from '../../../src/auth/entities/sesion.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService (unit)', () => {
  let service: AuthService;
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  const usuarioRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const sesionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mailService = {
    sendPasswordReset: jest.fn(),
  };

  const attemptsService = {
    recordFailure: jest.fn(),
    isBlocked: jest.fn(),
    getRemainingSeconds: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: getRepositoryToken(Sesion), useValue: sesionRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: AttemptsService, useValue: attemptsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('register returns message when email already exists', async () => {
    usuarioRepo.findOne.mockResolvedValue({ id: 1, correo: 'test@mail.com' });

    const result = await service.register({
      name: 'Test',
      lastName: 'User',
      email: 'test@mail.com',
      password: 'password123',
    } as any);

    expect(result).toEqual({ mensaje: 'El correo ya está registrado' });
    expect(usuarioRepo.create).not.toHaveBeenCalled();
  });

  it('register hashes password and saves user', async () => {
    usuarioRepo.findOne.mockResolvedValue(null);
    usuarioRepo.create.mockImplementation((payload: any) => payload);
    usuarioRepo.save.mockResolvedValue({ id: 10 });
    bcryptMock.hash.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      name: 'Ana',
      lastName: 'Lopez',
      email: 'ana@mail.com',
      password: 'secret',
    } as any);

    expect(usuarioRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Ana',
        apellido: 'Lopez',
        correo: 'ana@mail.com',
        contrasena: 'hashed-password',
      }),
    );
    expect(usuarioRepo.save).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ mensaje: 'Usuario registrado exitosamente' }),
    );
  });

  it('login throws UnauthorizedException for invalid credentials', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue(null);

    await expect(
      service.login({ email: 'bad@mail.com', password: 'badpass' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('forgotPassword returns message when user does not exist', async () => {
    usuarioRepo.findOne.mockResolvedValue(null);

    const result = await service.forgotPassword({ email: 'no@mail.com' } as any);

    expect(result).toEqual({ mensaje: 'Correo no registrado' });
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('forgotPassword signs token and sends email', async () => {
    usuarioRepo.findOne.mockResolvedValue({ id: 5, correo: 'ok@mail.com' });
    jwtService.sign.mockReturnValue('token-123');

    const result = await service.forgotPassword({ email: 'ok@mail.com' } as any);

    expect(jwtService.sign).toHaveBeenCalled();
    expect(mailService.sendPasswordReset).toHaveBeenCalledWith('ok@mail.com', 'token-123');
    expect(result).toEqual({ mensaje: 'Correo enviado con instrucciones' });
  });

  it('changePassword records failure and throws UnauthorizedException when old password is invalid', async () => {
    usuarioRepo.findOne.mockResolvedValue({ id: 7, contrasena: 'stored-hash' });
    bcryptMock.compare.mockResolvedValue(false as never);
    attemptsService.isBlocked.mockReturnValue(false);

    await expect(
      service.changePassword(
        {
          oldPassword: 'wrong',
          newPassword: 'new-pass-123',
          confirmPassword: 'new-pass-123',
        } as any,
        7,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(attemptsService.recordFailure).toHaveBeenCalledWith('7');
  });

  it('changePassword throws 429 when account becomes blocked', async () => {
    usuarioRepo.findOne.mockResolvedValue({ id: 8, contrasena: 'stored-hash' });
    bcryptMock.compare.mockResolvedValue(false as never);
    attemptsService.isBlocked.mockReturnValue(true);
    attemptsService.getRemainingSeconds.mockReturnValue(60);

    await expect(
      service.changePassword(
        {
          oldPassword: 'wrong',
          newPassword: 'new-pass-123',
          confirmPassword: 'new-pass-123',
        } as any,
        8,
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    } as Partial<HttpException>);
  });

  it('closeSession returns graceful message when session does not exist', async () => {
    sesionRepo.delete.mockResolvedValue({ affected: 0 });

    const result = await service.closeSession('token-x');

    expect(result).toEqual({ mensaje: 'La sesión no existía o ya había sido cerrada' });
  });
});
