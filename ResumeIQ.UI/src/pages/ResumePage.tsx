import { useEffect, useRef, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getResume, uploadResume, deleteResume, getResumeDownloadUrl, setPreferredResume } from '../services/api'

type Resume = {
    id: string
    fileName: string
    uploadedAt: string
    isPreferred: boolean
}

type Props = {
    onBack: () => void
}

export default function ResumePage({ onBack }: Props) {
    const { instance } = useMsal()
    const [resumes, setResumes] = useState<Resume[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getResume(instance)
            .then(data => setResumes(Array.isArray(data) ? data : data ? [data] : []))
            .catch(() => setError('Failed to load resumes'))
            .finally(() => setLoading(false))
    }, [instance])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            setError('File must be under 10 MB.')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        setUploading(true)
        setError('')
        try {
            const created = await uploadResume(instance, file)
            setResumes(prev => [created, ...prev])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleView = async (id: string) => {
        try {
            const { url } = await getResumeDownloadUrl(instance, id)
            window.open(url, '_blank')
        } catch {
            setError('Failed to generate download link.')
        }
    }

    const handleSetPreferred = async (id: string) => {
        try {
            await setPreferredResume(instance, id)
            setResumes(prev => prev.map(r => ({ ...r, isPreferred: r.id === id })))
        } catch {
            setError('Failed to set preferred resume.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this resume? This cannot be undone.')) return
        try {
            await deleteResume(instance, id)
            setResumes(prev => prev.filter(r => r.id !== id))
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937' }}>My Resumes</h2>
                        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                            AI analysis uses your most recently uploaded resume.
                        </p>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', opacity: uploading ? 0.7 : 1, whiteSpace: 'nowrap' }}
                    >
                        {uploading ? 'Uploading…' : '+ Upload Resume'}
                    </button>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {error && <p style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                {loading ? (
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                ) : resumes.length === 0 ? (
                    <div
                        style={{
                            background: 'white', borderRadius: '12px', border: '2px dashed #d8b4fe',
                            padding: '3rem 2rem', textAlign: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#374151' }}>Upload your first resume</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>PDF or DOCX, max 10 MB</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {resumes.map((resume) => (
                            <div key={resume.id} style={{
                                background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                border: resume.isPreferred ? '2px solid #7c3aed' : '2px solid transparent',
                            }}>
                                <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {resume.fileName}
                                        {resume.isPreferred && <span style={{ marginLeft: '0.5rem', background: '#ede9fe', color: '#6d28d9', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '20px', fontWeight: 600 }}>Preferred</span>}
                                    </p>
                                    <p style={{ margin: '0.15rem 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                                        Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    {!resume.isPreferred && (
                                        <button
                                            onClick={() => handleSetPreferred(resume.id)}
                                            style={{ background: '#f5f3ff', color: '#6d28d9', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            Set as Preferred
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleView(resume.id)}
                                        style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
