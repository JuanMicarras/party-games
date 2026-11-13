import { Injectable, Logger } from '@nestjs/common';
import {
  RoomState,
  Player,
  MimiretoCard,
  CategoryInfo,
  validateMimiretoDeck,
} from '@party-games/shared';
import { DeckService } from './deck.service.js';

interface RoomDeckState {
  drawPile: MimiretoCard[];
  discardPile: MimiretoCard[];
}

function shuffleCards(cards: MimiretoCard[]): MimiretoCard[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable()
export class MimiretoService {
  private readonly logger = new Logger(MimiretoService.name);
  private roomDeckStates: Map<string, RoomDeckState> = new Map();

  constructor(private readonly deckService: DeckService) {}

  getCategories(): CategoryInfo[] {
    return this.deckService.getCategories();
  }

  private drawNextCard(
    roomCode: string,
    categoryId?: string,
    currentWord?: string,
  ): MimiretoCard {
    let deckState = this.roomDeckStates.get(roomCode);

    if (!deckState) {
      const baseDeck = this.deckService.getDeckByCategory(categoryId);
      deckState = {
        drawPile: shuffleCards(baseDeck),
        discardPile: [],
      };
      this.roomDeckStates.set(roomCode, deckState);
    }

    // Si ya se jugaron todas las cartas del mazo, rebarajar el descarte
    if (deckState.drawPile.length === 0) {
      if (deckState.discardPile.length === 0) {
        return { word: 'SIN CARTAS', forbidden: ['MAZO', 'VACÍO'] };
      }

      const reshuffled = shuffleCards(deckState.discardPile);
      // Evitar que la última carta vista sea justo la primera del nuevo ciclo
      if (
        reshuffled.length > 1 &&
        currentWord &&
        reshuffled[reshuffled.length - 1].word === currentWord
      ) {
        [reshuffled[0], reshuffled[reshuffled.length - 1]] = [
          reshuffled[reshuffled.length - 1],
          reshuffled[0],
        ];
      }

      deckState.drawPile = reshuffled;
      deckState.discardPile = [];
      this.logger.log(
        `♻️ Se agotaron las cartas en sala ${roomCode}. Mazo rebarajado (${deckState.drawPile.length} cartas).`,
      );
    }

    const nextCard = deckState.drawPile.pop()!;
    deckState.discardPile.push(nextCard);
    return nextCard;
  }

  initGame(
    room: RoomState,
    roundsMultiplier: number = 1,
    options?: {
      category?: string;
      customCategoryName?: string;
      customDeck?: MimiretoCard[];
    },
  ): RoomState | null {
    if (room.players.length < 2) return null;

    room.mode = 'MIMIRETO';

    let deck: MimiretoCard[];
    let categoryId = options?.category || 'biblico';
    let categoryName = '📖 Bíblico / Célula';

    if (options?.customDeck && options.customDeck.length > 0) {
      const validation = validateMimiretoDeck(options.customDeck);
      if (validation.valid && validation.cards.length > 0) {
        deck = validation.cards;
        categoryId = 'custom';
        categoryName = options.customCategoryName?.trim()
          ? `⚡ ${options.customCategoryName.trim()}`
          : '⚡ Mazo Personalizado';
      } else {
        deck = this.deckService.getDeckByCategory(categoryId);
      }
    } else {
      deck = this.deckService.getDeckByCategory(categoryId);
      const info = this.deckService.getCategoryInfo(categoryId);
      if (info) {
        categoryId = info.id;
        categoryName = `${info.icon} ${info.name}`;
      }
    }

    // Deduplicar palabras por si el mazo origen tuviera alguna repetida y barajar con Fisher-Yates
    const seenWords = new Set<string>();
    const uniqueDeck = deck.filter((card) => {
      const key = card.word.trim().toUpperCase();
      if (seenWords.has(key)) return false;
      seenWords.add(key);
      return true;
    });

    this.roomDeckStates.set(room.roomCode, {
      drawPile: shuffleCards(uniqueDeck),
      discardPile: [],
    });

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
    const initialCard = this.drawNextCard(room.roomCode, categoryId);

    room.mimireto = {
      teamAScore: 0,
      teamBScore: 0,
      currentTurn: 'A',
      speakerId: teamAPlayerIds[0] || null,
      judgeId: teamBPlayerIds[0] || null,
      currentCard: initialCard,
      status: 'WAITING',
      timeLeft: 60,
      teamASpeakerIndex: 0,
      teamBSpeakerIndex: 0,
      totalTurns,
      turnsPlayed: 0,
      teamAPlayerIds,
      teamBPlayerIds,
      categoryId,
      categoryName,
    };

    this.logger.log(
      `🎲 Juego Mimireto [${categoryName}] iniciado en sala ${room.roomCode}: ${teamA.length} en A vs ${teamB.length} en B. Turnos totales: ${totalTurns}`,
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

    // Robar siguiente carta de la baraja de la sala sin repetir cartas ya jugadas
    state.currentCard = this.drawNextCard(
      room.roomCode,
      state.categoryId,
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
      this.roomDeckStates.delete(room.roomCode);
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
    state.timeLeft = 120;
    state.currentCard = this.drawNextCard(
      room.roomCode,
      state.categoryId,
      state.currentCard?.word,
    );

    this.logger.log(
      `🔄 Turno ${state.turnsPlayed}/${state.totalTurns} en sala ${room.roomCode}. Turno Equipo ${state.currentTurn}: Orador=${state.speakerId}, Juez=${state.judgeId}`,
    );

    return room;
  }
}
