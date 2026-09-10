import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway.js';
import { RoomService } from './room.service.js';


@Module({
  providers: [RoomGateway, RoomService],
  exports: [RoomService], // Exportamos por si otros módulos de juego necesitan consultar salas
})
export class RoomModule {}