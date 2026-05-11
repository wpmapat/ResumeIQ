import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getJobApplications, deleteJobApplication } from '../services/api'

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

type JobApplication = {
    id: string
    companyName: string
    roleTitle: string
    status: ApplicationStatus
    appliedDate: string
    notes: string
}

const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
    Applied:   { bg: '#ede9fe', text: '#6d28d9' },
    Interview: { bg: '#fef3c7', text: '#d97706' },
    Offer:     { bg: '#d1fae5', text: '#065f46' },
    Rejected:  { bg: '#fee2e2', text: '#b91c1c' },
}

export default function DashboardPage() {
    const { instance, accounts } = useMsal()
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        getJobApplications(instance)
            .then(setApplications)
            .catch(() => setError('Failed to load applications'))
            .finally(() => setLoading(false))
    }, [instance])

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this application?')) return
        await deleteJobApplication(instance, id)
        setApplications(prev => prev.filter(a => a.id !== id))
    }

    const handleLogout = () => {
        instance.logoutRedirect().catch(console.error)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            {/* Navbar */}
            <nav style={{
                background: '#4c1d95',
                padding: '0 2rem',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    ResumeIQ
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#ddd6fe', fontSize: '0.9rem' }}>{accounts[0]?.name}</span>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            {/* Content */}
            <div style={{ padding: '2.5rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f2937' }}>My Applications</h2>
                        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                            {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
                        </p>
                    </div>
                    <button
                        onClick={() => alert('Add Application — coming soon!')}
                        style={{ background: '#7c3aed', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600 }}
                    >
                        + Add Application
                    </button>
                </div>

                {loading && <p style={{ color: '#6b7280' }}>Loading...</p>}
                {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

                {!loading && !error && applications.length === 0 && (
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'left',
                        color: '#6b7280',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No applications yet</p>
                        <p style={{ fontSize: '0.9rem' }}>Click "+ Add Application" to track your first job application.</p>
                    </div>
                )}

                {applications.map(app => (
                    <div key={app.id} style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        cursor: 'pointer',
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{app.roleTitle}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.2rem' }}>{app.companyName}</div>
                            <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                Applied {new Date(app.appliedDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                                background: statusColors[app.status].bg,
                                color: statusColors[app.status].text,
                                padding: '0.3rem 0.85rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}>
                                {app.status}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }}
                                style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
