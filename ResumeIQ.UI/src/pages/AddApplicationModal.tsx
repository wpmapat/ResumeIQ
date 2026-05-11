import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { createJobApplication } from '../services/api'

type Props = {
    onClose: () => void
    onCreated: (app: any) => void
}

export default function AddApplicationModal({ onClose, onCreated }: Props) {
    const { instance } = useMsal()
    const [form, setForm] = useState({
        companyName: '',
        roleTitle: '',
        jobDescription: '',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.companyName || !form.roleTitle || !form.jobDescription) {
            setError('Company, role, and job description are required.')
            return
        }
        setSaving(true)
        try {
            const created = await createJobApplication(instance, form)
            onCreated(created)
            onClose()
        } catch {
            setError('Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', padding: '2rem',
                width: '100%', maxWidth: '560px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Add Application</h2>
                    <button onClick={onClose} style={{ background: 'none', color: '#6b7280', fontSize: '1.25rem', padding: '0.25rem 0.5rem' }}>✕</button>
                </div>

                {error && <p style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Company Name *</label>
                        <input name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} placeholder="e.g. Microsoft" />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Role Title *</label>
                        <input name="roleTitle" value={form.roleTitle} onChange={handleChange} style={inputStyle} placeholder="e.g. Senior Software Engineer" />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Job Description *</label>
                        <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange} style={{ ...inputStyle, height: '120px', resize: 'vertical' }} placeholder="Paste the job description here..." />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Applied Date</label>
                        <input type="date" name="appliedDate" value={form.appliedDate} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Notes</label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Any notes about this application..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={onClose} style={{ background: '#f3f4f6', color: '#374151' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ background: '#7c3aed', opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Saving...' : 'Save Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const fieldStyle: React.CSSProperties = { marginBottom: '1rem' }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }
