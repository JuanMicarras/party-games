import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  CuentoChinoQuestion,
  CategoryInfo,
  validateCuentoChinoDeck,
} from '@party-games/shared';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const CUENTO_CHINO_CATEGORY_METADATA: Record<
  string,
  { name: string; description: string; icon: string; order: number }
> = {
  biblico: {
    name: 'Bíblico / Célula',
    description: 'Curiosidades reales e insólitas escondidas en la Biblia',
    icon: '📖',
    order: 1,
  },
  'cultura-pop': {
    name: 'Cultura Pop & Cine',
    description: 'Secretos de rodaje, música, series y datos de celebridades',
    icon: '🎬',
    order: 2,
  },
  general: {
    name: 'General / Mundo Insólito',
    description: 'Leyes absurdas, animales extraños, ciencia e historia curiosa',
    icon: '🌎',
    order: 3,
  },
  amigos: {
    name: 'Especial / Amigos',
    description: 'Anécdotas, tragedias divertidas y secretos del grupo',
    icon: '🎂',
    order: 4,
  },
};

@Injectable()
export class CuentoChinoDeckService implements OnModuleInit {
  private readonly logger = new Logger(CuentoChinoDeckService.name);
  private questionsByCategory: Map<string, CuentoChinoQuestion[]> = new Map();
  private categories: CategoryInfo[] = [];

  onModuleInit() {
    this.loadAllQuestions();
  }

  private formatCategoryName(id: string): string {
    return id
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private loadAllQuestions() {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const dirCandidates = [
      path.join(currentDir, 'data', 'cuento-chino'),
      path.join(process.cwd(), 'src', 'room', 'data', 'cuento-chino'),
      path.join(process.cwd(), 'dist', 'room', 'data', 'cuento-chino'),
      path.join(
        process.cwd(),
        'apps',
        'backend',
        'src',
        'room',
        'data',
        'cuento-chino',
      ),
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
          const validation = validateCuentoChinoDeck(parsed);
          if (validation.valid && validation.questions.length > 0) {
            this.questionsByCategory.set(categoryId, validation.questions);
            this.logger.log(
              `📜 Categoría Cuento Chino [${categoryId}] cargada (${validation.questions.length} preguntas).`,
            );
          } else {
            this.logger.warn(
              `⚠️ Archivo ${file} ignorado en Cuento Chino: ${validation.error}`,
            );
          }
        } catch (err) {
          this.logger.error(
            `Error leyendo archivo de Cuento Chino ${file}:`,
            err,
          );
        }
      }
    }

    if (this.questionsByCategory.size === 0) {
      this.logger.warn(
        'No se encontraron bancos en data/cuento-chino. Usando respaldo en memoria.',
      );
      this.questionsByCategory.set('biblico', [
        {
          id: 'cc-fb-1',
          question:
            'En Jueces 3:17, el rey Eglón de Moab era extremadamente _____.',
          reference: 'Jueces 3:17',
          correctAnswer: 'gordo',
          acceptedAnswers: ['gordo', 'obeso'],
          defaultLies: ['alto', 'peludo', 'dormilon'],
        },
      ]);
    }

    const categoryEntries: Array<CategoryInfo & { order: number }> = [];
    for (const [id, questions] of this.questionsByCategory.entries()) {
      const meta = CUENTO_CHINO_CATEGORY_METADATA[id];
      categoryEntries.push({
        id,
        name: meta?.name ?? this.formatCategoryName(id),
        description:
          meta?.description ?? 'Banco temático de preguntas y engaño',
        icon: meta?.icon ?? '🤥',
        count: questions.length,
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

  getQuestionsByCategory(categoryId?: string): CuentoChinoQuestion[] {
    const id = (categoryId || 'biblico').toLowerCase();
    const list =
      this.questionsByCategory.get(id) ||
      this.questionsByCategory.get('biblico') ||
      Array.from(this.questionsByCategory.values())[0] ||
      [];
    return [...list];
  }

  getRandomQuestions(
    count: number = 3,
    categoryId?: string,
  ): CuentoChinoQuestion[] {
    const pool = this.getQuestionsByCategory(categoryId);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
