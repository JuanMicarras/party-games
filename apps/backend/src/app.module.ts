import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RoomGateway } from './room/room.gateway.js';



@Module({
  imports: [  ],
  controllers: [AppController],
  providers: [AppService, RoomGateway],
})
export class AppModule {}
