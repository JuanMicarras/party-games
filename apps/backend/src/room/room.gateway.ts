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
} from '@party-games/shared';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🟢 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    // 1. Unir el socket a la sala de Socket.io
    client.join(data.roomCode);
    console.log(`🎮 [Sala ${data.roomCode}] ${data.playerName} se unió.`);

    // 2. Preparar la respuesta cumpliendo el contrato de @party-games/shared
    const response: RoomUpdatedPayload = {
      roomCode: data.roomCode,
      message: `${data.playerName} ha entrado a la sala`,
    };

    // 3. Emitir el evento a todos los clientes conectados a esa sala en particular
    this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, response);
  }
}