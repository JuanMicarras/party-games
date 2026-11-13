import { describe, it, expect, beforeEach } from 'vitest';
import { DeckService } from './deck.service.js';
import { CuentoChinoDeckService } from './cuento-chino-deck.service.js';
import { MimiretoService } from './mimireto.service.js';
import { CuentoChinoService } from './cuento-chino.service.js';
import { RoomService } from './room.service.js';
import {
  validateMimiretoDeck,
  validateCuentoChinoDeck,
} from '@party-games/shared';

describe('Sistema de Categorías y Mazos Personalizados', () => {
  let deckService: DeckService;
  let cuentoChinoDeckService: CuentoChinoDeckService;
  let mimiretoService: MimiretoService;
  let cuentoChinoService: CuentoChinoService;
  let roomService: RoomService;

  beforeEach(() => {
    deckService = new DeckService();
    deckService.onModuleInit();

    cuentoChinoDeckService = new CuentoChinoDeckService();
    cuentoChinoDeckService.onModuleInit();

    mimiretoService = new MimiretoService(deckService);
    cuentoChinoService = new CuentoChinoService(cuentoChinoDeckService);
    roomService = new RoomService(mimiretoService, cuentoChinoService);
  });

  it('carga las categorías base de Mimireto y Cuento Chino al iniciar', () => {
    const mimiCats = deckService.getCategories();
    const ccCats = cuentoChinoDeckService.getCategories();

    expect(mimiCats.map((c) => c.id)).toEqual(
      expect.arrayContaining(['biblico', 'cultura-pop', 'general', 'amigos']),
    );
    expect(ccCats.map((c) => c.id)).toEqual(
      expect.arrayContaining(['biblico', 'cultura-pop', 'general', 'amigos']),
    );

    const popMimi = mimiCats.find((c) => c.id === 'cultura-pop');
    expect(popMimi?.count).toBeGreaterThanOrEqual(30);

    const genCC = ccCats.find((c) => c.id === 'general');
    expect(genCC?.count).toBeGreaterThanOrEqual(15);
  });

  it('incluye availableCategories al crear una sala', () => {
    const code = roomService.createRoom('host-1');
    const room = roomService.getRoom(code);

    expect(room).toBeDefined();
    expect(room?.availableCategories?.mimireto.length).toBeGreaterThanOrEqual(4);
    expect(room?.availableCategories?.cuentoChino.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it('inicia Mimireto con una categoría seleccionada (ej: cultura-pop)', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const popCards = deckService.getDeckByCategory('cultura-pop');
    const popWords = new Set(popCards.map((c) => c.word));

    const updated = roomService.startGame(code, 'MIMIRETO', {
      roundsMultiplier: 1,
      category: 'cultura-pop',
    });

    expect(updated?.mimireto?.categoryId).toBe('cultura-pop');
    expect(updated?.mimireto?.categoryName).toContain('Cultura Pop');
    expect(popWords.has(updated?.mimireto?.currentCard?.word || '')).toBe(true);
  });

  it('inicia Mimireto con un mazo personalizado en memoria', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const customDeck = [
      { word: 'UNICORNIO', forbidden: ['CABALLO', 'CUERNO', 'MÁGICO'] },
      { word: 'DRAGÓN', forbidden: ['FUEGO', 'ALAS', 'ESCAMAS'] },
    ];

    const updated = roomService.startGame(code, 'MIMIRETO', {
      roundsMultiplier: 1,
      category: 'custom',
      customCategoryName: 'Fantasía Épica',
      customMimiretoDeck: customDeck,
    });

    expect(updated?.mimireto?.categoryId).toBe('custom');
    expect(updated?.mimireto?.categoryName).toBe('⚡ Fantasía Épica');
    expect(['UNICORNIO', 'DRAGÓN']).toContain(
      updated?.mimireto?.currentCard?.word,
    );
  });

  it('no repite ninguna carta en Mimireto hasta haber jugado todo el mazo', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const customDeck = [
      { word: 'CARTA 1', forbidden: ['A'] },
      { word: 'CARTA 2', forbidden: ['B'] },
      { word: 'CARTA 3', forbidden: ['C'] },
      { word: 'CARTA 4', forbidden: ['D'] },
      { word: 'CARTA 5', forbidden: ['E'] },
      { word: 'CARTA 6', forbidden: ['F'] },
      { word: 'CARTA 7', forbidden: ['G'] },
      { word: 'CARTA 8', forbidden: ['H'] },
    ];

    const room = roomService.startGame(code, 'MIMIRETO', {
      roundsMultiplier: 1,
      category: 'custom',
      customMimiretoDeck: customDeck,
    })!;

    // Poner la partida en PLAYING para poder pasar/acertar cartas
    room.mimireto!.status = 'PLAYING';
    const speakerId = room.mimireto!.speakerId!;

    const seenWords = new Set<string>();
    seenWords.add(room.mimireto!.currentCard!.word);

    // Robar las 7 cartas restantes (total 8 cartas de un mazo de 8)
    for (let i = 0; i < 7; i++) {
      roomService.handleCardAction(code, speakerId, 'SUCCESS');
      seenWords.add(room.mimireto!.currentCard!.word);
    }

    // Las 8 cartas vistas deben ser estrictamente las 8 cartas únicas sin ninguna repetición
    expect(seenWords.size).toBe(8);

    // Al robar la 9na carta (mazo agotado), se rebaraja automáticamente y no repite la 8va carta inmediatamente
    const eighthWord = room.mimireto!.currentCard!.word;
    roomService.handleCardAction(code, speakerId, 'PASS');
    const ninthWord = room.mimireto!.currentCard!.word;
    expect(ninthWord).toBeDefined();
    expect(ninthWord).not.toBe(eighthWord);
  });

  it('inicia Cuento Chino con un mazo personalizado en memoria', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const customQuestions = [
      {
        id: 'q1',
        question: 'El plato favorito de Pedro es _____.',
        reference: 'Amigos',
        correctAnswer: 'bandeja paisa',
        acceptedAnswers: ['bandeja paisa'],
        defaultLies: ['sushi', 'pizza', 'tacos'],
      },
    ];

    const updated = roomService.startGame(code, 'CUENTO_CHINO', {
      totalQuestions: 3,
      category: 'custom',
      customCategoryName: 'Cumpleaños de Pedro',
      customCuentoChinoDeck: customQuestions,
    });

    expect(updated?.cuentoChino?.categoryId).toBe('custom');
    expect(updated?.cuentoChino?.categoryName).toBe('⚡ Cumpleaños de Pedro');
    expect(updated?.cuentoChino?.currentQuestion?.correctAnswer).toBe(
      'bandeja paisa',
    );
  });

  it('valida correctamente mazos personalizados válidos e inválidos', () => {
    const badMimi = validateMimiretoDeck([{ word: 'SOLO PALABRA' }]);
    expect(badMimi.valid).toBe(false);

    const goodMimi = validateMimiretoDeck([
      { word: 'sol', forbidden: ['calor', 'día'] },
    ]);
    expect(goodMimi.valid).toBe(true);
    expect(goodMimi.cards[0].word).toBe('SOL');
    expect(goodMimi.cards[0].forbidden).toEqual(['CALOR', 'DÍA']);

    const badCC = validateCuentoChinoDeck([{ question: 'Incompleta' }]);
    expect(badCC.valid).toBe(false);

    const goodCC = validateCuentoChinoDeck([
      {
        question: 'La capital de Francia es _____.',
        correctAnswer: 'París',
        defaultLies: ['Londres', 'Roma', 'Madrid'],
      },
    ]);
    expect(goodCC.valid).toBe(true);
    expect(goodCC.questions[0].acceptedAnswers).toContain('París');
  });

  it('aplica turnDuration configurado en Mimireto en el inicio y al rotar turno', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const room = roomService.startGame(code, 'MIMIRETO', {
      roundsMultiplier: 1,
      turnDuration: 45,
    })!;

    expect(room.mimireto?.turnDuration).toBe(45);
    expect(room.mimireto?.timeLeft).toBe(45);

    // Rotar turno
    const rotated = roomService.rotateTurn(code)!;
    expect(rotated.mimireto?.timeLeft).toBe(45);
  });

  it('no repite preguntas en Cuento Chino entre partidas consecutivas hasta agotar el banco', () => {
    const code = roomService.createRoom('host-1');
    roomService.joinRoom(code, { id: 'p1', name: 'Ana', isHost: false });
    roomService.joinRoom(code, { id: 'p2', name: 'Luis', isHost: false });

    const customQuestions = [
      {
        id: 'q1',
        question: 'Pregunta 1',
        correctAnswer: 'R1',
        defaultLies: ['M1'],
      },
      {
        id: 'q2',
        question: 'Pregunta 2',
        correctAnswer: 'R2',
        defaultLies: ['M2'],
      },
      {
        id: 'q3',
        question: 'Pregunta 3',
        correctAnswer: 'R3',
        defaultLies: ['M3'],
      },
      {
        id: 'q4',
        question: 'Pregunta 4',
        correctAnswer: 'R4',
        defaultLies: ['M4'],
      },
    ];

    // Partida 1: 2 preguntas
    const g1 = roomService.startGame(code, 'CUENTO_CHINO', {
      totalQuestions: 2,
      category: 'custom',
      customCuentoChinoDeck: customQuestions,
      writingTime: 30,
    })!;

    expect(g1.cuentoChino?.writingTime).toBe(30);
    expect(g1.cuentoChino?.timeLeft).toBe(30);

    const questionsG1 = [g1.cuentoChino!.currentQuestion!.id];
    const g1q2 = roomService.nextQuestion(code)!;
    questionsG1.push(g1q2.cuentoChino!.currentQuestion!.id);

    expect(questionsG1[0]).not.toBe(questionsG1[1]);

    // Partida 2 en la misma sala: las siguientes 2 preguntas deben ser las restantes
    const g2 = roomService.startGame(code, 'CUENTO_CHINO', {
      totalQuestions: 2,
      category: 'custom',
    })!;

    const questionsG2 = [g2.cuentoChino!.currentQuestion!.id];
    const g2q2 = roomService.nextQuestion(code)!;
    questionsG2.push(g2q2.cuentoChino!.currentQuestion!.id);

    const allSeen = new Set([...questionsG1, ...questionsG2]);
    // Las 4 preguntas jugadas deben ser estrictamente las 4 diferentes
    expect(allSeen.size).toBe(4);
  });
});
