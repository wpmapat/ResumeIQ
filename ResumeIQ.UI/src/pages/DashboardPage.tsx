import React, { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getJobApplications, deleteJobApplication } from '../services/api'
import AddApplicationModal from './AddApplicationModal'
import ApplicationDetailPage from './ApplicationDetailPage'
import ResumePage from './ResumePage'

type ApplicationStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

type JobApplication = {
    id: string
    companyName: string
    roleTitle: string
    status: ApplicationStatus
    appliedDate: string
    notes: string
}

const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
    padding: '1rem',
    fontSize: '0.9rem',
    color: '#374151',
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
    const [showModal, setShowModal] = useState(false)
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
    const [showResume, setShowResume] = useState(false)

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

    if (showResume) {
        return <ResumePage onBack={() => setShowResume(false)} />
    }

    if (selectedAppId) {
        return (
            <ApplicationDetailPage
                appId={selectedAppId}
                onBack={() => setSelectedAppId(null)}
                onDeleted={(id) => {
                    setApplications(prev => prev.filter(a => a.id !== id))
                    setSelectedAppId(null)
                }}
            />
        )
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
                    <button
                        onClick={() => setShowResume(true)}
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                        My Resume
                    </button>
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
                        onClick={() => setShowModal(true)}
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

                {applications.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Company</th>
                                    <th style={thStyle}>Applied Date</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app, i) => (
                                    <tr key={app.id} onClick={() => setSelectedAppId(app.id)} style={{ borderBottom: i < applications.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}>
                                        <td style={tdStyle}><span style={{ fontWeight: 600, color: '#111827' }}>{app.roleTitle}</span></td>
                                        <td style={tdStyle}>{app.companyName}</td>
                                        <td style={tdStyle}>{new Date(app.appliedDate).toLocaleDateString()}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                background: statusColors[app.status].bg,
                                                color: statusColors[app.status].text,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }}
                                                style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {showModal && (
                <AddApplicationModal
                    onClose={() => setShowModal(false)}
                    onCreated={(app) => setApplications(prev => [app, ...prev])}
                />
            )}
        </div>
    )
}
