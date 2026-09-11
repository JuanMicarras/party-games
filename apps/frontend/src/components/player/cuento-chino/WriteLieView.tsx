import { useState } from "react";
import { CuentoChinoQuestion } from "@party-games/shared";

interface WriteLieViewProps {
  question: CuentoChinoQuestion;
  onSubmitLie: (lie: string) => void;
  hasSubmitted: boolean;
  isSabio: boolean;
  feedbackMessage?: string;
}

export function WriteLieView({
  question,
  onSubmitLie,
  hasSubmitted,
  isSabio,
  feedbackMessage,
}: WriteLieViewProps) {
  const [lieText, setLieText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lieText.trim()) return;
    onSubmitLie(lieText.trim());
  };

  return (
    <div className="space-y-4 text-center mt-4">
      {/* Alerta del Sabio Bíblico si acertó la verdad */}
      {isSabio && (
        <div className="bg-amber-950/90 border-2 border-amber-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] text-left animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🌟</span>
            <span className="text-sm font-black text-amber-300 uppercase tracking-wide">
              ¡Eres el Sabio Bíblico! (+2 pts)
            </span>
          </div>
          <p className="text-xs text-amber-200 leading-relaxed">
            {feedbackMessage ||
              "¡Acertaste la respuesta real de la Biblia! Ya ganaste 2 puntos de bonificación. Ahora escribe una mentira creíble para engañar a tus amigos (si alguien cae en tu trampa, ¡le restarás 1 punto!)."}
          </p>
        </div>
      )}

      {/* Tarjeta de la pregunta */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-700 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
          Cita: {question.reference}
        </span>
        <p className="text-lg font-bold text-white mt-2 leading-snug">
          {question.question}
        </p>
      </div>

      {hasSubmitted && !isSabio ? (
        <div className="bg-emerald-950/60 border border-emerald-500/50 p-6 rounded-2xl animate-pulse">
          <span className="text-4xl mb-2 block">✅</span>
          <p className="text-emerald-400 font-bold text-lg">
            ¡Mentira enviada!
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Mira la pantalla de TV mientras los demás jugadores terminan.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              {isSabio
                ? "Escribe tu mentira trampa:"
                : "Inventa una mentira creíble:"}
            </label>
            <input
              type="text"
              value={lieText}
              onChange={(e) => setLieText(e.target.value)}
              placeholder="Ej: un león, alto, durmiendo..."
              className="w-full px-4 py-3.5 bg-slate-950 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 text-white font-medium text-lg"
              maxLength={45}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!lieText.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xl rounded-xl shadow-lg transition cursor-pointer active:translate-y-0.5"
          >
            {isSabio ? "Enviar Mentira Trampa" : "Enviar Mentira"}
          </button>
        </form>
      )}
    </div>
  );
}
