import { Injectable } from '@nestjs/common';
import { RoomState, Player } from '@party-games/shared';

@Injectable()
export class RoomService {
  // Almacenamiento en memoria de las salas activas
  private rooms: Map<string, RoomState> = new Map();

  createRoom(hostId: string): string {
    // Generar un código aleatorio de 4 letras (A-Z)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let roomCode = '';
    for (let i = 0; i < 4; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const newRoom: RoomState = {
      roomCode,
      mode: 'LOBBY',
      players: [],
      hostId,
    };

    this.rooms.set(roomCode, newRoom);
    return roomCode;
  }

  startGame(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    
    // Necesitamos al menos 2 jugadores para jugar
    if (!room || room.players.length < 2) return null;

    room.mode = 'MIMIRETO';

    // 1. Barajar aleatoriamente a los jugadores
    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // 2. Dividir en Equipo A y Equipo B de forma intercalada
    shuffledPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        player.team = 'A';
        teamA.push(player);
      } else {
        player.team = 'B';
        teamB.push(player);
      }
    });

    // 3. Inicializar el estado de Mimireto
    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      // El primer jugador del equipo A empieza hablando
      speakerId: teamA[0]?.id || null,
      // El primer jugador del equipo B empieza de juez
      judgeId: teamB[0]?.id || null,
      currentCard: null,
      status: 'WAITING',
    };

    return room;
  }
  
  joinRoom(roomCode: string, player: Player): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Evitar duplicados si el mismo socket intenta unirse dos veces
    const exists = room.players.find((p) => p.id === player.id);
    if (!exists) {
      room.players.push(player);
    }
    
    return room;
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  removePlayer(socketId: string) {
    // Buscar al jugador en todas las salas para eliminarlo si se desconecta
    for (const [roomCode, room] of this.rooms.entries()) {
      const initialLength = room.players.length;
      room.players = room.players.filter((p) => p.id !== socketId);
      
      if (room.players.length < initialLength) {
        // Si la sala queda vacía, la eliminamos de la memoria
        if (room.players.length === 0) {
          this.rooms.delete(roomCode);
        }
        return roomCode; // Retorna el código de la sala afectada
      }
    }
    return null;
  }
}