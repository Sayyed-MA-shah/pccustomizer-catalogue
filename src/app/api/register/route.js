import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitiseText(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const fullName      = sanitiseText(body.full_name, 100)
  const companyName   = sanitiseText(body.company_name, 150)
  const companyVat    = sanitiseText(body.company_vat, 50)
  const phone         = sanitiseText(body.phone, 30)
  const email         = sanitiseText(body.email, 254)
  const password      = typeof body.password === 'string' ? body.password : ''

  // Address fields
  const addressLine1  = sanitiseText(body.address_line_1, 200)
  const addressLine2  = sanitiseText(body.address_line_2, 200)
  const city          = sanitiseText(body.city, 100)
  const county        = sanitiseText(body.county, 100)
  const postcode      = sanitiseText(body.postcode, 20)
  const country       = sanitiseText(body.country, 100) || 'United Kingdom'

  const errors = {}
  if (!fullName)                            errors.full_name    = 'Full name is required'
  if (!companyName)                         errors.company_name = 'Company name is required'
  if (!email || !validateEmail(email))      errors.email        = 'A valid email address is required'
  if (password.length < 8)                 errors.password     = 'Password must be at least 8 characters'
  if (!addressLine1)                        errors.address_line_1 = 'Address line 1 is required'
  if (!city)                               errors.city         = 'City / town is required'
  if (!postcode)                           errors.postcode     = 'Postcode is required'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const supabase = await createServiceClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name:    fullName,
      company_name: companyName,
      company_vat:  companyVat  || null,
      phone:        phone       || null,
    },
  })

  if (error) {
    if (
      error.message?.toLowerCase().includes('already registered') ||
      error.code === 'email_exists'
    ) {
      return NextResponse.json(
        { errors: { email: 'An account with this email already exists' } },
        { status: 409 }
      )
    }
    console.error('[register] createUser error:', error.message)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }

  // Create default billing and delivery addresses from the submitted address.
  // These are created by the service role — customer doesn't exist as an auth session yet.
  const sharedAddress = {
    customer_id:    data.user.id,
    label:          'Primary',
    company_name:   companyName,
    contact_name:   fullName,
    address_line_1: addressLine1,
    address_line_2: addressLine2 || null,
    city,
    county:         county   || null,
    postcode,
    country,
    phone:          phone    || null,
    is_default:     true,
  }

  const [billingResult, deliveryResult] = await Promise.all([
    supabase.from('customer_addresses').insert({ ...sharedAddress, address_type: 'billing' }),
    supabase.from('customer_addresses').insert({ ...sharedAddress, address_type: 'delivery' }),
  ])

  if (billingResult.error || deliveryResult.error) {
    console.error('[register] address creation failed:',
      billingResult.error?.message,
      deliveryResult.error?.message,
    )
    // Registration still succeeds — customer can add addresses from account page
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
