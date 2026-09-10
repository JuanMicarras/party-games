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

// Aquí importaremos los tipos desde @party-games/shared más adelante

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
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

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomCode: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomCode);
    console.log(`${data.playerName} se unió a la sala ${data.roomCode}`);
    
    // Notifica a todos en la sala (incluyendo al que acaba de entrar)
    this.server.to(data.roomCode).emit('room_updated', {
      message: `${data.playerName} ha entrado a la sala`,
    });
  }
}