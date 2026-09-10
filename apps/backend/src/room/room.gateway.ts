import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  type JoinRoomPayload,
  type RoomUpdatedPayload,
    type Player,
} from '@party-games/shared';
import { RoomService } from './room.service.js';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Inyectar el RoomService
  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`🟢 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Cliente desconectado: ${client.id}`);
    const affectedRoomCode = this.roomService.removePlayer(client.id);
    
    if (affectedRoomCode) {
      const room = this.roomService.getRoom(affectedRoomCode);
      if (room) {
        this.server.to(affectedRoomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: 'Un jugador se ha desconectado',
          room,
        });
      }
    }
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // Si la sala no existe en memoria (simulamos que siempre existe para probar por ahora)
    let room = this.roomService.getRoom(data.roomCode);
    if (!room) {
       // Temporal: si intentan unirse a una sala que no existe, la creamos
       const newCode = this.roomService.createRoom(client.id);
       // Forzamos el código temporal para la prueba
       data.roomCode = newCode; 
       room = this.roomService.getRoom(newCode);
    }

    const newPlayer: Player = {
      id: client.id,
      name: data.playerName,
      isHost: false,
    };

    const updatedRoom = this.roomService.joinRoom(data.roomCode, newPlayer);

    if (updatedRoom) {
      client.join(data.roomCode);
      console.log(`🎮 [Sala ${data.roomCode}] ${data.playerName} se unió.`);

      const response: RoomUpdatedPayload = {
        message: `${data.playerName} ha entrado a la sala`,
        room: updatedRoom,
      };

      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, response);
    }
  }
}