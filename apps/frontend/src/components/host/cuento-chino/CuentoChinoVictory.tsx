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

  const topScore =
    sortedPlayers.length > 0 ? scores[sortedPlayers[0].id] || 0 : 0;
  const winners = sortedPlayers.filter(
    (p) => (scores[p.id] || 0) === topScore && topScore > 0,
  );
  const isTie = winners.length > 1;

  // Asignar rangos respetando empates (ranking de competencia: 1, 1, 3...)
  let currentRank = 1;
  const playerRankMap = new Map<string, number>();
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (
      i > 0 &&
      (scores[sortedPlayers[i].id] || 0) <
        (scores[sortedPlayers[i - 1].id] || 0)
    ) {
      currentRank = i + 1;
    }
    playerRankMap.set(sortedPlayers[i].id, currentRank);
  }

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500 max-w-3xl w-full">
      <span className="text-7xl animate-bounce inline-block">
        {isTie ? "🤝" : "🏆"}
      </span>
      <h1 className="text-5xl md:text-6xl font-black text-amber-400">
        ¡FIN DE LA PARTIDA!
      </h1>

      <div className="bg-slate-800 p-8 md:p-12 rounded-3xl border-4 border-slate-700 shadow-2xl space-y-8">
        <div className="space-y-2">
          {cuentoChino?.categoryName && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3.5 py-1 rounded-full border border-amber-500/30 mb-1">
              Categoría: {cuentoChino.categoryName}
            </span>
          )}

          {isTie ? (
            <div>
              <p className="text-xl font-bold text-amber-300 mb-2">
                🤝 ¡Empate en el Primer Lugar!
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-emerald-400 tracking-wide">
                {winners.map((w) => w.name).join(" & ")}
              </h2>
              <p className="text-2xl font-mono font-bold text-amber-300 mt-2">
                {topScore} PUNTOS CADA UNO
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl text-slate-300 mb-2">
                {cuentoChino?.categoryId === "biblico"
                  ? "Gran Campeón Bíblico:"
                  : "Gran Campeón de la Partida:"}
              </p>
              <h2 className="text-5xl md:text-6xl font-black text-emerald-400 tracking-wide">
                {sortedPlayers[0]?.name || "Sin ganador"}
              </h2>
              <p className="text-2xl font-mono font-bold text-amber-300 mt-2">
                {topScore} PUNTOS
              </p>
            </div>
          )}
        </div>

        {/* Tabla de todos los jugadores */}
        <div className="space-y-3 max-w-lg mx-auto text-left">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 text-center">
            Puntuación Final
          </h3>
          {sortedPlayers.map((p) => {
            const rank = playerRankMap.get(p.id) || 1;
            const medal =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "👤";
            const isWinner = rank === 1;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isWinner
                    ? "bg-amber-950/40 border-amber-500/50"
                    : "bg-slate-900 border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medal}</span>
                  <span className="font-bold text-lg text-white">
                    {p.name}
                  </span>
                  {isWinner && isTie && (
                    <span className="text-[10px] uppercase font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                      Empate 1°
                    </span>
                  )}
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
