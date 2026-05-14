import React, { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { getJobApplications, deleteJobApplication } from '../services/api'
import AddApplicationModal from './AddApplicationModal'
import ApplicationDetailPage from './ApplicationDetailPage'
import ResumePage from './ResumePage'
import InfoPage from './InfoPage'

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
    padding: '0.75rem 1.25rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
}

const tdStyle: React.CSSProperties = {
    padding: '1rem 1.25rem',
    fontSize: '0.9rem',
    color: '#374151',
}

const statusColors: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
    Applied:   { bg: '#ede9fe', text: '#6d28d9', border: '#7c3aed' },
    Interview: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
    Offer:     { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    Rejected:  { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
}

const statIcons: Record<ApplicationStatus, string> = {
    Applied: '📤',
    Interview: '🗓️',
    Offer: '🎉',
    Rejected: '❌',
}

export default function DashboardPage() {
    const { instance, accounts } = useMsal()
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
    const [showResume, setShowResume] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

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

    if (showResume) return <ResumePage onBack={() => setShowResume(false)} />
    if (showInfo) return <InfoPage onBack={() => setShowInfo(false)} />
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

    const firstName = accounts[0]?.name?.split(' ')[0] ?? 'there'
    const initials = accounts[0]?.name
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join('') ?? '?'

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
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}>
                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    ResumeIQ
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => setShowResume(true)} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        My Resume
                    </button>
                    <button onClick={() => setShowInfo(true)} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Help
                    </button>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '0.8rem',
                            border: '2px solid rgba(255,255,255,0.3)',
                            flexShrink: 0,
                        }}>
                            {initials}
                        </div>
                        <span style={{ color: '#ddd6fe', fontSize: '0.85rem' }}>{accounts[0]?.name}</span>
                    </div>
                    <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Sign out
                    </button>
                </div>
            </nav>

            {/* Welcome banner */}
            <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)', padding: '2rem 2rem 2.5rem' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h1 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: 700 }}>
                        Welcome back, {firstName}!
                    </h1>
                    <p style={{ margin: '0.4rem 0 0', color: '#ddd6fe', fontSize: '0.95rem' }}>
                        {applications.length === 0
                            ? 'Start tracking your job applications below.'
                            : `You have ${applications.length} application${applications.length !== 1 ? 's' : ''} in progress.`}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>

                {/* Stat cards */}
                {!loading && !error && applications.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        {(['Applied', 'Interview', 'Offer', 'Rejected'] as ApplicationStatus[]).map(status => {
                            const count = applications.filter(a => a.status === status).length
                            return (
                                <div key={status} style={{
                                    background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    borderTop: `3px solid ${statusColors[status].border}`,
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>{statIcons[status]}</span>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: statusColors[status].text, lineHeight: 1 }}>{count}</p>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{status}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>My Applications</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
                            padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(124,58,237,0.4)',
                        }}
                    >
                        + Add Application
                    </button>
                </div>

                {loading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem 0' }}>Loading...</p>}
                {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

                {/* Empty state */}
                {!loading && !error && applications.length === 0 && (
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '4rem 2rem',
                        textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '1.1rem' }}>No applications yet</h3>
                        <p style={{ margin: '0 0 1.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                            Track your first job application and let AI help you stand out.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
                                padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(124,58,237,0.4)',
                            }}
                        >
                            + Add your first application
                        </button>
                    </div>
                )}

                {/* Table */}
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
                                    <tr
                                        key={app.id}
                                        onClick={() => setSelectedAppId(app.id)}
                                        onMouseEnter={() => setHoveredRow(app.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        style={{
                                            borderBottom: i < applications.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            cursor: 'pointer',
                                            background: hoveredRow === app.id ? '#faf5ff' : 'white',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <td style={tdStyle}><span style={{ fontWeight: 600, color: '#111827' }}>{app.roleTitle}</span></td>
                                        <td style={{ ...tdStyle, color: '#6b7280' }}>{app.companyName}</td>
                                        <td style={{ ...tdStyle, color: '#6b7280' }}>{new Date(app.appliedDate).toLocaleDateString()}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                background: statusColors[app.status].bg,
                                                color: statusColors[app.status].text,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                            }}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }}
                                                style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
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
