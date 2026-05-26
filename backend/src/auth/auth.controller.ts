import { Controller, Post, Body, Req, UseGuards, Get, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AttemptsService } from './attempts.service';
import { AuditService } from '../common/audit.service';
import { getClientIp } from '../common/get-client-ip.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface JwtRequest extends Request {
  user: { sub: number; correo: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly attemptsService: AttemptsService,
    private readonly auditService: AuditService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto, @Req() req: any) {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    this.auditService.logRegister(dto.email, ip, userAgent);
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const emailKey = String(dto.email).toLowerCase();
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    if (this.attemptsService.isBlocked(emailKey)) {
      const remaining = this.attemptsService.getRemainingSeconds(emailKey);
      this.auditService.logLoginBlocked(dto.email, ip, userAgent, remaining);
      throw new HttpException(
        {
          message: `No se permiten más intentos hasta dentro de ${remaining} segundos.`,
          mensaje: `No se permiten más intentos hasta dentro de ${remaining} segundos.`,
          retryAfterSeconds: remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const usuario = await this.authService.validateUser(dto.email, dto.password);
    if (!usuario) {
      this.attemptsService.recordFailure(emailKey);
      this.auditService.logLoginFailure(dto.email, ip, userAgent, 'Invalid credentials');
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // successful login: reset attempts and create session
    this.attemptsService.reset(emailKey);
    this.auditService.logLoginSuccess(dto.email, usuario.id, ip, userAgent);
    return this.authService.createSessionForUser(usuario);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any) {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    this.auditService.logForgotPassword(dto.email, ip, userAgent);
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    const usuarioId = req.user.id || req.user.sub;
    const key = String(usuarioId);
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    if (this.attemptsService.isBlocked(key)) {
      const remaining = this.attemptsService.getRemainingSeconds(key);
      this.auditService.logPasswordChangeBlocked(usuarioId, req.user.correo, ip, userAgent, remaining);
      throw new HttpException(
        {
          message: `La cuenta está bloqueada por demasiados intentos. Intenta de nuevo en ${remaining} segundos.`,
          mensaje: `La cuenta está bloqueada por demasiados intentos. Intenta de nuevo en ${remaining} segundos.`,
          retryAfterSeconds: remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const result = await this.authService.changePassword(dto, usuarioId);
      this.auditService.logPasswordChangeSuccess(usuarioId, req.user.correo, ip, userAgent);
      return result;
    } catch (error: any) {
      if (error.status === HttpStatus.TOO_MANY_REQUESTS) {
        const remaining = error.getResponse().retryAfterSeconds;
        this.auditService.logPasswordChangeBlocked(usuarioId, req.user.correo, ip, userAgent, remaining);
        throw error;
      }
      this.auditService.logPasswordChangeFailure(usuarioId, req.user.correo, ip, userAgent, error.message);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('active-sessions')
  async getSessions(@Req() req: any) {
    return await this.authService.countActiveSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    const usuarioId = req.user.id || req.user.sub;
    return this.authService.closeAllSessions(usuarioId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    const usuarioId = req.user.id || req.user.sub;
    return await this.authService.findUserById(usuarioId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    this.auditService.logLogout(req.user.id || req.user.sub, req.user.correo, ip, userAgent);
    return this.authService.closeSession(token);
  }
}
