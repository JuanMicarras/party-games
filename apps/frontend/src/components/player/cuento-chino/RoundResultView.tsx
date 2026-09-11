import { RoundEvent } from "@party-games/shared";

interface RoundResultViewProps {
  roundEvents: RoundEvent[];
  currentUserId: string;
  totalScore: number;
  isSabio: boolean;
}

export function RoundResultView({
  roundEvents,
  currentUserId,
  totalScore,
  isSabio,
}: RoundResultViewProps) {
  // Eventos donde yo voté
  const myVoteEvent = roundEvents.find((e) => e.voterId === currentUserId);
  // Amigos que cayeron en mi mentira
  const friendsFooledByMe = roundEvents.filter(
    (e) => e.authorName && e.result === "FOOLED_BY_PLAYER" && e.pointsDelta === 0, // Eventos creados
  );

  return (
    <div className="space-y-4 text-center mt-4">
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4 text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 text-center">
          Resultados de tu Ronda
        </h3>

        {/* Si fue sabio */}
        {isSabio && (
          <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🌟</span>
            <div>
              <p className="text-sm font-bold text-amber-300">¡Sabio Bíblico!</p>
              <p className="text-xs text-amber-200">
                +2 puntos asegurados por saberte la respuesta de antemano.
              </p>
            </div>
          </div>
        )}

        {/* Mi voto */}
        {myVoteEvent && (
          <div
            className={`p-3.5 rounded-xl border text-sm font-medium ${
              myVoteEvent.result === "CORRECT"
                ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-200"
                : myVoteEvent.result === "FOOLED_BY_SABIO"
                  ? "bg-rose-950/70 border-rose-500 text-rose-200"
                  : "bg-slate-900 border-slate-700 text-slate-300"
            }`}
          >
            {myVoteEvent.result === "CORRECT" && (
              <p>🎉 ¡Acertaste la verdad bíblica! (+3 pts)</p>
            )}
            {myVoteEvent.result === "FOOLED_BY_SABIO" && (
              <p>
                💥 ¡Caíste en la <strong>Trampa del Sabio</strong>! (-1 pt)
              </p>
            )}
            {myVoteEvent.result === "FOOLED_BY_PLAYER" && (
              <p>
                🤥 Caíste en la mentira de <strong>{myVoteEvent.authorName}</strong> (+0 pts).
              </p>
            )}
            {myVoteEvent.result === "DEFAULT_LIE" && (
              <p>🤷 Elegiste una mentira del sistema (+0 pts).</p>
            )}
          </div>
        )}

        {/* Puntuación total */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Tu Puntuación Total:
          </span>
          <span className="text-2xl font-mono font-black text-amber-400">
            {totalScore} pts
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 animate-pulse">
        Mira la pantalla de TV para ver la tabla completa de posiciones.
      </p>
    </div>
  );
}
