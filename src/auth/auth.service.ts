import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDto, RegisterUserDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import { envs } from 'src/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Numero de rondas para bcrypt. 10 es un balance estandar entre
  // seguridad y rendimiento.
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;

    await this.assertEmailDisponible(email);

    try {
      const passwordHash = await bcrypt.hash(password, AuthService.SALT_ROUNDS);

      const usuario = await this.prisma.usuario.create({
        data: {
          email,
          name,
          password: passwordHash,
        },
      });

      return {
        usuario: this.sanitizarUsuario(usuario),
        token: this.generarTokenJWT({
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
        }),
      };
    } catch (error) {
      this.logger.error(`Error al registrar usuario ${email}`, error as Error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'No se pudo registrar el usuario',
      });
    }
  }



  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { email },
      });
      if (!usuario) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Credenciales inválidas',
        });
      }

      const passwordValida = bcrypt.compareSync(password, usuario.password);
      if (!passwordValida) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Credenciales inválidas - password incorrecto',
        });
      }

      return {
        usuario: this.sanitizarUsuario(usuario),
        token: this.generarTokenJWT({
          id: usuario.id,
          email: usuario.email,
          name: usuario.name,
        }),
      }

    } catch (error: any) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      
      const { sub, iat, exp, ...usuario } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        usuario: usuario,
        token: this.generarTokenJWT(usuario)
      }

    } catch (error) {
      // console.log(error);
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token'
      })
    }

  }

  /**
   * Lanza una RpcException 400 si ya existe un usuario con el email indicado.
   * Mantenemos esta validacion como metodo privado para no contaminar el
   * flujo principal con `if`s y poder reutilizarlo desde otras operaciones
   * (por ejemplo, cambio de email) cuando el proyecto crezca.
   */
  private async assertEmailDisponible(email: string): Promise<void> {
    const existe = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existe) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `El usuario con email ${email} ya existe`,
      });
    }
  }

  /**
   * Elimina campos sensibles (password) antes de devolver un usuario al
   * exterior. Centralizar esta logica evita filtrar el hash por descuido
   * cuando se agreguen nuevos endpoints.
   */
  private sanitizarUsuario<T extends { password: string }>(usuario: T): Omit<T, 'password'> {
    const { password: _password, ...resto } = usuario;
    return resto;
  }

  private generarTokenJWT(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }


  
}
