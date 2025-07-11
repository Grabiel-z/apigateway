// src/app.module.ts
import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [GatewayModule], // solo importa el módulo real
})
export class AppModule {}
