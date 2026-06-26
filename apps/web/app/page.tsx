export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 40, maxWidth: 640 }}>
      <h1>Shiplog PM</h1>
      <p>
        The pipeline is wired up. POST a list of items to <code>/api/ship</code>{" "}
        to trigger a manual ship and fan it out to your configured
        destinations.
      </p>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 8, overflowX: "auto" }}>
{`curl -X POST http://localhost:3000/api/ship \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"kind":"feature","title":"Dark mode shipped"}]}'`}
      </pre>
    </main>
  );
}
