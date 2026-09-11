interface TeamBannerProps {
  team?: "A" | "B" | null;
}

export function TeamBanner({ team }: TeamBannerProps) {
  return (
    <div
      className={`p-2.5 text-center font-bold rounded-xl text-lg ${
        team === "A"
          ? "bg-rose-950/60 text-rose-300 border border-rose-700/60"
          : team === "B"
            ? "bg-sky-950/60 text-sky-300 border border-sky-700/60"
            : "bg-slate-800 text-slate-300 border border-slate-700"
      }`}
    >
      Equipo {team ?? "Sin Asignar"}
    </div>
  );
}
