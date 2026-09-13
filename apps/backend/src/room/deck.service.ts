import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MimiretoCard } from '@party-games/shared';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

@Injectable()
export class DeckService implements OnModuleInit {
  private readonly logger = new Logger(DeckService.name);
  private deck: MimiretoCard[] = [];

  onModuleInit() {
    this.loadDeck();
  }

  private loadDeck() {
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const candidates = [
        path.join(currentDir, 'data', 'cartas-sofia.json'),
        path.join(process.cwd(), 'src', 'room', 'data', 'cartas-sofia.json'),
        path.join(process.cwd(), 'dist', 'room', 'data', 'cartas-sofia.json'),
      ];

      const foundPath = candidates.find((p) => fs.existsSync(p));
      if (!foundPath) {
        throw new Error(
          `No se encontró cartas.json en ninguna de las rutas: ${candidates.join(', ')}`,
        );
      }

      const fileData = fs.readFileSync(foundPath, 'utf-8');
      const parsed: MimiretoCard[] = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.deck = parsed;
        this.logger.log(
          `🃏 Mazo de Mimireto cargado exitosamente en memoria (${this.deck.length} cartas).`,
        );
      } else {
        throw new Error('El archivo cartas.json está vacío o no es un arreglo válido.');
      }
    } catch (error) {
      this.logger.error(
        'Error cargando cartas.json. Usando mazo de respaldo en memoria.',
        error,
      );
      this.deck = [
        {
          word: 'MOISÉS',
          forbidden: ['EGIPTO', 'MAR', 'MANDAMIENTOS', 'FARAÓN', 'TABLAS'],
        },
        {
          word: 'NOÉ',
          forbidden: ['ARCA', 'DILUVIO', 'ANIMALES', 'LLUVIA', 'PACTO'],
        },
        {
          word: 'DAVID',
          forbidden: ['GOLIAT', 'REY', 'HONDA', 'PIEDRA', 'SALMOS'],
        },
      ];
    }
  }

  getRandomCard(): MimiretoCard {
    if (this.deck.length === 0) {
      return { word: 'Sin Cartas', forbidden: ['Error', 'Mazo', 'Vacío'] };
    }
    const index = Math.floor(Math.random() * this.deck.length);
    return this.deck[index];
  }

  getNextCardExcept(currentWord?: string): MimiretoCard {
    if (this.deck.length <= 1) {
      return this.getRandomCard();
    }
    let nextCard: MimiretoCard;
    do {
      nextCard = this.getRandomCard();
    } while (currentWord && nextCard.word === currentWord);
    return nextCard;
  }

  getAllCards(): MimiretoCard[] {
    return [...this.deck];
  }
}
