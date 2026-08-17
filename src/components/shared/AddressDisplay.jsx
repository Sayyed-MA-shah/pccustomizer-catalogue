// Renders a structured address block from either a DB row or a JSONB snapshot.
export default function AddressDisplay({ address, className = '' }) {
  if (!address) return <span className="text-sm text-muted-foreground">—</span>

  const lines = [
    address.company_name,
    address.contact_name,
    address.address_line_1,
    address.address_line_2,
    [address.city, address.county, address.postcode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean)

  return (
    <div className={`space-y-0.5 ${className}`}>
      {address.label && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {address.label}
        </p>
      )}
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-foreground">{line}</p>
      ))}
      {address.phone && (
        <p className="text-sm text-muted-foreground">{address.phone}</p>
      )}
    </div>
  )
}
