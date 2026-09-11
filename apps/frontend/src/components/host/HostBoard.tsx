import { RoomState } from "@party-games/shared";

interface HostBoardProps {
  room: RoomState;
}

export function HostBoard({ room }: HostBoardProps) {
  if (!room.mimireto) return null;

  const speaker = room.players.find(
    (p) => p.id === room.mimireto?.speakerId,
  )?.name;
  const judge = room.players.find((p) => p.id === room.mimireto?.judgeId)?.name;

  return (
    <div className="text-center w-full max-w-4xl space-y-8">
      <h1 className="text-5xl font-black text-amber-400 mb-8 tracking-wider">
        MIMIRETO
      </h1>
      <div className="flex justify-between items-center bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center min-w-[150px]">
          <h2 className="text-2xl text-blue-400 font-bold mb-2">EQUIPO A</h2>
          <p className="text-6xl font-black">{room.mimireto.teamAScore}</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 px-8 min-w-[300px]">
          {room.mimireto.status === "TIME_UP" ? (
            <div className="animate-bounce bg-red-600 px-6 py-2 rounded-full mb-4">
              <span className="text-2xl font-bold text-white uppercase tracking-wider">
                ¡TIEMPO!
              </span>
            </div>
          ) : room.mimireto.status === "PAUSED" ? (
            <div className="animate-pulse bg-amber-500 px-6 py-2 rounded-full mb-4 text-slate-950 font-black tracking-wide uppercase">
              ¡JUEGO PAUSADO! ALGUIEN SE DESCONECTÓ
            </div>
          ) : (
            <div className="text-xl text-slate-300">
              Turno del Equipo{" "}
              <span className="font-bold text-amber-400">
                {room.mimireto.currentTurn}
              </span>
            </div>
          )}

          <div
            className={`text-8xl font-black font-mono tabular-nums transition-colors duration-300 ${
              room.mimireto.status === "PAUSED"
                ? "text-amber-500 opacity-60"
                : (room.mimireto.timeLeft ?? 0) <= 10
                  ? "text-red-500 animate-pulse"
                  : "text-emerald-400"
            }`}
          >
            00:{(room.mimireto.timeLeft ?? 0).toString().padStart(2, "0")}
          </div>

          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-200">
              Orador: <span className="text-emerald-400">{speaker}</span>
            </div>
            <div className="text-lg text-rose-400 mt-1">
              Juez: <span className="font-semibold">{judge}</span>
            </div>
          </div>
        </div>

        <div className="text-center min-w-[150px]">
          <h2 className="text-2xl text-rose-400 font-bold mb-2">EQUIPO B</h2>
          <p className="text-6xl font-black">{room.mimireto.teamBScore}</p>
        </div>
      </div>
    </div>
  );
}
