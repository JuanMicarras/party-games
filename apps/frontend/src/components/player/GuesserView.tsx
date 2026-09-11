export function GuesserView() {
  return (
    <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 mt-4">
      <div className="text-5xl animate-bounce mb-4">🤔</div>
      <p className="font-bold text-xl text-amber-400">¡Adivina la palabra!</p>
      <p className="text-slate-400 text-sm mt-2">
        Escucha con atención las pistas de tu orador y no te dejes penalizar.
      </p>
    </div>
  );
}
