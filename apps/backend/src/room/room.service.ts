import { Injectable } from '@nestjs/common';
import { RoomState, Player, MimiretoCard } from '@party-games/shared';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoomService {
  private rooms: Map<string, RoomState> = new Map();

  private getDeck(): MimiretoCard[] {
    try {
      // process.cwd() apunta a apps/backend
      const filePath = path.join(process.cwd(), 'cartas.json');
      const fileData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileData);
    } catch (error) {
      console.error(
        'Error leyendo cartas.json. Verifica que el archivo exista en apps/backend.',
        error,
      );
      // Mazo de respaldo por si el archivo falla
      return [{ word: 'Error', forbidden: ['Falta', 'Archivo', 'JSON'] }];
    }
  }

  createRoom(hostId: string): string {
    // Generar un código aleatorio de 4 letras (A-Z)
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
    return roomCode;
  }

  startGame(roomCode: string, roundsMultiplier: number = 1): RoomState | null {
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

    const maxTeamSize = Math.max(teamA.length, teamB.length);
    const totalTurns = maxTeamSize * 2 * roundsMultiplier;

    const deck = this.getDeck();
    const randomCard = deck[Math.floor(Math.random() * deck.length)];

    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      speakerId: teamA[0]?.id || null,
      judgeId: teamB[0]?.id || null,
      currentCard: randomCard,
      status: 'WAITING',
      timeLeft: 60,
      teamASpeakerIndex: 0,
      teamBSpeakerIndex: 0,
      totalTurns,
      turnsPlayed: 0,
    };

    return room;
  }

  handleCardAction(
    roomCode: string,
    action: 'SUCCESS' | 'PASS' | 'FOUL',
  ): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.mode !== 'MIMIRETO' || !room.mimireto) return null;

    const state = room.mimireto;

    if (action === 'SUCCESS') {
      if (state.currentTurn === 'A') state.teamAScore += 1;
      else state.teamBScore += 1;
    } else if (action === 'FOUL') {
      if (state.currentTurn === 'A') state.teamAScore -= 1;
      else state.teamBScore -= 1;
    }

    // ACTUALIZADO: Cargamos el mazo usando la función
    const deck = this.getDeck();
    let nextCard;
    do {
      nextCard = deck[Math.floor(Math.random() * deck.length)];
    } while (
      state.currentCard &&
      nextCard.word === state.currentCard.word &&
      deck.length > 1
    );

    state.currentCard = nextCard;

    return room;
  }

  rotateTurn(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room || !room.mimireto) return null;

    const state = room.mimireto;
    state.turnsPlayed += 1;

    if (state.turnsPlayed >= state.totalTurns) {
      state.status = 'FINISHED';
      return room;
    }

    const teamA = room.players.filter((p) => p.team === 'A');
    const teamB = room.players.filter((p) => p.team === 'B');

    state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';

    if (state.currentTurn === 'A') {
      state.teamASpeakerIndex = (state.teamASpeakerIndex + 1) % teamA.length;
      state.speakerId = teamA[state.teamASpeakerIndex]?.id || null;
      state.judgeId = teamB[state.teamBSpeakerIndex]?.id || null;
    } else {
      state.teamBSpeakerIndex = (state.teamBSpeakerIndex + 1) % teamB.length;
      state.speakerId = teamB[state.teamBSpeakerIndex]?.id || null;
      state.judgeId = teamA[state.teamASpeakerIndex]?.id || null;
    }

    state.status = 'TIME_UP';
    state.timeLeft = 60;

    // ACTUALIZADO: Cargamos el mazo usando la función
    const deck = this.getDeck();
    const nextCard = deck[Math.floor(Math.random() * deck.length)];
    state.currentCard = nextCard;

    return room;
  }

  joinRoom(roomCode: string, player: Player): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Buscar si ya existe un jugador con exactamente el mismo nombre (ignorando mayúsculas)
    const existingPlayer = room.players.find(
      (p) => p.name.toLowerCase() === player.name.toLowerCase(),
    );

    if (existingPlayer) {
      // ¡Reconexión! Actualizamos su ID de socket y lo marcamos conectado
      existingPlayer.id = player.id;
      existingPlayer.connected = true;

      // Actualizamos los roles en el estado de Mimireto si era él
      if (room.mimireto) {
        if (room.mimireto.speakerId === existingPlayer.id)
          room.mimireto.speakerId = player.id;
        if (room.mimireto.judgeId === existingPlayer.id)
          room.mimireto.judgeId = player.id;
      }
    } else {
      // Jugador nuevo
      player.connected = true;
      room.players.push(player);
    }

    return room;
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  removePlayer(socketId: string) {
    let affectedRoomCode = null;

    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.id === socketId);

      if (player) {
        player.connected = false;
        affectedRoomCode = roomCode;

        // Si estamos jugando y se desconecta un jugador clave, pausamos la partida
        if (room.mimireto && room.mimireto.status === 'PLAYING') {
          if (
            room.mimireto.speakerId === socketId ||
            room.mimireto.judgeId === socketId
          ) {
            room.mimireto.status = 'PAUSED';
          }
        }

        // Opcional: Si el lobby está en modo LOBBY y todos se van, limpiamos la sala (lo omitimos por simplicidad del MVP)
      }
    }
    return affectedRoomCode;
  }
}
