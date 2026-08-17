'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [fields, setFields] = useState({
    full_name:       '',
    company_name:    '',
    company_vat:     '',
    phone:           '',
    // address
    address_line_1:  '',
    address_line_2:  '',
    city:            '',
    county:          '',
    postcode:        '',
    country:         'United Kingdom',
    // credentials
    email:           '',
    password:        '',
  })

  function set(key) {
    return (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function fieldError(key) {
    return fieldErrors[key] ? (
      <p className="text-sm text-destructive mt-1">{fieldErrors[key]}</p>
    ) : null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setLoading(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.errors) {
        setFieldErrors(data.errors)
      } else {
        setFormError(data.error ?? 'Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    // Account created server-side — sign in to establish the browser session
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: fields.email,
      password: fields.password,
    })

    if (signInError) {
      router.push('/login?registered=1')
      return
    }

    router.push('/pending')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Personal */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          type="text"
          autoComplete="name"
          required
          value={fields.full_name}
          onChange={set('full_name')}
          placeholder="Jane Smith"
        />
        {fieldError('full_name')}
      </div>

      <Separator />

      {/* Business */}
      <div className="space-y-2">
        <Label htmlFor="company_name">Company name *</Label>
        <Input
          id="company_name"
          type="text"
          autoComplete="organization"
          required
          value={fields.company_name}
          onChange={set('company_name')}
          placeholder="Acme Ltd"
        />
        {fieldError('company_name')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_vat">
          VAT number <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="company_vat"
          type="text"
          value={fields.company_vat}
          onChange={set('company_vat')}
          placeholder="GB123456789"
        />
        {fieldError('company_vat')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={set('phone')}
          placeholder="+44 7700 900000"
        />
        {fieldError('phone')}
      </div>

      <Separator />

      {/* Business address */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Business address</p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address line 1 *</Label>
            <Input
              id="address_line_1"
              type="text"
              autoComplete="address-line1"
              required
              value={fields.address_line_1}
              onChange={set('address_line_1')}
              placeholder="123 High Street"
            />
            {fieldError('address_line_1')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">
              Address line 2 <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="address_line_2"
              type="text"
              autoComplete="address-line2"
              value={fields.address_line_2}
              onChange={set('address_line_2')}
              placeholder="Unit 4, Floor 2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City / Town *</Label>
              <Input
                id="city"
                type="text"
                autoComplete="address-level2"
                required
                value={fields.city}
                onChange={set('city')}
                placeholder="Manchester"
              />
              {fieldError('city')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">
                County <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="county"
                type="text"
                value={fields.county}
                onChange={set('county')}
                placeholder="Greater Manchester"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                type="text"
                autoComplete="postal-code"
                required
                value={fields.postcode}
                onChange={set('postcode')}
                placeholder="M1 1AA"
              />
              {fieldError('postcode')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                type="text"
                autoComplete="country-name"
                required
                value={fields.country}
                onChange={set('country')}
                placeholder="United Kingdom"
              />
              {fieldError('country')}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Credentials */}
      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={fields.email}
          onChange={set('email')}
          placeholder="jane@acme.com"
        />
        {fieldError('email')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={fields.password}
          onChange={set('password')}
          placeholder="Minimum 8 characters"
        />
        {fieldError('password')}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit access request'}
      </Button>
    </form>
  )
}
