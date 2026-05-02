import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modulo global que expone `PrismaService` a toda la aplicacion.
 * Al ser `@Global()` no es necesario importarlo en cada feature
 * module: basta con tenerlo registrado una vez en `AppModule`.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
