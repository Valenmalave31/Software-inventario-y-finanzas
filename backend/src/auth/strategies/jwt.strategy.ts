import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Sesion } from '../entities/sesion.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Sesion) 
    private sesionRepo: Repository<Sesion>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
      passReqToCallback: true,
    });
  }

async validate(req: any, payload: any): Promise<Usuario> {
    const userId = payload.id || payload.sub;

    // Extraer el token del header para verificarlo
    const authHeader = req.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // BUSCAR LA SESIÓN EN LA DB
    const sesionActiva = await this.sesionRepo.findOne({ where: { token } });

    // SI NO EXISTE LA SESIÓN (porque alguien le dio a "Cerrar todas"), lanzamos error
    if (!sesionActiva) {
      console.warn(`Sesión invalidada para el usuario ${userId}`);
      throw new UnauthorizedException('La sesión ha expirado o ha sido cerrada.');
    }

    // Continuamos con la validación normal del usuario
    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no existe');
    }

    return usuario;
  }
}
