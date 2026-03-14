const API_URL = 'http://localhost:3000/api';

interface User {
    id: number;
    email: string;
    name: string | null;
}

export async function renderAccount(element: HTMLElement) {
    element.innerHTML = `
        <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Account</h1>
            <div id="account-info">Loading account details...</div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/account`);
        const infoDiv = document.getElementById('account-info');

        if (response.status === 404) {
             if (infoDiv) infoDiv.innerHTML = '<p>No account found. Please register or sign in.</p>';
             return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const account: User = await response.json();

        if (infoDiv) {
            infoDiv.innerHTML = `
                <div class="bg-white p-4 rounded shadow border">
                    <p class="text-lg mb-2"><strong>Name:</strong> ${account.name || 'Not set'}</p>
                    <p class="text-lg"><strong>Email:</strong> ${account.email}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to fetch account:', error);
        const infoDiv = document.getElementById('account-info');
        if (infoDiv) infoDiv.innerHTML = '<p class="text-red-500">Failed to load account details.</p>';
    }
}
