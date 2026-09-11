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
  type ResetToLobbyPayload,
  type StartGamePayload,
  type SubmitLiePayload,
  type SubmitVotePayload,
  type NextQuestionPayload,
  type Player,
} from '@party-games/shared';
import { RoomService } from './room.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly roomService: RoomService) {}

  handleConnection(client: Socket) {
    console.log(`🟢 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Cliente desconectado: ${client.id}`);
    const { affectedRoomCode, shouldPause } = this.roomService.removePlayer(
      client.id,
    );

    if (affectedRoomCode) {
      const room = this.roomService.getRoom(affectedRoomCode);
      if (room) {
        if (shouldPause && this.activeTimers.has(affectedRoomCode)) {
          clearInterval(this.activeTimers.get(affectedRoomCode));
          this.activeTimers.delete(affectedRoomCode);
        }

        this.server.to(affectedRoomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: 'Alguien se ha desconectado.',
          room,
        });
      }
    }
  }

  @SubscribeMessage(SocketEvents.CREATE_ROOM)
  handleCreateRoom(@ConnectedSocket() client: Socket) {
    const roomCode = this.roomService.createRoom(client.id);
    client.join(roomCode);

    const room = this.roomService.getRoom(roomCode);
    if (room) {
      client.emit(SocketEvents.ROOM_UPDATED, {
        message: 'Sala creada exitosamente',
        room,
      });
    }
  }

  @SubscribeMessage(SocketEvents.START_GAME)
  handleStartGame(
    @MessageBody() data: StartGamePayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode) return;

    const gameMode = data.gameMode || 'MIMIRETO';
    const updatedRoom = this.roomService.startGame(data.roomCode, gameMode, {
      roundsMultiplier: data.roundsMultiplier ?? 1,
      totalQuestions: data.totalQuestions ?? 3,
    });

    if (updatedRoom) {
      // Limpiar timers anteriores
      if (this.activeTimers.has(data.roomCode)) {
        clearInterval(this.activeTimers.get(data.roomCode));
        this.activeTimers.delete(data.roomCode);
      }

      if (gameMode === 'CUENTO_CHINO') {
        // Iniciar timer de redacción de mentiras (45 seg)
        this.startCuentoChinoPhaseTimer(data.roomCode, 'WRITING_LIES');
      }

      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message:
          gameMode === 'CUENTO_CHINO'
            ? '¡Comienza Cita Verdadera o Cuento Chino!'
            : '¡Los equipos han sido formados!',
        room: updatedRoom,
      });
    } else {
      client.emit(SocketEvents.ERROR, {
        message: 'No hay suficientes jugadores para empezar (mínimo 2)',
      });
    }
  }

  // --------------------------------------------------------------------------
  // MIMIRETO EVENTS
  // --------------------------------------------------------------------------
  @SubscribeMessage(SocketEvents.CARD_ACTION)
  handleCardAction(
    @MessageBody() data: CardActionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode || !data?.action) return;

    const updatedRoom = this.roomService.handleCardAction(
      data.roomCode,
      client.id,
      data.action,
    );

    if (updatedRoom) {
      if (data.action === 'SUCCESS' || data.action === 'FOUL') {
        this.server
          .to(data.roomCode)
          .emit(SocketEvents.PLAY_SOUND, { sound: data.action });
      }

      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: `Acción procesada: ${data.action}`,
        room: updatedRoom,
      });
    }
  }

  @SubscribeMessage(SocketEvents.START_TURN)
  handleStartTurn(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode) return;

    const room = this.roomService.getRoom(data.roomCode);
    if (!room || !room.mimireto) return;

    if (
      room.mimireto.speakerId &&
      room.mimireto.speakerId !== client.id &&
      room.hostId !== client.id
    ) {
      client.emit(SocketEvents.ERROR, {
        message: 'Solo el orador puede iniciar o reanudar el reloj.',
      });
      return;
    }

    room.mimireto.status = 'PLAYING';
    this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
      message: '¡El tiempo corre!',
      room,
    });

    if (this.activeTimers.has(data.roomCode)) {
      clearInterval(this.activeTimers.get(data.roomCode));
      this.activeTimers.delete(data.roomCode);
    }

    const timer = setInterval(() => {
      if (room.mimireto && room.mimireto.status === 'PLAYING') {
        if (room.mimireto.timeLeft > 0) {
          room.mimireto.timeLeft -= 1;

          if (
            room.mimireto.timeLeft <= 5 &&
            room.mimireto.timeLeft > 0 &&
            room.mimireto.timeLeft % 2 === 1
          ) {
            this.server
              .to(data.roomCode)
              .emit(SocketEvents.PLAY_SOUND, { sound: 'TICK' });
          }

          this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
            message: 'Tick',
            room,
          });

          if (room.mimireto.timeLeft === 0) {
            clearInterval(this.activeTimers.get(data.roomCode));
            this.activeTimers.delete(data.roomCode);

            this.server
              .to(data.roomCode)
              .emit(SocketEvents.PLAY_SOUND, { sound: 'TIME_UP' });

            const updatedRoom = this.roomService.rotateTurn(data.roomCode);
            if (updatedRoom) {
              this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
                message: '¡Tiempo agotado! Cambio de turno.',
                room: updatedRoom,
              });
            }
          }
        }
      } else {
        if (this.activeTimers.has(data.roomCode)) {
          clearInterval(this.activeTimers.get(data.roomCode));
          this.activeTimers.delete(data.roomCode);
        }
      }
    }, 1000);

    this.activeTimers.set(data.roomCode, timer);
  }

  // --------------------------------------------------------------------------
  // CUENTO CHINO EVENTS
  // --------------------------------------------------------------------------
  @SubscribeMessage(SocketEvents.SUBMIT_LIE)
  handleSubmitLie(
    @MessageBody() data: SubmitLiePayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode || !data?.lie?.trim()) return;

    const result = this.roomService.submitLie(
      data.roomCode,
      client.id,
      data.lie,
    );

    // Feedback privado al jugador (si fue sabio, si fue aceptado, etc.)
    client.emit(SocketEvents.LIE_FEEDBACK, {
      status: result.status,
      message: result.message,
    });

    const room = this.roomService.getRoom(data.roomCode);
    if (!room) return;

    if (result.allSubmitted) {
      // Todos enviaron su mentira: pasar a votación inmediatamente
      if (this.activeTimers.has(data.roomCode)) {
        clearInterval(this.activeTimers.get(data.roomCode));
        this.activeTimers.delete(data.roomCode);
      }

      const updatedRoom = this.roomService.startVotingPhase(data.roomCode);
      if (updatedRoom) {
        this.startCuentoChinoPhaseTimer(data.roomCode, 'VOTING');
        this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: '¡Todas las mentiras recibidas! A votar...',
          room: updatedRoom,
        });
      }
    } else {
      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: 'Nueva mentira recibida',
        room,
      });
    }
  }

  @SubscribeMessage(SocketEvents.SUBMIT_VOTE)
  handleSubmitVote(
    @MessageBody() data: SubmitVotePayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode || !data?.optionId) return;

    const result = this.roomService.submitVote(
      data.roomCode,
      client.id,
      data.optionId,
    );

    if (!result.success) return;

    const room = this.roomService.getRoom(data.roomCode);
    if (!room) return;

    if (result.allVoted) {
      // Todos los votantes elegibles votaron: pasar a revelación inmediatamente
      if (this.activeTimers.has(data.roomCode)) {
        clearInterval(this.activeTimers.get(data.roomCode));
        this.activeTimers.delete(data.roomCode);
      }

      const updatedRoom = this.roomService.revealResults(data.roomCode);
      if (updatedRoom) {
        this.server
          .to(data.roomCode)
          .emit(SocketEvents.PLAY_SOUND, { sound: 'SUCCESS' });
        this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: '¡Votación completada! Revelando resultados...',
          room: updatedRoom,
        });
      }
    } else {
      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: 'Nuevo voto registrado',
        room,
      });
    }
  }

  @SubscribeMessage(SocketEvents.NEXT_QUESTION)
  handleNextQuestion(
    @MessageBody() data: NextQuestionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode) return;

    const room = this.roomService.getRoom(data.roomCode);
    if (!room || room.hostId !== client.id) return; // Solo el host avanza

    if (this.activeTimers.has(data.roomCode)) {
      clearInterval(this.activeTimers.get(data.roomCode));
      this.activeTimers.delete(data.roomCode);
    }

    const updatedRoom = this.roomService.nextQuestion(data.roomCode);
    if (updatedRoom) {
      if (updatedRoom.cuentoChino?.status === 'WRITING_LIES') {
        this.startCuentoChinoPhaseTimer(data.roomCode, 'WRITING_LIES');
      }

      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: 'Siguiente ronda',
        room: updatedRoom,
      });
    }
  }

  private startCuentoChinoPhaseTimer(
    roomCode: string,
    phase: 'WRITING_LIES' | 'VOTING',
  ) {
    if (this.activeTimers.has(roomCode)) {
      clearInterval(this.activeTimers.get(roomCode));
      this.activeTimers.delete(roomCode);
    }

    const timer = setInterval(() => {
      const room = this.roomService.getRoom(roomCode);
      if (!room || !room.cuentoChino || room.cuentoChino.status !== phase) {
        clearInterval(timer);
        this.activeTimers.delete(roomCode);
        return;
      }

      if (room.cuentoChino.timeLeft > 0) {
        room.cuentoChino.timeLeft -= 1;

        if (
          room.cuentoChino.timeLeft <= 5 &&
          room.cuentoChino.timeLeft > 0 &&
          room.cuentoChino.timeLeft % 2 === 1
        ) {
          this.server
            .to(roomCode)
            .emit(SocketEvents.PLAY_SOUND, { sound: 'TICK' });
        }

        this.server.to(roomCode).emit(SocketEvents.ROOM_UPDATED, {
          message: 'Tick',
          room,
        });

        if (room.cuentoChino.timeLeft === 0) {
          clearInterval(timer);
          this.activeTimers.delete(roomCode);

          if (phase === 'WRITING_LIES') {
            const updated = this.roomService.startVotingPhase(roomCode);
            if (updated) {
              this.startCuentoChinoPhaseTimer(roomCode, 'VOTING');
              this.server.to(roomCode).emit(SocketEvents.ROOM_UPDATED, {
                message: '¡Tiempo agotado! A votar...',
                room: updated,
              });
            }
          } else if (phase === 'VOTING') {
            const updated = this.roomService.revealResults(roomCode);
            if (updated) {
              this.server
                .to(roomCode)
                .emit(SocketEvents.PLAY_SOUND, { sound: 'TIME_UP' });
              this.server.to(roomCode).emit(SocketEvents.ROOM_UPDATED, {
                message: '¡Tiempo de votación agotado! Revelando resultados...',
                room: updated,
              });
            }
          }
        }
      }
    }, 1000);

    this.activeTimers.set(roomCode, timer);
  }

  // --------------------------------------------------------------------------
  // GENERAL ROOM EVENTS
  // --------------------------------------------------------------------------
  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode || !data?.playerName?.trim()) {
      client.emit(SocketEvents.ERROR, { message: 'Datos de ingreso inválidos' });
      return;
    }

    const roomCode = data.roomCode.toUpperCase().trim();
    const room = this.roomService.getRoom(roomCode);
    if (!room) {
      client.emit(SocketEvents.ERROR, { message: 'La sala no existe' });
      return;
    }

    const newPlayer: Player = {
      id: client.id,
      name: data.playerName.trim(),
      isHost: false,
    };

    const updatedRoom = this.roomService.joinRoom(roomCode, newPlayer);

    if (updatedRoom) {
      client.join(roomCode);
      console.log(`🎮 [Sala ${roomCode}] ${data.playerName} se unió.`);

      const response: RoomUpdatedPayload = {
        message: `${data.playerName} ha entrado a la sala`,
        room: updatedRoom,
      };

      this.server.to(roomCode).emit(SocketEvents.ROOM_UPDATED, response);
    }
  }

  @SubscribeMessage(SocketEvents.RESET_TO_LOBBY)
  handleResetToLobby(
    @MessageBody() data: ResetToLobbyPayload,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomCode) return;

    if (this.activeTimers.has(data.roomCode)) {
      clearInterval(this.activeTimers.get(data.roomCode));
      this.activeTimers.delete(data.roomCode);
    }

    const updatedRoom = this.roomService.resetToLobby(data.roomCode);
    if (updatedRoom) {
      this.server.to(data.roomCode).emit(SocketEvents.ROOM_UPDATED, {
        message: 'La partida ha sido reiniciada al lobby.',
        room: updatedRoom,
      });
    }
  }
}
