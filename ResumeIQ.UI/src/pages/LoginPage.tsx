import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../authConfig'

export default function LoginPage() {
    const { instance } = useMsal()

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(console.error)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1>ResumeIQ</h1>
            <p>Maximize your chances of getting shortlisted — without spending hours tailoring every application.</p>
            <button onClick={handleLogin} style={{ marginTop: '2rem', padding: '0.75rem 2rem', fontSize: '1rem' }}>Sign in with Microsoft</button>
        </div>
    )
}
