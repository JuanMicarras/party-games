import { useState } from "react";
import { RoomState, GameMode } from "@party-games/shared";

interface HostLobbyProps {
  room: RoomState;
  onStartGame: (
    gameMode: GameMode,
    options: { roundsMultiplier?: number; totalQuestions?: number },
  ) => void;
}

export function HostLobby({ room, onStartGame }: HostLobbyProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("CUENTO_CHINO");
  const [mimiretoMultiplier, setMimiretoMultiplier] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(3);

  const handleStart = () => {
    if (selectedMode === "MIMIRETO") {
      onStartGame("MIMIRETO", { roundsMultiplier: mimiretoMultiplier });
    } else {
      onStartGame("CUENTO_CHINO", { totalQuestions });
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
            <p className="text-slate-500 italic">Esperando que se unan jugadores...</p>
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

      {/* SELECTOR DE MODO DE JUEGO */}
      {room.players.length >= 2 && (
        <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-300 mb-4">
              Elige el Modo de Juego:
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
                  Todos contra todos. Inventa mentiras creíbles para engañar a tus amigos
                  y adivina la verdad bíblica.
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
                <h4 className="text-xl font-black text-blue-400">
                  Mimireto
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Por equipos (A vs B). Un orador describe la palabra evitando las prohibidas
                  y el rival actúa como juez.
                </p>
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  En Equipos (Tabú)
                </span>
              </button>
            </div>
          </div>

          {/* Opciones según el juego seleccionado */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Configuración de la partida
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
            ¡Empezar {selectedMode === "CUENTO_CHINO" ? "Cuento Chino" : "Mimireto"}!
          </button>
        </div>
      )}
    </div>
  );
}
