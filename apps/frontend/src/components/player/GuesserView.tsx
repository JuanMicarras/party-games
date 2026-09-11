interface GuesserViewProps {
  status?: string;
}

export function GuesserView({ status }: GuesserViewProps) {
  const isPaused = status === "PAUSED";

  return (
    <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800 mt-4 shadow-lg">
      <div className="text-5xl animate-bounce mb-4">
        {isPaused ? "⏸️" : "🤔"}
      </div>
      <p className="font-bold text-xl text-amber-400">
        {isPaused ? "Juego en Pausa" : "¡Adivina la palabra!"}
      </p>
      <p className="text-slate-400 text-sm mt-2">
        {isPaused
          ? "Alguien se ha desconectado. Esperando que el orador reanude el reloj..."
          : "Escucha con atención las pistas de tu orador y no te dejes penalizar."}
      </p>
    </div>
  );
}
