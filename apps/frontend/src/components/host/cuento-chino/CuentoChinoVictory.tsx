import { RoomState } from "@party-games/shared";

interface CuentoChinoVictoryProps {
  room: RoomState;
  onResetToLobby?: () => void;
}

export function CuentoChinoVictory({
  room,
  onResetToLobby,
}: CuentoChinoVictoryProps) {
  const { cuentoChino, players } = room;
  const scores = cuentoChino?.scores || {};

  const sortedPlayers = [...players].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0),
  );

  const winner = sortedPlayers[0];

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 max-w-3xl w-full">
      <span className="text-7xl animate-bounce inline-block">🏆</span>
      <h1 className="text-5xl md:text-6xl font-black text-amber-400">
        ¡FIN DE LA PARTIDA!
      </h1>

      <div className="bg-slate-800 p-8 md:p-12 rounded-3xl border-4 border-slate-700 shadow-2xl space-y-8">
        <div>
          <p className="text-xl text-slate-300 mb-2">Gran Campeón Bíblico:</p>
          <h2 className="text-5xl md:text-6xl font-black text-emerald-400 tracking-wide">
            {winner?.name || "Sin ganador"}
          </h2>
          <p className="text-2xl font-mono font-bold text-amber-300 mt-2">
            {scores[winner?.id || ""] || 0} PUNTOS
          </p>
        </div>

        {/* Tabla de todos los jugadores */}
        <div className="space-y-3 max-w-lg mx-auto text-left">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 text-center">
            Puntuación Final
          </h3>
          {sortedPlayers.map((p, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  index === 0
                    ? "bg-amber-950/40 border-amber-500/50"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[index] || "👤"}</span>
                  <span className="font-bold text-lg text-white">
                    {p.name}
                  </span>
                </div>
                <span className="font-mono font-black text-xl text-amber-400">
                  {scores[p.id] || 0} pts
                </span>
              </div>
            );
          })}
        </div>

        {onResetToLobby && (
          <div className="pt-4">
            <button
              type="button"
              onClick={onResetToLobby}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              🎮 Volver al Lobby / Jugar de Nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
