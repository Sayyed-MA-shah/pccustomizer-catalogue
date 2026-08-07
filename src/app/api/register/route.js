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

  const fullName    = sanitiseText(body.full_name, 100)
  const companyName = sanitiseText(body.company_name, 150)
  const companyVat  = sanitiseText(body.company_vat, 50)
  const phone       = sanitiseText(body.phone, 30)
  const email       = sanitiseText(body.email, 254)
  const password    = typeof body.password === 'string' ? body.password : ''

  // Validate required fields
  const errors = {}
  if (!fullName)                errors.full_name    = 'Full name is required'
  if (!companyName)             errors.company_name = 'Company name is required'
  if (!email || !validateEmail(email)) errors.email = 'A valid email address is required'
  if (password.length < 8)     errors.password     = 'Password must be at least 8 characters'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const supabase = await createServiceClient()

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // set to true in Supabase dashboard for production
    user_metadata: {
      full_name:    fullName,
      company_name: companyName,
      company_vat:  companyVat || null,
      phone:        phone || null,
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('already registered') ||
        error.code === 'email_exists') {
      return NextResponse.json(
        { errors: { email: 'An account with this email already exists' } },
        { status: 409 }
      )
    }
    console.error('[register] createUser error:', error.message)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
