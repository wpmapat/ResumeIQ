import type { IPublicClientApplication } from '@azure/msal-browser'
import { apiBaseUrl } from '../authConfig'

const apiScopes = ['api://eb976d6a-5600-4005-b278-570c1831cf8f/access_as_user']

async function getToken(instance: IPublicClientApplication): Promise<string> {
    const accounts = instance.getAllAccounts()
    const response = await instance.acquireTokenSilent({
        scopes: apiScopes,
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

export async function getResume(instance: IPublicClientApplication) {
    const res = await authFetch(instance, '/api/resume')
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch resume')
    return res.json()
}

export async function getResumeDownloadUrl(instance: IPublicClientApplication, id: string): Promise<{ url: string; fileName: string }> {
    const res = await authFetch(instance, `/api/resume/${id}/download`)
    if (!res.ok) throw new Error('Failed to get download URL')
    return res.json()
}

export async function uploadResume(instance: IPublicClientApplication, file: File) {
    const token = await getToken(instance)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${apiBaseUrl}/api/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to upload resume')
    }
    return res.json()
}

export async function deleteResume(instance: IPublicClientApplication, id: string) {
    const res = await authFetch(instance, `/api/resume/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete resume')
}

export async function getJobApplication(instance: IPublicClientApplication, id: string) {
    const res = await authFetch(instance, `/api/jobapplications/${id}`)
    if (!res.ok) throw new Error('Failed to fetch job application')
    return res.json()
}

export async function updateJobApplication(instance: IPublicClientApplication, id: string, data: object) {
    const res = await authFetch(instance, `/api/jobapplications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update job application')
    return res.json()
}

export async function getAIAnalysis(instance: IPublicClientApplication, jobApplicationId: string) {
    const res = await authFetch(instance, `/api/jobapplications/${jobApplicationId}/analysis`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch analysis')
    return res.json()
}

export async function triggerAIAnalysis(instance: IPublicClientApplication, jobApplicationId: string) {
    const res = await authFetch(instance, `/api/jobapplications/${jobApplicationId}/analysis`, { method: 'POST' })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to analyse resume')
    }
    return res.json()
}

export async function getCoverLetter(instance: IPublicClientApplication, jobApplicationId: string) {
    const res = await authFetch(instance, `/api/jobapplications/${jobApplicationId}/coverletter`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch cover letter')
    return res.json()
}

export async function generateCoverLetter(instance: IPublicClientApplication, jobApplicationId: string) {
    const res = await authFetch(instance, `/api/jobapplications/${jobApplicationId}/coverletter`, { method: 'POST' })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to generate cover letter')
    }
    return res.json()
}
