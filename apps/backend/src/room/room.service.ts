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