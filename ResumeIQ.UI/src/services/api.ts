import type { IPublicClientApplication } from '@azure/msal-browser'
import { loginRequest, apiBaseUrl } from '../authConfig'

async function getToken(instance: IPublicClientApplication): Promise<string> {
    const accounts = instance.getAllAccounts()
    const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
    })
    return response.accessToken
}

async function authFetch(instance: IPublicClientApplication, url: string, options: RequestInit = {}) {
    const token = await getToken(instance)
    return fetch(`${apiBaseUrl}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    })
}

export async function getJobApplications(instance: IPublicClientApplication) {
    const res = await authFetch(instance, '/api/jobapplications')
    if (!res.ok) throw new Error('Failed to fetch job applications')
    return res.json()
}

export async function createJobApplication(instance: IPublicClientApplication, data: object) {
    const res = await authFetch(instance, '/api/jobapplications', {
        method: 'POST',
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create job application')
    return res.json()
}

export async function deleteJobApplication(instance: IPublicClientApplication, id: string) {
    const res = await authFetch(instance, `/api/jobapplications/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete job application')
}
