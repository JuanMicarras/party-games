import { RoomState } from "@party-games/shared";

interface CuentoChinoHostBoardProps {
  room: RoomState;
  onNextQuestion: () => void;
  onResetToLobby?: () => void;
}

export function CuentoChinoHostBoard({
  room,
  onNextQuestion,
  onResetToLobby,
}: CuentoChinoHostBoardProps) {
  const { cuentoChino, players } = room;
  if (!cuentoChino || !cuentoChino.currentQuestion) return null;

  const {
    currentQuestionIndex,
    totalQuestions,
    currentQuestion,
    status,
    timeLeft,
    submittedLies,
    sabioPlayerIds,
    options,
    votes,
    scores,
    roundEvents,
  } = cuentoChino;

  // Ordenar leaderboard para la fase de revelación
  const sortedPlayers = [...players].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0),
  );

  return (
    <div className="text-center w-full max-w-5xl space-y-6 relative">
      {/* Código de sala flotante */}
      <div className="absolute -top-4 right-0 bg-slate-950 border-2 border-slate-700 px-6 py-2 rounded-2xl shadow-lg">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-0.5">
          Sala
        </span>
        <span className="text-2xl font-mono font-black text-amber-400">
          {room.roomCode}
        </span>
      </div>

      {/* Título de Juego y Progreso */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-4 py-1 rounded-full border border-amber-500/30">
          Cita Verdadera o Cuento Chino
        </span>
        <h2 className="text-slate-400 text-sm font-semibold mt-2">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions} • Cita:{" "}
          <span className="text-amber-400 font-bold">
            {currentQuestion.reference}
          </span>
        </h2>
      </div>

      {/* TARJETA PRINCIPAL DE LA PREGUNTA */}
      <div className="bg-slate-800/95 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
        <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed max-w-3xl mx-auto">
          {currentQuestion.question}
        </p>

        {/* RELOJ DE CUENTA REGRESIVA */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`text-6xl font-black font-mono tabular-nums transition-colors duration-300 ${
              timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-amber-400"
            }`}
          >
            00:{timeLeft.toString().padStart(2, "0")}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FASE 1: ESCRIBIENDO MENTIRAS */}
        {/* ------------------------------------------------------------- */}
        {status === "WRITING_LIES" && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <p className="text-slate-300 text-sm font-medium animate-pulse">
              ✍️ ¡Escriban su mentira en sus celulares para engañar a los demás!
            </p>

            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {players.map((p) => {
                const hasSubmitted = submittedLies[p.id] !== undefined;
                const isSabio = sabioPlayerIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${
                      isSabio
                        ? "bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-bounce"
                        : hasSubmitted
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                          : "bg-slate-900/80 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span>{isSabio ? "⭐" : hasSubmitted ? "✅" : "⏳"}</span>
                    <span>{p.name}</span>
                    {isSabio && (
                      <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded">
                        ¡Sabio!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FASE 2: VOTACIÓN */}
        {/* ------------------------------------------------------------- */}
        {status === "VOTING" && (
          <div className="space-y-6 pt-4 border-t border-slate-700">
            <p className="text-amber-300 text-lg font-bold animate-pulse">
              🗳️ ¿Cuál es la verdad bíblica? Voten en su celular:
            </p>

            {/* Opciones en minúsculas unificadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {options.map((opt, idx) => {
                const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md text-left"
                  >
                    <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-mono font-black text-lg border border-amber-500/30">
                      {letters[idx] || "•"}
                    </span>
                    <span className="text-xl font-medium text-slate-200 lowercase tracking-wide">
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-slate-400">
              Votos registrados:{" "}
              <span className="text-amber-400 font-bold">
                {Object.keys(votes).length}
              </span>{" "}
              de {players.length - sabioPlayerIds.length} votantes elegibles
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FASE 3: REVELACIÓN DE RESULTADOS */}
        {/* ------------------------------------------------------------- */}
        {status === "REVEALING" && (
          <div className="space-y-8 pt-4 border-t border-slate-700 text-left">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1">
                Respuesta Bíblica Correcta:
              </p>
              <div className="inline-block bg-emerald-950/80 border-2 border-emerald-500 px-6 py-2 rounded-2xl">
                <span className="text-2xl font-black text-emerald-300 lowercase">
                  {currentQuestion.correctAnswer}
                </span>
              </div>
            </div>

            {/* Eventos y caídas en trampas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Aciertos y Trampas de esta ronda:
              </h4>

              {roundEvents.length === 0 ? (
                <p className="text-sm text-slate-400 italic">
                  Nadie votó a tiempo en esta ronda.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roundEvents.map((evt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-between ${
                        evt.result === "CORRECT"
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                          : evt.result === "FOOLED_BY_SABIO"
                            ? "bg-rose-950/60 border-rose-500 text-rose-200 shadow-md"
                            : "bg-slate-900 border-slate-700 text-slate-300"
                      }`}
                    >
                      <div>
                        {evt.result === "CORRECT" && (
                          <span>
                            ⭐ <strong>{evt.voterName}</strong> adivinó la
                            verdad (<em>{evt.optionText}</em>).
                          </span>
                        )}
                        {evt.result === "FOOLED_BY_SABIO" && (
                          <span>
                            💥 <strong>{evt.voterName}</strong> cayó en la{" "}
                            <strong>TRAMPA DEL SABIO</strong> ({evt.authorName}
                            ).
                          </span>
                        )}
                        {evt.result === "FOOLED_BY_PLAYER" && (
                          <span>
                            🤥 <strong>{evt.voterName}</strong> cayó en la
                            mentira de <strong>{evt.authorName}</strong>.
                          </span>
                        )}
                        {evt.result === "DEFAULT_LIE" && (
                          <span>
                            🤷 <strong>{evt.voterName}</strong> eligió una
                            mentira del sistema.
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-black text-base ml-2 shrink-0 ${
                          evt.pointsDelta > 0
                            ? "text-emerald-400"
                            : evt.pointsDelta < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                        }`}
                      >
                        {evt.pointsDelta > 0 ? `+${evt.pointsDelta}` : evt.pointsDelta === 0 ? "+0" : evt.pointsDelta} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Marcador Acumulado */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3">
                🏆 Tabla de Posiciones Acumulada
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800"
                  >
                    <span className="text-xs font-semibold text-slate-300 truncate">
                      {idx + 1}. {p.name}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm ml-2">
                      {scores[p.id] || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Siguiente Pregunta */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNextQuestion}
                className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                {currentQuestionIndex + 1 >= totalQuestions
                  ? "🏆 Ver Ganadores Finales"
                  : "Siguiente Pregunta ➔"}
              </button>
            </div>
          </div>
        )}
      </div>

      {onResetToLobby && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetToLobby}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer"
          >
            Cancelar partida y volver al Lobby
          </button>
        </div>
      )}
    </div>
  );
}
