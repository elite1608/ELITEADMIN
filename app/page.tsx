export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* Header */}
        <h1 className="text-4xl font-bold mb-2">
          💰 SISTEMA ELITE
        </h1>
        <p className="text-zinc-400 mb-10">
          Panel principal de gestión
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg hover:scale-105 transition">
            <h2 className="text-xl font-semibold mb-2">📊 Dashboard</h2>
            <p className="text-zinc-400">
              Ver métricas generales del sistema.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg hover:scale-105 transition">
            <h2 className="text-xl font-semibold mb-2">💵 Cobros</h2>
            <p className="text-zinc-400">
              Gestión y seguimiento de pagos.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg hover:scale-105 transition">
            <h2 className="text-xl font-semibold mb-2">⚙️ Configuración</h2>
            <p className="text-zinc-400">
              Ajustes del sistema.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
