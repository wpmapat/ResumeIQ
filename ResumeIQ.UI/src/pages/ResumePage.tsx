import { useEffect, useRef, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getResume, uploadResume, deleteResume, getResumeDownloadUrl } from '../services/api'

type Resume = {
    id: string
    fileName: string
    uploadedAt: string
}

type Props = {
    onBack: () => void
}

const sectionStyle: React.CSSProperties = {
    background: 'white', borderRadius: '12px', padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.25rem',
}

export default function ResumePage({ onBack }: Props) {
    const { instance } = useMsal()
    const [resume, setResume] = useState<Resume | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getResume(instance)
            .then(setResume)
            .catch(() => setError('Failed to load resume'))
            .finally(() => setLoading(false))
    }, [instance])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setError('')
        try {
            const result = await uploadResume(instance, file)
            setResume(result)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleView = async () => {
        try {
            const { url } = await getResumeDownloadUrl(instance)
            window.open(url, '_blank')
        } catch {
            setError('Failed to generate download link.')
        }
    }

    const handleDelete = async () => {
        if (!resume) return
        if (!confirm('Delete your resume? This cannot be undone.')) return
        try {
            await deleteResume(instance, resume.id)
            setResume(null)
        } catch {
            setError('Failed to delete resume.')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            <nav style={{
                background: '#4c1d95', padding: '0 2rem', height: '64px',
                display: 'flex', alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>ResumeIQ</span>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
                <button onClick={onBack} style={{ background: 'none', color: '#6d28d9', fontWeight: 600, padding: '0 0 1.25rem', fontSize: '0.9rem' }}>
                    ← Back to Applications
                </button>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937' }}>My Resume</h2>
                    <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                        Upload your resume to enable AI analysis and cover letter generation.
                    </p>
                </div>

                {error && <p style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                {loading ? (
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                ) : resume ? (
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: '#ede9fe', borderRadius: '10px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                📄
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{resume.fileName}</p>
                                <p style={{ margin: '0.2rem 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                                    Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleView}
                                style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                                View
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', opacity: uploading ? 0.7 : 1 }}
                            >
                                {uploading ? 'Uploading…' : 'Replace'}
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                                Delete
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                ) : (
                    <div
                        style={{
                            ...sectionStyle,
                            border: '2px dashed #d8b4fe',
                            textAlign: 'center',
                            padding: '3rem 2rem',
                            cursor: 'pointer',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#374151' }}>
                            {uploading ? 'Uploading…' : 'Upload your resume'}
                        </p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>PDF or DOCX, max 10 MB</p>
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>
                )}
            </div>
        </div>
    )
}
