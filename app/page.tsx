export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Vinitaly Social</h1>
        <p className="text-gray-400 text-lg mb-8">Tool interno gestione social media</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Accedi
          </a>
        </div>
      </div>
    </main>
  )
}
