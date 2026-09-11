import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway.js';
import { RoomService } from './room.service.js';
import { DeckService } from './deck.service.js';
import { MimiretoService } from './mimireto.service.js';
import { CuentoChinoService } from './cuento-chino.service.js';
import { CuentoChinoDeckService } from './cuento-chino-deck.service.js';

@Module({
  providers: [
    RoomGateway,
    RoomService,
    DeckService,
    MimiretoService,
    CuentoChinoService,
    CuentoChinoDeckService,
  ],
  exports: [
    RoomService,
    MimiretoService,
    DeckService,
    CuentoChinoService,
    CuentoChinoDeckService,
  ],
})
export class RoomModule {}