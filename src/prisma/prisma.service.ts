import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

/**
 * Wrapper de PrismaClient inyectable por NestJS.
 *
 * - Maneja el ciclo de vida de la conexion mediante los hooks
 *   `OnModuleInit` y `OnModuleDestroy`, asi cualquier feature que lo
 *   inyecte recibe una instancia ya conectada y se desconecta de
 *   forma ordenada al apagar el microservicio.
 * - Se registra como provider en `PrismaModule` (global) para que
 *   futuros modulos (roles, sesiones, perfiles, etc.) puedan
 *   inyectarlo directamente sin reimportar nada.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado a MongoDB via Prisma');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Desconectado de MongoDB');
  }
}
