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

const statusColors: Record<ApplicationStatus, string> = {
    Applied: '#0078d4',
    Interview: '#ff8c00',
    Offer: '#107c10',
    Rejected: '#d13438',
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
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
                <div />
                <h1 style={{ margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '2.5rem', color: '#7c3aed' }}>ResumeIQ</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>{accounts[0]?.name}</span>
                    <button onClick={handleLogout} style={{ background: '#666' }}>Sign out</button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>My Applications</h2>
                <button onClick={() => alert('Add Application — coming soon!')}>+ Add Application</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && applications.length === 0 && (
                <p style={{ color: '#666' }}>No applications yet. Add your first one!</p>
            )}

            {applications.map(app => (
                <div key={app.id} style={{
                    background: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{app.roleTitle}</div>
                        <div style={{ color: '#666', marginTop: '0.25rem' }}>{app.companyName}</div>
                        <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Applied: {new Date(app.appliedDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                            background: statusColors[app.status],
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                        }}>
                            {app.status}
                        </span>
                        <button
                            onClick={() => handleDelete(app.id)}
                            style={{ background: '#d13438', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
