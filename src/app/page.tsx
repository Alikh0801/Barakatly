export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-6">
      <main className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-4xl text-white">
          🌿
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-green-900">
          BARAKATLY
        </h1>
        <p className="text-lg text-green-700">
          Fermerlərindən birbaşa təzə və organik kənd məhsulları
        </p>
        <p className="text-sm text-zinc-500">Layihə hazırlanır...</p>
      </main>
    </div>
  );
}
