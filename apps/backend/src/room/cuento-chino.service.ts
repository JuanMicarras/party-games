import { Injectable, Logger } from '@nestjs/common';
import {
  RoomState,
  Player,
  CuentoChinoQuestion,
  CuentoChinoOption,
  CuentoChinoState,
  RoundEvent,
} from '@party-games/shared';
import { CuentoChinoDeckService } from './cuento-chino-deck.service.js';

export function normalizeText(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

@Injectable()
export class CuentoChinoService {
  private readonly logger = new Logger(CuentoChinoService.name);
  private gameQuestions: Map<string, CuentoChinoQuestion[]> = new Map();

  constructor(private readonly deckService: CuentoChinoDeckService) {}

  initGame(room: RoomState, totalQuestions: number = 3): RoomState | null {
    if (room.players.length < 2) return null;

    room.mode = 'CUENTO_CHINO';

    const questions = this.deckService.getRandomQuestions(totalQuestions);
    this.gameQuestions.set(room.roomCode, questions);

    const initialScores: Record<string, number> = {};
    room.players.forEach((p) => {
      initialScores[p.id] = 0;
    });

    const currentQuestion = questions[0] || null;

    room.cuentoChino = {
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      currentQuestion,
      status: 'WRITING_LIES',
      timeLeft: 45,
      submittedLies: {},
      sabioPlayerIds: [],
      options: [],
      votes: {},
      scores: initialScores,
      roundEvents: [],
    };

    this.logger.log(
      `🤥 Partida de Cuento Chino iniciada en sala ${room.roomCode} con ${questions.length} preguntas.`,
    );

    return room;
  }

  submitLie(
    room: RoomState,
    playerId: string,
    rawLie: string,
  ): {
    status: 'ACCEPTED' | 'SABIO' | 'DUPLICATE';
    message: string;
    isSabio?: boolean;
    allSubmitted?: boolean;
  } {
    if (room.mode !== 'CUENTO_CHINO' || !room.cuentoChino) {
      return { status: 'DUPLICATE', message: 'No hay partida en curso' };
    }

    const state = room.cuentoChino;
    if (state.status !== 'WRITING_LIES') {
      return {
        status: 'DUPLICATE',
        message: 'La fase de escribir mentiras ha finalizado.',
      };
    }

    const question = state.currentQuestion;
    if (!question) {
      return { status: 'DUPLICATE', message: 'No hay pregunta activa.' };
    }

    const cleaned = rawLie.trim().toLowerCase();
    const normalizedInput = normalizeText(rawLie);
    const normalizedCorrect = normalizeText(question.correctAnswer);
    const normalizedAccepted = question.acceptedAnswers.map((a) =>
      normalizeText(a),
    );

    const isMatchWithCorrect =
      normalizedInput === normalizedCorrect ||
      normalizedAccepted.includes(normalizedInput);

    // CASO SABIO: El jugador acertó la respuesta bíblica real
    if (isMatchWithCorrect) {
      const alreadySabio = state.sabioPlayerIds.includes(playerId);
      if (!alreadySabio) {
        state.sabioPlayerIds.push(playerId);
        state.scores[playerId] = (state.scores[playerId] || 0) + 2;
        this.logger.log(
          `🌟 ¡Jugador ${playerId} es Sabio Bíblico en sala ${room.roomCode}! (+2 pts bonus)`,
        );
      }

      return {
        status: 'SABIO',
        isSabio: true,
        message:
          '¡Increíble! ¡Esa es la respuesta real de la Biblia! Ganaste +2 puntos. Ahora escribe una mentira creíble para engañar a tus amigos.',
      };
    }

    // Guardar la mentira en minúsculas unificadas
    state.submittedLies[playerId] = cleaned;

    // Verificar si todos los jugadores conectados han enviado su mentira
    const connectedPlayers = room.players.filter((p) => p.connected !== false);
    const allSubmitted = connectedPlayers.every(
      (p) => state.submittedLies[p.id] !== undefined,
    );

    return {
      status: 'ACCEPTED',
      isSabio: false,
      message: 'Mentira registrada exitosamente.',
      allSubmitted,
    };
  }

  startVotingPhase(room: RoomState): RoomState | null {
    if (room.mode !== 'CUENTO_CHINO' || !room.cuentoChino) return null;
    const state = room.cuentoChino;
    const question = state.currentQuestion;
    if (!question) return null;

    const optionsMap: Map<string, CuentoChinoOption> = new Map();

    // 1. Agregar la respuesta correcta real (unificada en minúsculas)
    const correctText = question.correctAnswer.toLowerCase().trim();
    optionsMap.set(normalizeText(correctText), {
      id: 'opt-correct',
      text: correctText,
      authorId: null,
      isCorrect: true,
      isSabioLie: false,
    });

    // 2. Agregar las mentiras escritas por los jugadores
    for (const [authorId, lieText] of Object.entries(state.submittedLies)) {
      const norm = normalizeText(lieText);
      // No agregar si por alguna razón coincide con la correcta
      if (optionsMap.has(norm)) continue;

      const isSabio = state.sabioPlayerIds.includes(authorId);
      optionsMap.set(norm, {
        id: `opt-${authorId}`,
        text: lieText.toLowerCase().trim(),
        authorId,
        isCorrect: false,
        isSabioLie: isSabio, // Marca especial: mentira de un sabio
      });
    }

    // 3. Rellenar con mentiras por defecto si hay menos de 4 opciones
    let defaultIndex = 0;
    while (optionsMap.size < 4 && defaultIndex < question.defaultLies.length) {
      const defLie = question.defaultLies[defaultIndex].toLowerCase().trim();
      const norm = normalizeText(defLie);
      if (!optionsMap.has(norm)) {
        optionsMap.set(norm, {
          id: `opt-def-${defaultIndex}`,
          text: defLie,
          authorId: null,
          isCorrect: false,
          isSabioLie: false,
        });
      }
      defaultIndex++;
    }

    // Mezclar las opciones aleatoriamente
    state.options = Array.from(optionsMap.values()).sort(
      () => Math.random() - 0.5,
    );
    state.status = 'VOTING';
    state.timeLeft = 30;
    state.votes = {};

    this.logger.log(
      `🗳️ Fase de votación iniciada en sala ${room.roomCode} con ${state.options.length} opciones.`,
    );

    return room;
  }

  submitVote(
    room: RoomState,
    playerId: string,
    optionId: string,
  ): { success: boolean; allVoted?: boolean } {
    if (room.mode !== 'CUENTO_CHINO' || !room.cuentoChino) {
      return { success: false };
    }

    const state = room.cuentoChino;
    if (state.status !== 'VOTING') return { success: false };

    // Regla: Los sabios NO votan (ya cobraron sus puntos y conocen la verdad)
    if (state.sabioPlayerIds.includes(playerId)) {
      this.logger.warn(
        `⛔ Sabio ${playerId} intentó votar, pero no tiene permitido participar en la votación.`,
      );
      return { success: false };
    }

    // Encontrar opción
    const option = state.options.find((o) => o.id === optionId);
    if (!option) return { success: false };

    // Regla anti-auto-voto: no se puede votar por la propia mentira
    if (option.authorId === playerId) {
      this.logger.warn(`⛔ Jugador ${playerId} intentó votar por su propia mentira.`);
      return { success: false };
    }

    state.votes[playerId] = optionId;

    // Verificar si todos los jugadores con derecho a voto (no sabios) han votado
    const eligibleVoters = room.players.filter(
      (p) => p.connected !== false && !state.sabioPlayerIds.includes(p.id),
    );
    const allVoted = eligibleVoters.every((p) => state.votes[p.id] !== undefined);

    return { success: true, allVoted };
  }

  revealResults(room: RoomState): RoomState | null {
    if (room.mode !== 'CUENTO_CHINO' || !room.cuentoChino) return null;

    const state = room.cuentoChino;
    const roundEvents: RoundEvent[] = [];

    for (const [voterId, optionId] of Object.entries(state.votes)) {
      const voter = room.players.find((p) => p.id === voterId);
      const voterName = voter?.name || 'Jugador';
      const option = state.options.find((o) => o.id === optionId);

      if (!option) continue;

      if (option.isCorrect) {
        // Acierto de la verdad: +3 puntos al votante
        state.scores[voterId] = (state.scores[voterId] || 0) + 3;
        roundEvents.push({
          voterId,
          voterName,
          optionText: option.text,
          result: 'CORRECT',
          pointsDelta: +3,
        });
      } else if (option.isSabioLie) {
        // TRAMPA DEL SABIO: Resta 1 punto al votante, no suma al sabio
        state.scores[voterId] = (state.scores[voterId] || 0) - 1;
        const author = room.players.find((p) => p.id === option.authorId);
        roundEvents.push({
          voterId,
          voterName,
          optionText: option.text,
          result: 'FOOLED_BY_SABIO',
          authorName: author?.name || 'El Sabio',
          pointsDelta: -1,
        });
      } else if (option.authorId) {
        // Mentira de un jugador regular: +1 punto para el autor de la mentira
        state.scores[option.authorId] = (state.scores[option.authorId] || 0) + 1;
        const author = room.players.find((p) => p.id === option.authorId);
        roundEvents.push({
          voterId,
          voterName,
          optionText: option.text,
          result: 'FOOLED_BY_PLAYER',
          authorName: author?.name || 'Alguien',
          pointsDelta: 0,
        });
      } else {
        // Mentira del sistema
        roundEvents.push({
          voterId,
          voterName,
          optionText: option.text,
          result: 'DEFAULT_LIE',
          pointsDelta: 0,
        });
      }
    }

    state.roundEvents = roundEvents;
    state.status = 'REVEALING';
    state.timeLeft = 15;

    this.logger.log(`🎉 Resultados revelados en sala ${room.roomCode}.`);
    return room;
  }

  nextQuestion(room: RoomState): RoomState | null {
    if (room.mode !== 'CUENTO_CHINO' || !room.cuentoChino) return null;

    const state = room.cuentoChino;
    const questions = this.gameQuestions.get(room.roomCode) || [];
    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      state.status = 'FINISHED';
      return room;
    }

    state.currentQuestionIndex = nextIndex;
    state.currentQuestion = questions[nextIndex];
    state.status = 'WRITING_LIES';
    state.timeLeft = 45;
    state.submittedLies = {};
    state.sabioPlayerIds = [];
    state.options = [];
    state.votes = {};
    state.roundEvents = [];

    return room;
  }
}
