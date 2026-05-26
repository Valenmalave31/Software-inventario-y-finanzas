import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from './mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Sesion } from './entities/sesion.entity';
import { AttemptsService } from './attempts.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Sesion) 
    private sesionRepo: Repository<Sesion>, 
    private jwtService: JwtService,
    private mailService: MailService,
    private attemptsService: AttemptsService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const usuarioExistente = await this.usuarioRepo.findOne({ where: { correo: createUserDto.email } });
    if (usuarioExistente) {
      return { mensaje: 'El correo ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const nuevoUsuario = this.usuarioRepo.create({
      nombre: createUserDto.name,
      apellido: createUserDto.lastName,
      correo: createUserDto.email,
      contrasena: hashedPassword,
    });

    await this.usuarioRepo.save(nuevoUsuario);
    return { mensaje: 'Usuario registrado exitosamente', usuario: nuevoUsuario };
  }

  async validateUser(email: string, password: string): Promise<Usuario | null> {
    const usuario = await this.usuarioRepo.findOne({ where: { correo: email } });
    if (usuario && await bcrypt.compare(password, usuario.contrasena)) {
      return usuario;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.validateUser(loginDto.email, loginDto.password);
    if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: usuario.id, correo: usuario.correo };
    const token = this.jwtService.sign(payload);

    const nuevaSesion = this.sesionRepo.create({ token, usuario });
    await this.sesionRepo.save(nuevaSesion);

    return { token, usuario };
  }

  async createSessionForUser(usuario: Usuario) {
    const payload = { sub: usuario.id, correo: usuario.correo };
    const token = this.jwtService.sign(payload);

    const nuevaSesion = this.sesionRepo.create({ token, usuario });
    await this.sesionRepo.save(nuevaSesion);

    return { token, usuario };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const usuario = await this.usuarioRepo.findOne({ where: { correo: forgotPasswordDto.email } });
    if (!usuario) {
      return { mensaje: 'Correo no registrado' };
    }

    const payload = { sub: usuario.id, correo: usuario.correo };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    await this.mailService.sendPasswordReset(forgotPasswordDto.email, token);
    return { mensaje: 'Correo enviado con instrucciones' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      const usuario = await this.usuarioRepo.findOne({ where: { id: payload.sub } });
      if (!usuario) return { mensaje: 'Usuario no encontrado' };

      if (dto.newPassword !== dto.confirmPassword) {
        return { mensaje: 'Las contraseñas no coinciden' };
      }

      usuario.contrasena = await bcrypt.hash(dto.newPassword, 10);
      usuario.passwordUpdatedAt = new Date();
      await this.usuarioRepo.save(usuario);

      return { mensaje: 'Contraseña actualizada correctamente' };
    } catch {
      return { mensaje: 'Token inválido o expirado' };
    }
  }

  async closeSession(token: string) {
    const result = await this.sesionRepo.delete({ token });
    
    if (result.affected === 0) {
      return { mensaje: 'La sesión no existía o ya había sido cerrada' };
    }
    return { mensaje: 'Sesión cerrada exitosamente' };
  }

    async findUserById(id: number) {
    return await this.usuarioRepo.findOne({ 
      where: { id },
      select: ['id', 'nombre', 'apellido', 'correo', 'passwordUpdatedAt'] 
    });
  }

  async changePassword(dto: ChangePasswordDto, usuarioId: number) {
    console.log('ID del usuario recibido:', usuarioId);

    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      console.error('Usuario no encontrado en la DB con ID:', usuarioId);
      throw new NotFoundException('Usuario no encontrado');
    }

    const match = await bcrypt.compare(dto.oldPassword, usuario.contrasena);
    if (!match) {
      // register failed attempt for this user
      try {
        const key = String(usuarioId);
        this.attemptsService.recordFailure(key);
        if (this.attemptsService.isBlocked(key)) {
          const remaining = this.attemptsService.getRemainingSeconds(key);
          throw new HttpException(
            {
              message: `La cuenta está bloqueada por demasiados intentos. Intenta de nuevo en ${remaining} segundos.`,
              mensaje: `La cuenta está bloqueada por demasiados intentos. Intenta de nuevo en ${remaining} segundos.`,
              retryAfterSeconds: remaining,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } catch (error) {
        throw error;
      }
      throw new UnauthorizedException('La contraseña actual no coincide');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    usuario.contrasena = await bcrypt.hash(dto.newPassword, 10);
    console.log('Nueva contraseña hasheada lista para guardar:', usuario.contrasena);

    const resultado = await this.usuarioRepo.save(usuario);
    console.log('Resultado del save de TypeORM:', resultado);

    // on success reset attempts
    try { this.attemptsService.reset(String(usuarioId)); } catch(e) { /* ignore */ }

    return { mensaje: 'Contraseña cambiada exitosamente' };
  }

    async countActiveSessions(usuarioId: number) {
    return await this.sesionRepo.count({ where: { usuario: { id: usuarioId } } });
  }

  async closeAllSessions(usuarioId: number) {
    try {
      await this.sesionRepo.delete({ usuario: { id: usuarioId } });

      return { mensaje: 'Todas las sesiones han sido cerradas' };
    } catch (error) {
      console.error("Error en DB al cerrar todo:", error);
      throw error;
    }
  }
}
