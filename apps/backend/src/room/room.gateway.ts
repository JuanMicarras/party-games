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
  type CardActionPayload,
//   type startGamePayload,
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
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();


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

  // NUEVO: El TV llama a este evento para generar un código
  @SubscribeMessage(SocketEvents.CREATE_ROOM)
  handleCreateRoom(@ConnectedSocket() client: Socket) {
    const roomCode = this.roomService.createRoom(client.id);
    client.join(roomCode); // El TV se une a la sala invisiblemente
    
    const room = this.roomService.getRoom(roomCode);
    if (room) {
      client.emit(SocketEvents.ROOM_UPDATED, {
        message: 'Sala creada exitosamente',
        room,
      });
    }
  }

  // NUEVO: El TV dispara este evento para iniciar la partida
  @SubscribeMessage(SocketEvents.START_GAME)
  handleStartGame(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const updatedRoom = this.roomService.startGame(data.roomCode);
    
    if (updatedRoom) {
      console.log(`🚀 [Sala ${data.roomCode}] Modo cambiado a MIMIRETO`);
      
      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: '¡Los equipos han sido formados!',
        room: updatedRoom,
      });
    } else {
      client.emit(SocketEvents.ERROR, { message: 'No hay suficientes jugadores para empezar' });
    }
  }

  @SubscribeMessage(SocketEvents.CARD_ACTION)
  handleCardAction(
    @MessageBody() data: CardActionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const updatedRoom = this.roomService.handleCardAction(data.roomCode, data.action);
    
    if (updatedRoom) {
      // Emitimos el estado actualizado a toda la sala
      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: `Acción procesada: ${data.action}`,
        room: updatedRoom,
      });
    }
  }

  // ACTUALIZADO: Quitamos la creación de sala temporal que teníamos aquí
  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.roomService.getRoom(data.roomCode);
    if (!room) {
       // Si el código no existe, le avisamos al cliente
       client.emit(SocketEvents.ERROR, { message: 'La sala no existe' });
       return;
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

  @SubscribeMessage(SocketEvents.START_TURN)
  handleStartTurn(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.roomService.getRoom(data.roomCode);
    if (!room || !room.mimireto) return;

    // Cambiamos el estado y avisamos que arrancó
    room.mimireto.status = 'PLAYING';
    this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
      message: '¡El tiempo corre!',
      room,
    });

    // Asegurarnos de no duplicar cronómetros
    if (this.activeTimers.has(data.roomCode)) {
      clearInterval(this.activeTimers.get(data.roomCode));
    }

    // Crear el cronómetro de 1 segundo
    const timer = setInterval(() => {
      if (room.mimireto && room.mimireto.timeLeft > 0) {
        room.mimireto.timeLeft -= 1;
        
        // Emitimos el tick a todos
        this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: 'Tick',
          room,
        });

        // Si llegó a cero, paramos el reloj y rotamos
        if (room.mimireto.timeLeft === 0) {
          clearInterval(this.activeTimers.get(data.roomCode));
          const updatedRoom = this.roomService.rotateTurn(data.roomCode);
          if (updatedRoom) {
            this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
              message: '¡Tiempo agotado! Cambio de turno.',
              room: updatedRoom,
            });
          }
        }
      }
    }, 1000);

    this.activeTimers.set(data.roomCode, timer);
  }
  
}