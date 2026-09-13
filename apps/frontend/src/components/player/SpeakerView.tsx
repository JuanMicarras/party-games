import { RoomState } from "@party-games/shared";

interface SpeakerViewProps {
  room: RoomState;
  onAction: (action: "SUCCESS" | "PASS" | "FOUL") => void;
  onStartTurn: () => void;
}

export function SpeakerView({ room, onAction, onStartTurn }: SpeakerViewProps) {
  const { mimireto } = room;
  if (!mimireto?.currentCard) return null;

  const isWaiting = ["WAITING", "TIME_UP", "PAUSED"].includes(mimireto.status);

  return (
    <div className="bg-emerald-900/30 border-2 border-emerald-500 rounded-xl p-6 text-center shadow-lg mt-4">
      <p className="text-emerald-400 font-bold mb-1">¡ES TU TURNO!</p>

      {isWaiting ? (
        <div className="mt-8 space-y-4">
          {mimireto.status === "PAUSED" ? (
            <div className="bg-amber-950/70 border border-amber-500/50 rounded-xl p-3 text-amber-300 text-xs font-medium space-y-1">
              <p className="font-bold text-sm text-amber-400 uppercase tracking-wide">
                ⏸️ Partida en Pausa
              </p>
              <p>
                Alguien se desconectó. Solo tú (el Orador) puedes reanudar el reloj
                cuando todos estén listos.
              </p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm">
              Asegúrate de que todos estén listos.
            </p>
          )}

          <button
            onClick={onStartTurn}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 transition-all cursor-pointer"
          >
            {mimireto.status === "PAUSED"
              ? "¡Reanudar Reloj!"
              : "¡Iniciar Reloj!"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-300 mb-4">
            Haz que tu equipo adivine:
          </p>
          <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-wider">
            {mimireto.currentCard.word}
          </h2>
          <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl text-left">
            <p className="text-red-400 font-bold text-xs mb-3 tracking-wider uppercase text-center">
              Palabras Prohibidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {mimireto.currentCard.forbidden.map((word, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 bg-red-900/20 border border-red-500/20 rounded-lg"
                >
                  <span className="text-base font-semibold text-red-200">
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => onAction("PASS")}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition cursor-pointer"
            >
              Pasar
            </button>
            <button
              onClick={() => onAction("SUCCESS")}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 transition cursor-pointer"
            >
              +1 Acierto
            </button>
          </div>
        </>
      )}
    </div>
  );
}
