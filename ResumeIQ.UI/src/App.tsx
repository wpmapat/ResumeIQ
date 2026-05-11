import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

function App() {
  return (
    <>
      <AuthenticatedTemplate>
        <DashboardPage />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
    </>
  )
}

export default App
