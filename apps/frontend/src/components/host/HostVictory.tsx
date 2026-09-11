import { RoomState } from "@party-games/shared";

interface HostVictoryProps {
  mimireto: NonNullable<RoomState["mimireto"]>;
}

export function HostVictory({ mimireto }: HostVictoryProps) {
  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <span className="text-7xl animate-bounce inline-block">🏆</span>
      <h1 className="text-6xl font-black text-amber-400 mb-4">
        ¡JUEGO TERMINADO!
      </h1>
      <div className="bg-slate-800 p-12 rounded-3xl border-4 border-slate-700 shadow-2xl min-w-[500px]">
        <p className="text-2xl text-slate-300 mb-6">El equipo ganador es...</p>

        {mimireto.teamAScore > mimireto.teamBScore ? (
          <h2 className="text-7xl font-black text-blue-400">EQUIPO A</h2>
        ) : mimireto.teamAScore < mimireto.teamBScore ? (
          <h2 className="text-7xl font-black text-rose-400">EQUIPO B</h2>
        ) : (
          <h2 className="text-7xl font-black text-amber-100">¡EMPATE!</h2>
        )}

        <div className="flex justify-center gap-12 mt-12 text-4xl font-black">
          <span className="text-blue-400">{mimireto.teamAScore} pts</span>
          <span className="text-slate-500">-</span>
          <span className="text-rose-400">{mimireto.teamBScore} pts</span>
        </div>
      </div>
    </div>
  );
}
