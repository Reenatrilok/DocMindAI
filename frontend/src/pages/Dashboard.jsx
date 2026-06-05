export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-72 bg-black/30 border-r border-white/10 p-6">

        <h1 className="text-3xl font-bold mb-10">
          🚀 DocMind AI
        </h1>

        <div className="space-y-3">

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            🏠 Dashboard
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            📄 Merge PDF
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            ✂️ Split PDF
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            🗜️ Compress PDF
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            🧠 AI Summary
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            📝 Notes Generator
          </button>

          <button className="w-full text-left p-3 rounded-xl hover:bg-white/10">
            💼 Resume Analyzer
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">

        <h1 className="text-5xl font-bold mb-8">
          Welcome to DocMind AI
        </h1>

        {/* Upload Area */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center">

          <h2 className="text-3xl font-bold mb-4">
            📤 Upload Your PDF
          </h2>

          <p className="text-gray-400 mb-6">
            Drag & Drop your files here
          </p>

          <button className="bg-blue-600 px-8 py-4 rounded-2xl hover:bg-blue-500">
            Choose File
          </button>

        </div>

        {/* Recent Documents */}
        <div className="mt-10">

          <h2 className="text-3xl font-bold mb-6">
            Recent Documents
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-white/5 p-6 rounded-2xl">
              📄 Resume.pdf
            </div>

            <div className="bg-white/5 p-6 rounded-2xl">
              📄 Assignment.pdf
            </div>

            <div className="bg-white/5 p-6 rounded-2xl">
              📄 Research.pdf
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}