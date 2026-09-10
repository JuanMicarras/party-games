import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RoomGateway } from './room/room.gateway.js';
import { RoomModule } from './room/room.module.js';



@Module({
  imports: [  RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
