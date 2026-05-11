import type { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
    auth: {
        clientId: 'eb976d6a-5600-4005-b278-570c1831cf8f',
        authority: 'https://login.microsoftonline.com/9eff8c48-00fc-4b4e-9ccf-838c0f0f4bcb',
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    },
};

export const loginRequest: PopupRequest = {
    scopes: ['openid', 'profile', 'User.Read', 'api://eb976d6a-5600-4005-b278-570c1831cf8f/access_as_user'],
};

export const apiBaseUrl = 'https://resumeiq-api-anc0d2d6e8fefsd3.northcentralus-01.azurewebsites.net';
