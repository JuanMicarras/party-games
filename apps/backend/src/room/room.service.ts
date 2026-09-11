import { Injectable, Logger } from '@nestjs/common';
import { RoomState, Player, GameMode } from '@party-games/shared';
import { MimiretoService } from './mimireto.service.js';
import { CuentoChinoService } from './cuento-chino.service.js';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private rooms: Map<string, RoomState> = new Map();

  constructor(
    private readonly mimiretoService: MimiretoService,
    private readonly cuentoChinoService: CuentoChinoService,
  ) {}

  createRoom(hostId: string): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let roomCode = '';
    for (let i = 0; i < 4; i++) {
      roomCode += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    const newRoom: RoomState = {
      roomCode,
      mode: 'LOBBY',
      players: [],
      hostId,
    };

    this.rooms.set(roomCode, newRoom);
    this.logger.log(`🏠 Sala creada con código ${roomCode} por Host ${hostId}`);
    return roomCode;
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  joinRoom(roomCode: string, player: Player): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const existingPlayer = room.players.find(
      (p: Player) => p.name.toLowerCase() === player.name.toLowerCase(),
    );

    if (existingPlayer) {
      const oldSocketId = existingPlayer.id;
      existingPlayer.id = player.id;
      existingPlayer.connected = true;

      // Actualizar roles de Mimireto si corresponde
      if (room.mimireto) {
        if (room.mimireto.speakerId === oldSocketId) {
          room.mimireto.speakerId = player.id;
        }
        if (room.mimireto.judgeId === oldSocketId) {
          room.mimireto.judgeId = player.id;
        }
      }

      // Actualizar referencias en Cuento Chino si corresponde
      if (room.cuentoChino) {
        if (room.cuentoChino.scores[oldSocketId] !== undefined) {
          room.cuentoChino.scores[player.id] =
            room.cuentoChino.scores[oldSocketId];
          delete room.cuentoChino.scores[oldSocketId];
        }
        if (room.cuentoChino.submittedLies[oldSocketId]) {
          room.cuentoChino.submittedLies[player.id] =
            room.cuentoChino.submittedLies[oldSocketId];
          delete room.cuentoChino.submittedLies[oldSocketId];
        }
        const sabioIdx = room.cuentoChino.sabioPlayerIds.indexOf(oldSocketId);
        if (sabioIdx !== -1) {
          room.cuentoChino.sabioPlayerIds[sabioIdx] = player.id;
        }
      }

      this.logger.log(
        `🔄 Jugador ${player.name} reconectado en sala ${roomCode} con nuevo socket ${player.id}`,
      );
    } else {
      player.connected = true;
      room.players.push(player);
      this.logger.log(`➕ Jugador ${player.name} añadido a sala ${roomCode}`);
    }

    return room;
  }

  removePlayer(socketId: string): {
    affectedRoomCode: string | null;
    shouldPause: boolean;
  } {
    let affectedRoomCode: string | null = null;
    let shouldPause = false;

    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find((p: Player) => p.id === socketId);

      if (player) {
        player.connected = false;
        affectedRoomCode = roomCode;

        this.logger.warn(
          `⚠️ Jugador ${player.name} (${socketId}) desconectado de sala ${roomCode}`,
        );

        // Si Mimireto está en marcha ('PLAYING'), pausar
        if (room.mimireto && room.mimireto.status === 'PLAYING') {
          room.mimireto.status = 'PAUSED';
          shouldPause = true;
          this.logger.warn(`⏸️ Sala ${roomCode} pausada debido a desconexión.`);
        }
      }
    }

    return { affectedRoomCode, shouldPause };
  }

  startGame(
    roomCode: string,
    gameMode: GameMode = 'MIMIRETO',
    options?: { roundsMultiplier?: number; totalQuestions?: number },
  ): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (gameMode === 'CUENTO_CHINO') {
      delete room.mimireto;
      return this.cuentoChinoService.initGame(
        room,
        options?.totalQuestions ?? 3,
      );
    } else {
      delete room.cuentoChino;
      return this.mimiretoService.initGame(
        room,
        options?.roundsMultiplier ?? 1,
      );
    }
  }

  // Mimireto delegations
  handleCardAction(
    roomCode: string,
    socketId: string,
    action: 'SUCCESS' | 'PASS' | 'FOUL',
  ): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return this.mimiretoService.handleCardAction(room, socketId, action);
  }

  rotateTurn(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return this.mimiretoService.rotateTurn(room);
  }

  // Cuento Chino delegations
  submitLie(
    roomCode: string,
    playerId: string,
    lie: string,
  ) {
    const room = this.rooms.get(roomCode);
    if (!room) return { status: 'DUPLICATE' as const, message: 'Sala no encontrada' };
    return this.cuentoChinoService.submitLie(room, playerId, lie);
  }

  startVotingPhase(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return this.cuentoChinoService.startVotingPhase(room);
  }

  submitVote(
    roomCode: string,
    playerId: string,
    optionId: string,
  ) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };
    return this.cuentoChinoService.submitVote(room, playerId, optionId);
  }

  revealResults(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return this.cuentoChinoService.revealResults(room);
  }

  nextQuestion(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    return this.cuentoChinoService.nextQuestion(room);
  }

  resetToLobby(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    room.mode = 'LOBBY';
    delete room.mimireto;
    delete room.cuentoChino;
    room.players.forEach((p) => {
      delete p.team;
    });

    this.logger.log(`🔄 Sala ${roomCode} regresada a modo LOBBY.`);
    return room;
  }
}
