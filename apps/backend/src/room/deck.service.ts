import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  MimiretoCard,
  CategoryInfo,
  validateMimiretoDeck,
} from '@party-games/shared';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const MIMIRETO_CATEGORY_METADATA: Record<
  string,
  { name: string; description: string; icon: string; order: number }
> = {
  biblico: {
    name: 'Bíblico / Célula',
    description: 'Personajes, libros, lugares y pasajes de la Biblia',
    icon: '📖',
    order: 1,
  },
  'cultura-pop': {
    name: 'Cultura Pop & Cine',
    description: 'Películas, series, música, artistas y personajes famosos',
    icon: '🎬',
    order: 2,
  },
  general: {
    name: 'General / Cotidiano',
    description: 'Objetos diarios, profesiones, comida y lugares comunes',
    icon: '🌎',
    order: 3,
  },
  amigos: {
    name: 'Especial / Amigos',
    description: 'Anécdotas, recuerdos y referencias internas del grupo',
    icon: '🎂',
    order: 4,
  },
};

@Injectable()
export class DeckService implements OnModuleInit {
  private readonly logger = new Logger(DeckService.name);
  private decksByCategory: Map<string, MimiretoCard[]> = new Map();
  private categories: CategoryInfo[] = [];

  onModuleInit() {
    this.loadAllDecks();
  }

  private formatCategoryName(id: string): string {
    return id
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private loadAllDecks() {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const dirCandidates = [
      path.join(currentDir, 'data', 'mimireto'),
      path.join(process.cwd(), 'src', 'room', 'data', 'mimireto'),
      path.join(process.cwd(), 'dist', 'room', 'data', 'mimireto'),
      path.join(process.cwd(), 'apps', 'backend', 'src', 'room', 'data', 'mimireto'),
    ];

    const foundDir = dirCandidates.find(
      (d) => fs.existsSync(d) && fs.statSync(d).isDirectory(),
    );

    if (foundDir) {
      const files = fs
        .readdirSync(foundDir)
        .filter((f) => f.toLowerCase().endsWith('.json'));

      for (const file of files) {
        const categoryId = path.basename(file, '.json').toLowerCase();
        const fullPath = path.join(foundDir, file);
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const validation = validateMimiretoDeck(parsed);
          if (validation.valid && validation.cards.length > 0) {
            this.decksByCategory.set(categoryId, validation.cards);
            this.logger.log(
              `🃏 Categoría Mimireto [${categoryId}] cargada (${validation.cards.length} cartas).`,
            );
          } else {
            this.logger.warn(
              `⚠️ Archivo ${file} ignorado en Mimireto: ${validation.error}`,
            );
          }
        } catch (err) {
          this.logger.error(`Error leyendo archivo de mazo ${file}:`, err);
        }
      }
    }

    // Fallback si no se pudo cargar ninguna categoría
    if (this.decksByCategory.size === 0) {
      this.logger.warn(
        'No se encontraron mazos en data/mimireto. Usando mazo de respaldo.',
      );
      this.decksByCategory.set('biblico', [
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
      ]);
    }

    // Construir lista ordenada de categorías
    const categoryEntries: Array<CategoryInfo & { order: number }> = [];
    for (const [id, cards] of this.decksByCategory.entries()) {
      const meta = MIMIRETO_CATEGORY_METADATA[id];
      categoryEntries.push({
        id,
        name: meta?.name ?? this.formatCategoryName(id),
        description:
          meta?.description ?? 'Mazo temático de palabras prohibidas',
        icon: meta?.icon ?? '🃏',
        count: cards.length,
        order: meta?.order ?? 99,
      });
    }

    this.categories = categoryEntries
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ order: _order, ...info }) => info);
  }

  getCategories(): CategoryInfo[] {
    return [...this.categories];
  }

  getCategoryInfo(categoryId?: string): CategoryInfo | undefined {
    const id = (categoryId || 'biblico').toLowerCase();
    return (
      this.categories.find((c) => c.id === id) || this.categories[0]
    );
  }

  getDeckByCategory(categoryId?: string): MimiretoCard[] {
    const id = (categoryId || 'biblico').toLowerCase();
    const deck =
      this.decksByCategory.get(id) ||
      this.decksByCategory.get('biblico') ||
      Array.from(this.decksByCategory.values())[0] ||
      [];
    return [...deck];
  }

  getRandomCardFromDeck(deck: MimiretoCard[]): MimiretoCard {
    if (!deck || deck.length === 0) {
      return { word: 'Sin Cartas', forbidden: ['Error', 'Mazo', 'Vacío'] };
    }
    const index = Math.floor(Math.random() * deck.length);
    return deck[index];
  }

  getNextCardExceptFromDeck(
    deck: MimiretoCard[],
    currentWord?: string,
  ): MimiretoCard {
    if (!deck || deck.length <= 1) {
      return this.getRandomCardFromDeck(deck);
    }
    let nextCard: MimiretoCard;
    let attempts = 0;
    do {
      nextCard = this.getRandomCardFromDeck(deck);
      attempts++;
    } while (currentWord && nextCard.word === currentWord && attempts < 10);
    return nextCard;
  }

  getRandomCard(categoryId?: string): MimiretoCard {
    return this.getRandomCardFromDeck(this.getDeckByCategory(categoryId));
  }

  getNextCardExcept(currentWord?: string, categoryId?: string): MimiretoCard {
    return this.getNextCardExceptFromDeck(
      this.getDeckByCategory(categoryId),
      currentWord,
    );
  }

  getAllCards(categoryId?: string): MimiretoCard[] {
    return this.getDeckByCategory(categoryId);
  }
}
