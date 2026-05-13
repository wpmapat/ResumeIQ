import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import {
    getJobApplication, updateJobApplication, deleteJobApplication,
    getAIAnalysis, triggerAIAnalysis, getCoverLetter, generateCoverLetter,
} from '../services/api'

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

type JobApplication = {
    id: string
    companyName: string
    roleTitle: string
    status: ApplicationStatus
    appliedDate: string
    jobDescription: string
    notes: string
}

type AIAnalysis = {
    matchScore: number
    missingKeywords: string[]
    rewrittenBullets: string[]
    createdAt: string
}

type CoverLetter = {
    content: string
    createdAt: string
}

type Props = {
    appId: string
    onBack: () => void
    onDeleted: (id: string) => void
}

const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
    Applied:   { bg: '#ede9fe', text: '#6d28d9' },
    Interview: { bg: '#fef3c7', text: '#d97706' },
    Offer:     { bg: '#d1fae5', text: '#065f46' },
    Rejected:  { bg: '#fee2e2', text: '#b91c1c' },
}

const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
}

export default function ApplicationDetailPage({ appId, onBack, onDeleted }: Props) {
    const { instance } = useMsal()
    const [app, setApp] = useState<JobApplication | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('Applied')
    const [statusSaving, setStatusSaving] = useState(false)

    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
    const [analysisLoading, setAnalysisLoading] = useState(false)
    const [analysisError, setAnalysisError] = useState('')

    const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
    const [coverLetterLoading, setCoverLetterLoading] = useState(false)
    const [coverLetterError, setCoverLetterError] = useState('')

    useEffect(() => {
        Promise.all([
            getJobApplication(instance, appId),
            getAIAnalysis(instance, appId),
            getCoverLetter(instance, appId),
        ]).then(([appData, analysisData, coverLetterData]) => {
            setApp(appData)
            setSelectedStatus(appData.status)
            setAnalysis(analysisData)
            setCoverLetter(coverLetterData)
        }).finally(() => setLoading(false))
    }, [instance, appId])

    const handleStatusSave = async () => {
        if (!app) return
        setStatusSaving(true)
        try {
            const updated = await updateJobApplication(instance, app.id, { ...app, status: selectedStatus })
            setApp(updated)
        } finally {
            setStatusSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this application? This cannot be undone.')) return
        await deleteJobApplication(instance, appId)
        onDeleted(appId)
    }

    const handleAnalyse = async () => {
        setAnalysisLoading(true)
        setAnalysisError('')
        try {
            const result = await triggerAIAnalysis(instance, appId)
            setAnalysis(result)
        } catch (e: any) {
            setAnalysisError(e.message)
        } finally {
            setAnalysisLoading(false)
        }
    }

    const handleGenerateCoverLetter = async () => {
        setCoverLetterLoading(true)
        setCoverLetterError('')
        try {
            const result = await generateCoverLetter(instance, appId)
            setCoverLetter(result)
        } catch (e: any) {
            setCoverLetterError(e.message)
        } finally {
            setCoverLetterLoading(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading...</div>
    if (!app) return <div style={{ padding: '2rem', color: '#b91c1c' }}>Application not found.</div>

    const statusChanged = selectedStatus !== app.status

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            {/* Navbar */}
            <nav style={{
                background: '#4c1d95', padding: '0 2rem', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>ResumeIQ</span>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                {/* Back */}
                <button
                    onClick={onBack}
                    style={{ background: 'none', color: '#6d28d9', fontWeight: 600, padding: '0 0 1.25rem', fontSize: '0.9rem' }}
                >
                    ← Back to Applications
                </button>

                {/* Header */}
                <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>{app.roleTitle}</h2>
                        <p style={{ margin: '0.25rem 0 0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>{app.companyName}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>
                            Applied {new Date(app.appliedDate).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={handleDelete}
                        style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        Delete
                    </button>
                </div>

                {/* Status */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#374151' }}>Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as ApplicationStatus)}
                            style={{
                                padding: '0.5rem 0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                background: statusColors[selectedStatus].bg,
                                color: statusColors[selectedStatus].text,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {(['Applied', 'Interview', 'Offer', 'Rejected'] as ApplicationStatus[]).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {statusChanged && (
                            <button
                                onClick={handleStatusSave}
                                disabled={statusSaving}
                                style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, opacity: statusSaving ? 0.7 : 1 }}
                            >
                                {statusSaving ? 'Saving…' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {app.notes && (
                    <div style={sectionStyle}>
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#374151' }}>Notes</h3>
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.notes}</p>
                    </div>
                )}

                {/* Job Description */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#374151' }}>Job Description</h3>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>{app.jobDescription}</p>
                </div>

                {/* AI Analysis */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>AI Resume Analysis</h3>
                        <button
                            onClick={handleAnalyse}
                            disabled={analysisLoading}
                            style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, opacity: analysisLoading ? 0.7 : 1 }}
                        >
                            {analysisLoading ? 'Analysing…' : analysis ? 'Re-analyse' : 'Analyse Resume'}
                        </button>
                    </div>
                    {analysisError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{analysisError}</p>}
                    {analysis && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed' }}>{analysis.matchScore}%</span>
                                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>match score</span>
                            </div>
                            {analysis.missingKeywords.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Missing Keywords</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {analysis.missingKeywords.map(kw => (
                                            <span key={kw} style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem' }}>{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysis.rewrittenBullets.length > 0 && (
                                <div>
                                    <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Suggested Bullet Points</p>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        {analysis.rewrittenBullets.map((b, i) => <li key={i}>{b}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    {!analysis && !analysisLoading && (
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>No analysis yet. Click "Analyse Resume" to get AI feedback.</p>
                    )}
                </div>

                {/* Cover Letter */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Cover Letter</h3>
                        <button
                            onClick={handleGenerateCoverLetter}
                            disabled={coverLetterLoading}
                            style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, opacity: coverLetterLoading ? 0.7 : 1 }}
                        >
                            {coverLetterLoading ? 'Generating…' : coverLetter ? 'Regenerate' : 'Generate Cover Letter'}
                        </button>
                    </div>
                    {coverLetterError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{coverLetterError}</p>}
                    {coverLetter && (
                        <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                            {coverLetter.content}
                        </pre>
                    )}
                    {!coverLetter && !coverLetterLoading && (
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>No cover letter yet. Click "Generate Cover Letter" to create one.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
