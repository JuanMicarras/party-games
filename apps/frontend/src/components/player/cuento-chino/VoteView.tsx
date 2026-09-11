import { CuentoChinoOption } from "@party-games/shared";

interface VoteViewProps {
  options: CuentoChinoOption[];
  onVote: (optionId: string) => void;
  hasVoted: boolean;
  selectedOptionId?: string;
  currentUserId: string;
  isSabio: boolean;
}

export function VoteView({
  options,
  onVote,
  hasVoted,
  selectedOptionId,
  currentUserId,
  isSabio,
}: VoteViewProps) {
  if (isSabio) {
    return (
      <div className="bg-amber-950/80 border-2 border-amber-400 p-6 rounded-2xl text-center space-y-3 shadow-lg mt-4">
        <span className="text-5xl block animate-bounce">👑</span>
        <h3 className="text-xl font-black text-amber-300">
          ¡Ya demostraste tu sabiduría!
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Como supiste la verdad de antemano (+2 pts), no tienes permitido votar en esta ronda.
        </p>
        <p className="text-xs text-amber-400 font-bold bg-amber-900/40 p-2.5 rounded-xl border border-amber-500/30">
          👀 Mira la pantalla del TV y disfruta viendo quién cae en tu trampa (-1 pt para el que la elija).
        </p>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="bg-emerald-950/60 border border-emerald-500/50 p-6 rounded-2xl text-center animate-pulse mt-4">
        <span className="text-4xl block mb-2">🗳️</span>
        <h3 className="text-lg font-bold text-emerald-400">
          ¡Voto registrado!
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Esperando a que los demás terminen de votar...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 text-center">
      <p className="text-sm font-bold text-amber-400 uppercase tracking-wide">
        Elige la respuesta que crees verdadera:
      </p>

      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const isOwnLie = opt.authorId === currentUserId;
          const isSelected = selectedOptionId === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !isOwnLie && onVote(opt.id)}
              disabled={isOwnLie}
              className={`w-full py-4 px-4 rounded-xl font-bold text-lg text-left transition-all flex items-center justify-between border ${
                isOwnLie
                  ? "bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed"
                  : isSelected
                    ? "bg-blue-600 text-white border-blue-400 shadow-md"
                    : "bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-700 active:scale-[0.98] cursor-pointer"
              }`}
            >
              <span className="lowercase font-medium tracking-wide">
                {opt.text}
              </span>

              {isOwnLie && (
                <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Tu mentira
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
