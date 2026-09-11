import { Injectable } from '@nestjs/common';
import { RoomState, Player } from '@party-games/shared';
const MIMIRETO_DECK = [
  { word: 'Guitarra Acústica', forbidden: ['Instrumento', 'Cuerdas', 'Tocar', 'Música', 'Madera'] },
  { word: 'Pepperoni', forbidden: ['Pizza', 'Domino\'s', 'Queso', 'Comida', 'Masa'] },
  { word: 'Pádel', forbidden: ['Deporte', 'Raqueta', 'Pelota', 'Cancha', 'Jaula'] },
  { word: 'Cosmere', forbidden: ['Libros', 'Sanderson', 'Fantasía', 'Universo', 'Leer'] },
  { word: 'Percy', forbidden: ['Perro', 'Mascota', 'Animal', 'Peludo', 'Pasear'] }
];

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
    if (!room || room.players.length < 2) return null;

    room.mode = 'MIMIRETO';

    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    shuffledPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        player.team = 'A';
        teamA.push(player);
      } else {
        player.team = 'B';
        teamB.push(player);
      }
    });

    // Robar una carta aleatoria del mazo
    const randomCard = MIMIRETO_DECK[Math.floor(Math.random() * MIMIRETO_DECK.length)];

    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      speakerId: teamA[0]?.id || null,
      judgeId: teamB[0]?.id || null,
      currentCard: randomCard, // Asignamos la carta al estado
      status: 'WAITING',
      timeLeft: 60,
      teamASpeakerIndex: 0,
      teamBSpeakerIndex: 0,
    };

    return room;
  }

  handleCardAction(roomCode: string, action: 'SUCCESS' | 'PASS' | 'FOUL'): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.mode !== 'MIMIRETO' || !room.mimireto) return null;

    const state = room.mimireto;

    // 1. Aplicar la lógica de puntos
    if (action === 'SUCCESS') {
      if (state.currentTurn === 'A') state.teamAScore += 1;
      else state.teamBScore += 1;
    } else if (action === 'FOUL') {
      // Las faltas restan 1 punto
      if (state.currentTurn === 'A') state.teamAScore -= 1;
      else state.teamBScore -= 1;
    }
    // Si la acción es 'PASS', no sumamos ni restamos puntos por ahora

    // 2. Robar una carta nueva que no sea la misma que la anterior
    let nextCard;
    do {
      nextCard = MIMIRETO_DECK[Math.floor(Math.random() * MIMIRETO_DECK.length)];
    } while (state.currentCard && nextCard.word === state.currentCard.word);
    
    state.currentCard = nextCard;

    return room;
  }

  // 2. Agrega este NUEVO método debajo de 'handleCardAction':
  rotateTurn(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || !room.mimireto) return null;

    const state = room.mimireto;
    const teamA = room.players.filter(p => p.team === 'A');
    const teamB = room.players.filter(p => p.team === 'B');

    // Cambiar de equipo
    state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';
    
    // Avanzar al siguiente jugador del equipo que va a hablar
    if (state.currentTurn === 'A') {
      state.teamASpeakerIndex = (state.teamASpeakerIndex + 1) % teamA.length;
      state.speakerId = teamA[state.teamASpeakerIndex]?.id || null;
      // El juez es el que acaba de hablar del equipo B (o el actual)
      state.judgeId = teamB[state.teamBSpeakerIndex]?.id || null;
    } else {
      state.teamBSpeakerIndex = (state.teamBSpeakerIndex + 1) % teamB.length;
      state.speakerId = teamB[state.teamBSpeakerIndex]?.id || null;
      // El juez es el que acaba de hablar del equipo A
      state.judgeId = teamA[state.teamASpeakerIndex]?.id || null;
    }

    // Reiniciar para el siguiente turno
    state.status = 'TIME_UP';
    state.timeLeft = 60;
    
    // Robar carta nueva para el siguiente
    const nextCard = MIMIRETO_DECK[Math.floor(Math.random() * MIMIRETO_DECK.length)];
    state.currentCard = nextCard;

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