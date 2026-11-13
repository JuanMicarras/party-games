import { useState } from "react";
import {
  RoomState,
  GameMode,
  CategoryInfo,
  MimiretoCard,
  CuentoChinoQuestion,
} from "@party-games/shared";
import { StartGameOptions } from "@/hooks/useHostRoom";
import { CustomDeckModal } from "./CustomDeckModal";

interface HostLobbyProps {
  room: RoomState;
  onStartGame: (gameMode: GameMode, options: StartGameOptions) => void;
}

const FALLBACK_MIMIRETO_CATEGORIES: CategoryInfo[] = [
  {
    id: "biblico",
    name: "Bíblico / Célula",
    description: "Personajes, libros, lugares y pasajes de la Biblia",
    icon: "📖",
    count: 96,
  },
  {
    id: "cultura-pop",
    name: "Cultura Pop & Cine",
    description: "Películas, series, música, artistas y personajes famosos",
    icon: "🎬",
    count: 40,
  },
  {
    id: "general",
    name: "General / Cotidiano",
    description: "Objetos diarios, profesiones, comida y lugares comunes",
    icon: "🌎",
    count: 40,
  },
  {
    id: "amigos",
    name: "Especial / Amigos",
    description: "Anécdotas, recuerdos y referencias internas del grupo",
    icon: "🎂",
    count: 110,
  },
];

const FALLBACK_CUENTO_CHINO_CATEGORIES: CategoryInfo[] = [
  {
    id: "biblico",
    name: "Bíblico / Célula",
    description: "Curiosidades reales e insólitas escondidas en la Biblia",
    icon: "📖",
    count: 80,
  },
  {
    id: "cultura-pop",
    name: "Cultura Pop & Cine",
    description: "Secretos de rodaje, música, series y datos de celebridades",
    icon: "🎬",
    count: 20,
  },
  {
    id: "general",
    name: "General / Mundo Insólito",
    description: "Leyes absurdas, animales extraños, ciencia e historia curiosa",
    icon: "🌎",
    count: 20,
  },
  {
    id: "amigos",
    name: "Especial / Amigos",
    description: "Anécdotas, tragedias divertidas y secretos del grupo",
    icon: "🎂",
    count: 75,
  },
];

export function HostLobby({ room, onStartGame }: HostLobbyProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("CUENTO_CHINO");
  const [mimiretoMultiplier, setMimiretoMultiplier] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(3);

  // Categoría seleccionada por juego
  const [mimiretoCategory, setMimiretoCategory] = useState<string>("biblico");
  const [cuentoChinoCategory, setCuentoChinoCategory] =
    useState<string>("biblico");

  // Estado de mazos personalizados en memoria para esta sesión
  const [customMimireto, setCustomMimireto] = useState<{
    name: string;
    cards: MimiretoCard[];
    rawJson: string;
  } | null>(null);

  const [customCuentoChino, setCustomCuentoChino] = useState<{
    name: string;
    questions: CuentoChinoQuestion[];
    rawJson: string;
  } | null>(null);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const categoriesForCurrentMode =
    selectedMode === "MIMIRETO"
      ? room.availableCategories?.mimireto?.length
        ? room.availableCategories.mimireto
        : FALLBACK_MIMIRETO_CATEGORIES
      : room.availableCategories?.cuentoChino?.length
        ? room.availableCategories.cuentoChino
        : FALLBACK_CUENTO_CHINO_CATEGORIES;

  const activeCategory =
    selectedMode === "MIMIRETO" ? mimiretoCategory : cuentoChinoCategory;

  const setActiveCategory = (catId: string) => {
    if (selectedMode === "MIMIRETO") {
      setMimiretoCategory(catId);
    } else {
      setCuentoChinoCategory(catId);
    }
  };

  const activeCustomDeckInfo =
    selectedMode === "MIMIRETO"
      ? customMimireto
        ? {
            name: customMimireto.name,
            count: customMimireto.cards.length,
            unit: "cartas",
          }
        : null
      : customCuentoChino
        ? {
            name: customCuentoChino.name,
            count: customCuentoChino.questions.length,
            unit: "preguntas",
          }
        : null;

  const handleStart = () => {
    if (selectedMode === "MIMIRETO") {
      const isCustom = mimiretoCategory === "custom" && customMimireto;
      onStartGame("MIMIRETO", {
        roundsMultiplier: mimiretoMultiplier,
        category: isCustom ? "custom" : mimiretoCategory,
        customCategoryName: isCustom ? customMimireto.name : undefined,
        customMimiretoDeck: isCustom ? customMimireto.cards : undefined,
      });
    } else {
      const isCustom = cuentoChinoCategory === "custom" && customCuentoChino;
      onStartGame("CUENTO_CHINO", {
        totalQuestions,
        category: isCustom ? "custom" : cuentoChinoCategory,
        customCategoryName: isCustom ? customCuentoChino.name : undefined,
        customCuentoChinoDeck: isCustom
          ? customCuentoChino.questions
          : undefined,
      });
    }
  };

  return (
    <div className="text-center space-y-8 max-w-4xl w-full">
      <h1 className="text-3xl font-bold text-slate-400">Únete en tu celular</h1>

      {/* Código de sala grande */}
      <div className="bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 shadow-2xl max-w-lg mx-auto">
        <p className="text-8xl font-mono font-black tracking-widest text-emerald-400">
          {room.roomCode}
        </p>
      </div>

      {/* Lista de jugadores */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Jugadores en sala ({room.players.length})
        </h2>
        <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto min-h-[50px]">
          {room.players.length === 0 ? (
            <p className="text-slate-500 italic">
              Esperando que se unan jugadores...
            </p>
          ) : (
            room.players.map((player) => (
              <span
                key={player.id}
                className="px-4 py-2 bg-blue-600 rounded-full font-semibold shadow-lg text-lg flex items-center gap-2"
              >
                <span>👤</span>
                <span>{player.name}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* SELECTOR DE MODO DE JUEGO Y CATEGORÍA */}
      {room.players.length >= 2 && (
        <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl mx-auto space-y-6">
          {/* 1. Modo de Juego */}
          <div>
            <h3 className="text-lg font-bold text-slate-300 mb-4">
              1. Elige el Modo de Juego:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta Cuento Chino */}
              <button
                type="button"
                onClick={() => setSelectedMode("CUENTO_CHINO")}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedMode === "CUENTO_CHINO"
                    ? "bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-[1.02]"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="text-3xl mb-2">🤥</div>
                <h4 className="text-xl font-black text-amber-400">
                  Cita Verdadera o Cuento Chino
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Todos contra todos. Inventa mentiras creíbles para engañar a
                  tus amigos y adivina el dato verdadero.
                </p>
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Trivia & Engaño (Fibbage)
                </span>
              </button>

              {/* Tarjeta Mimireto */}
              <button
                type="button"
                onClick={() => setSelectedMode("MIMIRETO")}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedMode === "MIMIRETO"
                    ? "bg-blue-950/40 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.2)] scale-[1.02]"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="text-3xl mb-2">🎭</div>
                <h4 className="text-xl font-black text-blue-400">Mimireto</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Por equipos (A vs B). Un orador describe la palabra evitando
                  las prohibidas y el rival actúa como juez.
                </p>
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  En Equipos (Tabú)
                </span>
              </button>
            </div>
          </div>

          {/* 2. Selector de Categoría / Temática */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                2. Elige la Categoría de Tema:
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>
                  {activeCustomDeckInfo
                    ? "Editar mazo personalizado"
                    : "Subir / Pegar Mazo JSON"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {categoriesForCurrentMode.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const accentColor =
                  selectedMode === "CUENTO_CHINO"
                    ? isSelected
                      ? "bg-amber-950/50 border-amber-400 text-amber-200 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                    : isSelected
                      ? "bg-blue-950/50 border-blue-400 text-blue-200 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300";

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${accentColor}`}
                  >
                    <span className="text-2xl mt-0.5">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                          {cat.count}{" "}
                          {selectedMode === "MIMIRETO" ? "cartas" : "preg."}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Tarjeta de Mazo Personalizado si ya fue cargado */}
              {activeCustomDeckInfo && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("custom")}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 sm:col-span-2 ${
                    activeCategory === "custom"
                      ? "bg-emerald-950/60 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span className="text-2xl mt-0.5">⚡</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-emerald-300 truncate">
                        {activeCustomDeckInfo.name} (Personalizado)
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {activeCustomDeckInfo.count} {activeCustomDeckInfo.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Mazo personalizado cargado en memoria para esta partida.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* 3. Duración / Configuración de la partida */}
          <div className="flex flex-col items-center gap-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              3. Duración de la partida
            </span>

            {selectedMode === "CUENTO_CHINO" ? (
              <div className="flex gap-3 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTotalQuestions(3)}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                    totalQuestions === 3
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  3 Preguntas (Rápida)
                </button>
                <button
                  type="button"
                  onClick={() => setTotalQuestions(5)}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                    totalQuestions === 5
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  5 Preguntas (Estándar)
                </button>
              </div>
            ) : (
              <div className="flex gap-3 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMimiretoMultiplier(1)}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                    mimiretoMultiplier === 1
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Rápida (1x)
                </button>
                <button
                  type="button"
                  onClick={() => setMimiretoMultiplier(2)}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                    mimiretoMultiplier === 2
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Estándar (2x)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-2xl transition transform hover:scale-[1.02] active:scale-[0.98] shadow-xl cursor-pointer"
          >
            ¡Empezar{" "}
            {selectedMode === "CUENTO_CHINO" ? "Cuento Chino" : "Mimireto"}!
          </button>
        </div>
      )}

      {/* Modal para subir / pegar mazo personalizado */}
      {isCustomModalOpen && (
        <CustomDeckModal
          gameMode={selectedMode}
          initialName={
            selectedMode === "MIMIRETO"
              ? customMimireto?.name
              : customCuentoChino?.name
          }
          initialRawJson={
            selectedMode === "MIMIRETO"
              ? customMimireto?.rawJson
              : customCuentoChino?.rawJson
          }
          onClose={() => setIsCustomModalOpen(false)}
          onApplyMimiretoDeck={(name, cards, rawJson) => {
            setCustomMimireto({ name, cards, rawJson });
            setMimiretoCategory("custom");
          }}
          onApplyCuentoChinoDeck={(name, questions, rawJson) => {
            setCustomCuentoChino({ name, questions, rawJson });
            setCuentoChinoCategory("custom");
          }}
        />
      )}
    </div>
  );
}
