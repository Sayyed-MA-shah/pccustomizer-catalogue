export function sanitiseText(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

// Returns { address } on success, { errors } on failure.
export function validateAddress(body) {
  const address = {
    address_type:   ['billing', 'delivery'].includes(body.address_type) ? body.address_type : null,
    label:          sanitiseText(body.label, 100)          || null,
    company_name:   sanitiseText(body.company_name, 150)   || null,
    contact_name:   sanitiseText(body.contact_name, 100)   || null,
    address_line_1: sanitiseText(body.address_line_1, 200),
    address_line_2: sanitiseText(body.address_line_2, 200) || null,
    city:           sanitiseText(body.city, 100),
    county:         sanitiseText(body.county, 100)         || null,
    postcode:       sanitiseText(body.postcode, 20),
    country:        sanitiseText(body.country, 100)        || 'United Kingdom',
    phone:          sanitiseText(body.phone, 30)           || null,
    is_default:     body.is_default === true,
  }

  const errors = {}
  if (!address.address_type)   errors.address_type   = 'Invalid address type'
  if (!address.address_line_1) errors.address_line_1 = 'Address line 1 is required'
  if (!address.city)           errors.city           = 'City / town is required'
  if (!address.postcode)       errors.postcode       = 'Postcode is required'
  if (!address.country)        errors.country        = 'Country is required'

  if (Object.keys(errors).length > 0) return { errors }
  return { address }
}

// Build an immutable snapshot object from an address record.
export function buildAddressSnapshot(addr) {
  return {
    label:          addr.label          ?? null,
    company_name:   addr.company_name   ?? null,
    contact_name:   addr.contact_name   ?? null,
    address_line_1: addr.address_line_1,
    address_line_2: addr.address_line_2 ?? null,
    city:           addr.city,
    county:         addr.county         ?? null,
    postcode:       addr.postcode,
    country:        addr.country,
    phone:          addr.phone          ?? null,
  }
}
