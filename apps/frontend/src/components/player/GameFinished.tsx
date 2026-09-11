export function GameFinished() {
  return (
    <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl mt-4">
      <span className="text-6xl animate-bounce inline-block">🎉</span>
      <p className="mt-6 font-bold text-2xl text-amber-400">
        ¡Partida Finalizada!
      </p>
      <p className="text-slate-400 mt-2 text-sm">
        Mira los resultados en la pantalla principal.
      </p>
    </div>
  );
}
