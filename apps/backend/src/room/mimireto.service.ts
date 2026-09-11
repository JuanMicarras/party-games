import { Injectable, Logger } from '@nestjs/common';
import { RoomState, Player, MimiretoState } from '@party-games/shared';
import { DeckService } from './deck.service.js';

@Injectable()
export class MimiretoService {
  private readonly logger = new Logger(MimiretoService.name);

  constructor(private readonly deckService: DeckService) {}

  initGame(room: RoomState, roundsMultiplier: number = 1): RoomState | null {
    if (room.players.length < 2) return null;

    room.mode = 'MIMIRETO';

    // Mezclar jugadores aleatoriamente
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
    const initialCard = this.deckService.getRandomCard();

    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      speakerId: teamA[0]?.id || null,
      judgeId: teamB[0]?.id || null,
      currentCard: initialCard,
      status: 'WAITING',
      timeLeft: 60,
      teamASpeakerIndex: 0,
      teamBSpeakerIndex: 0,
      totalTurns,
      turnsPlayed: 0,
    };

    this.logger.log(
      `🎲 Juego Mimireto iniciado en sala ${room.roomCode}: ${teamA.length} en A vs ${teamB.length} en B. Turnos totales: ${totalTurns}`,
    );

    return room;
  }

  handleCardAction(
    room: RoomState,
    socketId: string,
    action: 'SUCCESS' | 'PASS' | 'FOUL',
  ): RoomState | null {
    if (room.mode !== 'MIMIRETO' || !room.mimireto) return null;

    const state = room.mimireto;

    // REGLA CRÍTICA: Solo se permite puntuar o pasar si el estado es estrictamente 'PLAYING'
    if (state.status !== 'PLAYING') {
      this.logger.warn(
        `⛔ Acción de carta [${action}] rechazada en sala ${room.roomCode}: el juego está en estado '${state.status}'`,
      );
      return null;
    }

    // Validación de roles: Solo el Orador puede enviar SUCCESS o PASS; solo el Juez puede enviar FOUL
    if (action === 'SUCCESS' || action === 'PASS') {
      if (state.speakerId && state.speakerId !== socketId) {
        this.logger.warn(
          `⛔ Jugador ${socketId} intentó ${action} pero no es el orador (${state.speakerId})`,
        );
        return null;
      }
    } else if (action === 'FOUL') {
      if (state.judgeId && state.judgeId !== socketId) {
        this.logger.warn(
          `⛔ Jugador ${socketId} intentó ${action} pero no es el juez (${state.judgeId})`,
        );
        return null;
      }
    }

    if (action === 'SUCCESS') {
      if (state.currentTurn === 'A') state.teamAScore += 1;
      else state.teamBScore += 1;
    } else if (action === 'FOUL') {
      if (state.currentTurn === 'A') state.teamAScore -= 1;
      else state.teamBScore -= 1;
    }

    // Siguiente carta sin repetir la actual
    state.currentCard = this.deckService.getNextCardExcept(
      state.currentCard?.word,
    );

    return room;
  }

  rotateTurn(room: RoomState): RoomState | null {
    if (!room.mimireto) return null;

    const state = room.mimireto;
    state.turnsPlayed += 1;

    if (state.turnsPlayed >= state.totalTurns) {
      state.status = 'FINISHED';
      return room;
    }

    const teamA = room.players.filter((p: Player) => p.team === 'A');
    const teamB = room.players.filter((p: Player) => p.team === 'B');

    state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';

    if (state.currentTurn === 'A') {
      state.teamASpeakerIndex = (state.teamASpeakerIndex + 1) % (teamA.length || 1);
      state.speakerId = teamA[state.teamASpeakerIndex]?.id || null;
      state.judgeId = teamB[state.teamBSpeakerIndex]?.id || null;
    } else {
      state.teamBSpeakerIndex = (state.teamBSpeakerIndex + 1) % (teamB.length || 1);
      state.speakerId = teamB[state.teamBSpeakerIndex]?.id || null;
      state.judgeId = teamA[state.teamASpeakerIndex]?.id || null;
    }

    state.status = 'TIME_UP';
    state.timeLeft = 60;
    state.currentCard = this.deckService.getNextCardExcept(
      state.currentCard?.word,
    );

    return room;
  }
}
