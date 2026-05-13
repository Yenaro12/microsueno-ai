function KPICards({ items = [] }) {
  return (
    <div className="analytics-kpi-grid">
      {items.map(({ label, value, sub, color }) => (
        <article key={label} className="analytics-kpi-card" style={{ '--kpi-color': color || 'var(--color-accent)' }}>
          <span className="analytics-kpi-label">{label}</span>
          <strong className="analytics-kpi-value">{value ?? '—'}</strong>
          {sub && <span className="analytics-kpi-sub">{sub}</span>}
        </article>
      ))}
    </div>
  )
}

export default KPICards
