export default function PresenceBar({ theme, count }) {
  return (
    <div
      className="flex items-center gap-3 mx-auto max-w-2xl px-6 mt-4 mb-8 py-2.5 rounded-xl border animate-fade-in"
      style={{ backgroundColor: theme.bgPanel, borderColor: theme.line, color: theme.soft }}
    >
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="inline-block w-1.5 h-1.5 rounded-full animate-ember-pulse"
            style={{
              backgroundColor: theme.accent,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
      <span className="text-sm">
        此刻 <strong style={{ color: theme.accent }}>{count}</strong> 人和你读到这一章
      </span>
    </div>
  );
}
