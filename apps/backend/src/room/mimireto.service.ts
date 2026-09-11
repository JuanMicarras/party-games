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

    const teamAPlayerIds = teamA.map((p) => p.id);
    const teamBPlayerIds = teamB.map((p) => p.id);

    const maxTeamSize = Math.max(teamA.length, teamB.length);
    const totalTurns = maxTeamSize * 2 * roundsMultiplier;
    const initialCard = this.deckService.getRandomCard();

    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      speakerId: teamAPlayerIds[0] || null,
      judgeId: teamBPlayerIds[0] || null,
      currentCard: initialCard,
      status: 'WAITING',
      timeLeft: 3,
      teamASpeakerIndex: 0,
      teamBSpeakerIndex: 0,
      totalTurns,
      turnsPlayed: 0,
      teamAPlayerIds,
      teamBPlayerIds,
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

    // Resolver los jugadores de cada equipo preservando estrictamente el orden establecido al inicio
    const teamAPlayers = (state.teamAPlayerIds || [])
      .map((id) => room.players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const resolvedTeamA =
      teamAPlayers.length > 0
        ? teamAPlayers
        : room.players.filter((p: Player) => p.team === 'A');

    const teamBPlayers = (state.teamBPlayerIds || [])
      .map((id) => room.players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const resolvedTeamB =
      teamBPlayers.length > 0
        ? teamBPlayers
        : room.players.filter((p: Player) => p.team === 'B');

    // Alternar turno entre equipos: A -> B -> A -> B ...
    state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';

    // Número de turnos completados por el equipo que va a jugar:
    // Turno 0 del juego (A): floor(0/2) = 0
    // Turno 1 del juego (B): floor(1/2) = 0
    // Turno 2 del juego (A): floor(2/2) = 1
    // Turno 3 del juego (B): floor(3/2) = 1
    // Turno 4 del juego (A): floor(4/2) = 2
    // Turno 5 del juego (B): floor(5/2) = 2
    // Esto garantiza que cada integrante del equipo sea orador al menos una vez antes de repetir.
    const teamTurnNumber = Math.floor(state.turnsPlayed / 2);

    if (state.currentTurn === 'A') {
      state.teamASpeakerIndex = teamTurnNumber % (resolvedTeamA.length || 1);
      state.teamBSpeakerIndex = teamTurnNumber % (resolvedTeamB.length || 1);
      state.speakerId = resolvedTeamA[state.teamASpeakerIndex]?.id || null;
      state.judgeId = resolvedTeamB[state.teamBSpeakerIndex]?.id || null;
    } else {
      state.teamBSpeakerIndex = teamTurnNumber % (resolvedTeamB.length || 1);
      state.teamASpeakerIndex = teamTurnNumber % (resolvedTeamA.length || 1);
      state.speakerId = resolvedTeamB[state.teamBSpeakerIndex]?.id || null;
      state.judgeId = resolvedTeamA[state.teamASpeakerIndex]?.id || null;
    }

    state.status = 'TIME_UP';
    state.timeLeft = 3;
    state.currentCard = this.deckService.getNextCardExcept(
      state.currentCard?.word,
    );

    this.logger.log(
      `🔄 Turno ${state.turnsPlayed}/${state.totalTurns} en sala ${room.roomCode}. Turno Equipo ${state.currentTurn}: Orador=${state.speakerId}, Juez=${state.judgeId}`,
    );

    return room;
  }
}
