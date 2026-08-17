'use client'

import { useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import AddressDisplay from '@/components/shared/AddressDisplay'

const EMPTY_FORM = {
  label: '', company_name: '', contact_name: '',
  address_line_1: '', address_line_2: '',
  city: '', county: '', postcode: '', country: 'United Kingdom', phone: '',
}

function AddressForm({ data, onChange, onSave, onCancel, saving, error, title }) {
  function field(key, label, placeholder, required = false) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`af-${key}`} className="text-xs font-medium">
          {label}
          {!required && <span className="text-muted-foreground"> (optional)</span>}
          {required && ' *'}
        </Label>
        <Input
          id={`af-${key}`}
          value={data[key] ?? ''}
          onChange={e => onChange({ ...data, [key]: e.target.value })}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4 mt-3">
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">{field('label',          'Address label',  'e.g. Main Warehouse, Bolton Office')}</div>
        <div>                          {field('company_name',   'Company name',   'Acme Ltd')}</div>
        <div>                          {field('contact_name',   'Contact name',   'Jane Smith')}</div>
        <div className="sm:col-span-2">{field('address_line_1','Address line 1', '123 High Street', true)}</div>
        <div className="sm:col-span-2">{field('address_line_2','Address line 2', 'Unit 4, Floor 2')}</div>
        <div>                          {field('city',           'City / Town',    'Manchester', true)}</div>
        <div>                          {field('county',         'County',         'Greater Manchester')}</div>
        <div>                          {field('postcode',       'Postcode',       'M1 1AA', true)}</div>
        <div>                          {field('country',        'Country',        'United Kingdom', true)}</div>
        <div className="sm:col-span-2">{field('phone',          'Phone',          '+44 7700 900000')}</div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save address'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  )
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, deleting, settingDefault }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <AddressDisplay address={address} />
          {address.is_default && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <Star className="w-3 h-3" /> Default
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!address.is_default && (
            <button
              onClick={() => onSetDefault(address)}
              disabled={settingDefault === address.id}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Set as default"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(address)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(address.id)}
            disabled={deleting === address.id}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AddressBook({ initialAddresses = [] }) {
  const [addresses,      setAddresses]      = useState(initialAddresses)
  const [editingId,      setEditingId]      = useState(null)
  const [addingType,     setAddingType]     = useState(null)
  const [formData,       setFormData]       = useState(EMPTY_FORM)
  const [saving,         setSaving]         = useState(false)
  const [deleting,       setDeleting]       = useState(null)
  const [settingDefault, setSettingDefault] = useState(null)
  const [formError,      setFormError]      = useState(null)

  const billing  = addresses.filter(a => a.address_type === 'billing')
  const delivery = addresses.filter(a => a.address_type === 'delivery')

  function startEdit(addr) {
    setEditingId(addr.id)
    setAddingType(null)
    setFormData({ ...EMPTY_FORM, ...addr })
    setFormError(null)
  }

  function startAdd(type) {
    setAddingType(type)
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
    setFormError(null)
  }

  function cancelForm() {
    setEditingId(null)
    setAddingType(null)
    setFormData(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave() {
    setSaving(true)
    setFormError(null)
    try {
      const isEdit = !!editingId
      const url    = isEdit ? `/api/addresses/${editingId}` : '/api/addresses'
      const sameType = addresses.filter(a => a.address_type === addingType)
      const body   = isEdit
        ? formData
        : { ...formData, address_type: addingType, is_default: sameType.length === 0 }

      const res  = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.errors ? Object.values(data.errors)[0] : (data.error ?? 'Failed to save address'))
        return
      }

      const saved = data.address
      if (isEdit) {
        setAddresses(prev => prev.map(a => {
          if (a.id === saved.id) return saved
          if (saved.is_default && a.address_type === saved.address_type) return { ...a, is_default: false }
          return a
        }))
      } else {
        setAddresses(prev => [
          ...prev.map(a =>
            saved.is_default && a.address_type === saved.address_type
              ? { ...a, is_default: false }
              : a
          ),
          saved,
        ])
      }
      cancelForm()
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch {} finally {
      setDeleting(null)
    }
  }

  async function handleSetDefault(addr) {
    setSettingDefault(addr.id)
    try {
      const res = await fetch(`/api/addresses/${addr.id}`, { method: 'PATCH' })
      if (res.ok) {
        setAddresses(prev => prev.map(a =>
          a.address_type === addr.address_type
            ? { ...a, is_default: a.id === addr.id }
            : a
        ))
      }
    } catch {} finally {
      setSettingDefault(null)
    }
  }

  // Renders a billing or delivery section — called as a function, not as <Component />
  function renderSection(type, list, title) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {editingId === null && addingType !== type && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => startAdd(type)}>
              <Plus className="w-3 h-3" /> Add address
            </Button>
          )}
        </div>

        {list.length === 0 && addingType !== type && (
          <p className="text-sm text-muted-foreground italic">No {type} address on file.</p>
        )}

        {list.map(addr =>
          editingId === addr.id ? (
            <AddressForm
              key={addr.id}
              title="Edit address"
              data={formData}
              onChange={setFormData}
              onSave={handleSave}
              onCancel={cancelForm}
              saving={saving}
              error={formError}
            />
          ) : (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={startEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              deleting={deleting}
              settingDefault={settingDefault}
            />
          )
        )}

        {addingType === type && (
          <AddressForm
            title={`New ${type} address`}
            data={formData}
            onChange={setFormData}
            onSave={handleSave}
            onCancel={cancelForm}
            saving={saving}
            error={formError}
          />
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Addresses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderSection('billing',  billing,  'Billing address')}
        <Separator />
        {renderSection('delivery', delivery, 'Delivery addresses')}
      </CardContent>
    </Card>
  )
}
