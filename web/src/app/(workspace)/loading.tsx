export default function Loading() {
  return (
    <div className="page" aria-label="Loading" role="status">
      <div className="skeleton" style={{ width: 150, marginBottom: 40 }} />
      <div
        className="skeleton"
        style={{ width: 240, height: 42, marginBottom: 36 }}
      />
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="skeleton"
          style={{ height: 65, marginBottom: 20 }}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
