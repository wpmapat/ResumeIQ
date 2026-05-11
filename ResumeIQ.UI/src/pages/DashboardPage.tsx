import { useMsal } from '@azure/msal-react'

export default function DashboardPage() {
    const { instance, accounts } = useMsal()

    const handleLogout = () => {
        instance.logoutPopup().catch(console.error)
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>ResumeIQ</h1>
                <div>
                    <span style={{ marginRight: '1rem' }}>{accounts[0]?.name}</span>
                    <button onClick={handleLogout}>Sign out</button>
                </div>
            </div>
            <h2>My Applications</h2>
            <p>Dashboard coming soon...</p>
        </div>
    )
}
