import { useState, useMemo, useRef } from "react";
import {
  GameMode,
  MimiretoCard,
  CuentoChinoQuestion,
  validateMimiretoDeck,
  validateCuentoChinoDeck,
} from "@party-games/shared";

interface CustomDeckModalProps {
  gameMode: GameMode;
  initialName?: string;
  initialRawJson?: string;
  onClose: () => void;
  onApplyMimiretoDeck: (
    name: string,
    cards: MimiretoCard[],
    rawJson: string,
  ) => void;
  onApplyCuentoChinoDeck: (
    name: string,
    questions: CuentoChinoQuestion[],
    rawJson: string,
  ) => void;
}

const MIMIRETO_SAMPLE: MimiretoCard[] = [
  {
    word: "AREPAS",
    forbidden: ["MAÍZ", "QUESO", "DESAYUNO", "COLOMBIA", "VENEZUELA", "ASAR"],
  },
  {
    word: "KARAOKE",
    forbidden: ["CANTAR", "MICRÓFONO", "MÚSICA", "LETRA", "FIESTA", "VOZ"],
  },
  {
    word: "NETFLIX",
    forbidden: ["SERIES", "PELÍCULAS", "STREAMING", "TELEVISOR", "VER", "ROJO"],
  },
];

const CUENTO_CHINO_SAMPLE: CuentoChinoQuestion[] = [
  {
    id: "custom-1",
    question:
      "En su primer viaje en avión, a Carlos le dio tanto nerviosismo que terminó abrazando a _____.",
    reference: "Anécdotas del Grupo",
    correctAnswer: "la azafata",
    acceptedAnswers: ["la azafata", "azafata", "auxiliar de vuelo"],
    defaultLies: ["el piloto", "una maleta", "una señora", "un perro"],
  },
  {
    id: "custom-2",
    question:
      "El ingrediente secreto que siempre le echa la abuela al sancocho para que espese es _____.",
    reference: "Secretos de Familia",
    correctAnswer: "plátano rallado",
    acceptedAnswers: ["platano rallado", "platano verde", "platano"],
    defaultLies: ["avena", "queso crema", "harina de trigo", "manzana"],
  },
  {
    id: "custom-3",
    question:
      "En el paseo de fin de año, el grupo se perdió durante tres horas por seguir un atajo sugerido por _____.",
    reference: "Viajes Inolvidables",
    correctAnswer: "un taxista",
    acceptedAnswers: ["un taxista", "taxista", "el conductor"],
    defaultLies: ["waze", "un policía", "el vendedor de cocadas", "google maps"],
  },
];

export function CustomDeckModal({
  gameMode,
  initialName = "",
  initialRawJson = "",
  onClose,
  onApplyMimiretoDeck,
  onApplyCuentoChinoDeck,
}: CustomDeckModalProps) {
  const isMimireto = gameMode === "MIMIRETO";
  const [deckName, setDeckName] = useState(
    initialName || (isMimireto ? "Mazo Personalizado" : "Trivia Personalizada"),
  );
  const [rawJson, setRawJson] = useState(initialRawJson);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationResult = useMemo(() => {
    if (!rawJson.trim()) {
      return {
        empty: true,
        valid: false,
        error: null,
        mimiretoCards: [] as MimiretoCard[],
        cuentoChinoQuestions: [] as CuentoChinoQuestion[],
      };
    }

    try {
      const parsed = JSON.parse(rawJson);
      if (isMimireto) {
        const res = validateMimiretoDeck(parsed);
        return {
          empty: false,
          valid: res.valid,
          error: res.error || null,
          mimiretoCards: res.cards,
          cuentoChinoQuestions: [] as CuentoChinoQuestion[],
        };
      } else {
        const res = validateCuentoChinoDeck(parsed);
        return {
          empty: false,
          valid: res.valid,
          error: res.error || null,
          mimiretoCards: [] as MimiretoCard[],
          cuentoChinoQuestions: res.questions,
        };
      }
    } catch (e) {
      return {
        empty: false,
        valid: false,
        error:
          "El texto no es un JSON válido. Verifica que los corchetes [ ], llaves { } y comillas dobles \" \" estén bien cerrados.",
        mimiretoCards: [] as MimiretoCard[],
        cuentoChinoQuestions: [] as CuentoChinoQuestion[],
      };
    }
  }, [rawJson, isMimireto]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.json$/i, "");
    if (
      baseName &&
      (deckName === "Mazo Personalizado" ||
        deckName === "Trivia Personalizada" ||
        !deckName.trim())
    ) {
      setDeckName(baseName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setRawJson(content);
      }
    };
    reader.onerror = () => {
      setFileError("No se pudo leer el archivo seleccionado.");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleLoadSample = () => {
    setFileError(null);
    const sample = isMimireto ? MIMIRETO_SAMPLE : CUENTO_CHINO_SAMPLE;
    setRawJson(JSON.stringify(sample, null, 2));
  };

  const handleDownloadTemplate = () => {
    const sample = isMimireto ? MIMIRETO_SAMPLE : CUENTO_CHINO_SAMPLE;
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isMimireto
      ? "plantilla-mimireto.json"
      : "plantilla-cuento-chino.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (!validationResult.valid) return;
    const finalName =
      deckName.trim() ||
      (isMimireto ? "Mazo Personalizado" : "Trivia Personalizada");

    if (isMimireto) {
      onApplyMimiretoDeck(finalName, validationResult.mimiretoCards, rawJson);
    } else {
      onApplyCuentoChinoDeck(
        finalName,
        validationResult.cuentoChinoQuestions,
        rawJson,
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isMimireto ? "🎭 Mimireto" : "🤥 Cuento Chino"}
            </span>
            <h3 className="text-xl font-black text-white">
              Cargar Mazo Personalizado (JSON)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold transition cursor-pointer"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Nombre del mazo y acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nombre de la temática / evento
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ej: Cumpleaños de Sofía, Noche de Cine..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>📂</span>
                <span>Subir archivo .json</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ✨ Cargar ejemplo
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ⬇️ Plantilla
              </button>
            </div>
          </div>

          {fileError && (
            <div className="p-3 bg-rose-950/70 border border-rose-500 rounded-xl text-xs text-rose-200">
              ⚠️ {fileError}
            </div>
          )}

          {/* Editor JSON */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contenido JSON (puedes pegar o editar aquí directamente)
              </label>
              {rawJson.trim() && (
                <button
                  type="button"
                  onClick={() => setRawJson("")}
                  className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
                >
                  Limpiar texto
                </button>
              )}
            </div>
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={8}
              placeholder={
                isMimireto
                  ? '[\n  {\n    "word": "PALABRA",\n    "forbidden": ["PROHIBIDA 1", "PROHIBIDA 2", "PROHIBIDA 3"]\n  }\n]'
                  : '[\n  {\n    "question": "Durante el viaje, Juan perdió su _____.",\n    "reference": "Anécdotas",\n    "correctAnswer": "pasaporte",\n    "acceptedAnswers": ["pasaporte"],\n    "defaultLies": ["celular", "billetera", "maleta"]\n  }\n]'
              }
              className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Estado de validación y vista previa */}
          {!validationResult.empty && !validationResult.valid && (
            <div className="p-4 bg-rose-950/60 border border-rose-500/80 rounded-2xl text-sm text-rose-200 flex items-start gap-3">
              <span className="text-lg">❌</span>
              <div>
                <p className="font-bold text-rose-300">
                  Error de formato en el mazo:
                </p>
                <p className="text-xs mt-1">{validationResult.error}</p>
              </div>
            </div>
          )}

          {validationResult.valid && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-bold text-emerald-300">
                    {isMimireto
                      ? `${validationResult.mimiretoCards.length} cartas válidas listas para jugar`
                      : `${validationResult.cuentoChinoQuestions.length} preguntas válidas listas para jugar`}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-wider">
                  Vista previa
                </span>
              </div>

              {/* Lista de vista previa */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {isMimireto
                  ? validationResult.mimiretoCards.slice(0, 15).map((card, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="font-black text-amber-400 text-sm">
                          #{i + 1} {card.word}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {card.forbidden.map((f, j) => (
                            <span
                              key={j}
                              className="text-[10px] px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/50 rounded-full font-semibold"
                            >
                              🚫 {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  : validationResult.cuentoChinoQuestions
                      .slice(0, 10)
                      .map((q, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-amber-400">
                              #{i + 1} • {q.reference}
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Verdad: {q.correctAnswer}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200">{q.question}</p>
                        </div>
                      ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!validationResult.valid}
            onClick={handleApply}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition ${
              validationResult.valid
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            ⚡ Usar este mazo en la sala
          </button>
        </div>
      </div>
    </div>
  );
}
