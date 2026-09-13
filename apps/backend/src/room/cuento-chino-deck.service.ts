import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CuentoChinoQuestion } from '@party-games/shared';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

@Injectable()
export class CuentoChinoDeckService implements OnModuleInit {
  private readonly logger = new Logger(CuentoChinoDeckService.name);
  private questions: CuentoChinoQuestion[] = [];

  onModuleInit() {
    this.loadQuestions();
  }

  private loadQuestions() {
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const candidates = [
        path.join(currentDir, 'data', 'cuento-chino-sofia.json'),
        path.join(process.cwd(), 'src', 'room', 'data', 'cuento-chino-sofia.json'),
        path.join(process.cwd(), 'dist', 'room', 'data', 'cuento-chino-sofia.json'),
      ];

      const foundPath = candidates.find((p) => fs.existsSync(p));
      if (!foundPath) {
        throw new Error(
          `No se encontró cuento-chino.json en: ${candidates.join(', ')}`,
        );
      }

      const fileData = fs.readFileSync(foundPath, 'utf-8');
      const parsed: CuentoChinoQuestion[] = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.questions = parsed;
        this.logger.log(
          `📜 Banco de Cuento Chino cargado en memoria (${this.questions.length} preguntas bíblicas).`,
        );
      } else {
        throw new Error('El archivo cuento-chino.json está vacío.');
      }
    } catch (error) {
      this.logger.error(
        'Error cargando cuento-chino.json. Usando preguntas de respaldo.',
        error,
      );
      this.questions = [
        {
          id: 'cc-fb-1',
          question: 'En Jueces 3:17, el rey Eglón de Moab era extremadamente _____.',
          reference: 'Jueces 3:17',
          correctAnswer: 'gordo',
          acceptedAnswers: ['gordo', 'obeso'],
          defaultLies: ['alto', 'peludo', 'dormilon'],
        },
      ];
    }
  }

  getRandomQuestions(count: number = 3): CuentoChinoQuestion[] {
    const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
