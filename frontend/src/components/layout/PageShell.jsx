export default function PageShell({
  eyebrow,
  title,
  desc,
  children,
  maxWidth
}) {
  return (
    <div className="extra-page">
      <section className="extra-hero">
        <div className="container">
          <p className="section-eyebrow">
            {eyebrow}
          </p>

          <h1 className="section-heading">
            {title}
          </h1>

          {desc && (
            <p className="extra-desc">
              {desc}
            </p>
          )}
        </div>
      </section>

      <main
        className="container extra-body"
        style={
          maxWidth
            ? { maxWidth }
            : undefined
        }
      >
        {children}
      </main>
    </div>
  );
}