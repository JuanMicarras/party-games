import { RoomState } from "@party-games/shared";

interface HostBoardProps {
  room: RoomState;
  onResetToLobby?: () => void;
}

export function HostBoard({ room, onResetToLobby }: HostBoardProps) {
  if (!room.mimireto) return null;

  const speaker = room.players.find(
    (p) => p.id === room.mimireto?.speakerId,
  )?.name || "Sin asignar";
  const judge = room.players.find(
    (p) => p.id === room.mimireto?.judgeId,
  )?.name || "Sin asignar";

  const disconnectedPlayer = room.players.find((p) => p.connected === false);

  return (
    <div className="text-center w-full max-w-4xl space-y-8 relative">
      {/* Código de sala flotante */}
      <div className="absolute -top-4 right-0 bg-slate-950 border-2 border-slate-700 px-6 py-2 rounded-2xl shadow-lg">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">
          Sala
        </span>
        <span className="text-3xl font-mono font-black text-emerald-400">
          {room.roomCode}
        </span>
      </div>

      <h1 className="text-5xl font-black text-amber-400 mb-8 tracking-wider">
        MIMIRETO
      </h1>

      <div className="flex justify-between items-center bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center min-w-[150px]">
          <h2 className="text-2xl text-blue-400 font-bold mb-2">EQUIPO A</h2>
          <p className="text-6xl font-black">{room.mimireto.teamAScore}</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 px-8 min-w-[320px]">
          {room.mimireto.status === "TIME_UP" ? (
            <div className="animate-bounce bg-red-600 px-6 py-2 rounded-full mb-4">
              <span className="text-2xl font-bold text-white uppercase tracking-wider">
                ¡TIEMPO!
              </span>
            </div>
          ) : room.mimireto.status === "PAUSED" ? (
            <div className="space-y-1 mb-2">
              <div className="animate-pulse bg-amber-500 px-6 py-2 rounded-full text-slate-950 font-black tracking-wide uppercase text-sm">
                ¡JUEGO PAUSADO! {disconnectedPlayer ? `${disconnectedPlayer.name} SE DESCONECTÓ` : "EN PAUSA"}
              </div>
              <p className="text-xs text-amber-400 font-medium">
                Esperando que el orador ({speaker}) reanude el reloj
              </p>
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

      {onResetToLobby && (
        <div className="pt-2">
          <button
            onClick={onResetToLobby}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer"
          >
            Cancelar partida y volver al Lobby
          </button>
        </div>
      )}
    </div>
  );
}
