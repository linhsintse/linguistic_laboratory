const API_URL = 'http://localhost:3000/api';

interface Morpheme {
    id: number;
    text: string;
    type: string;
}

export async function renderMorphologyLibrary(element: HTMLElement) {
    element.innerHTML = `
        <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Morphology Library</h1>
            <p class="mb-4">Here are the morphemes you've learned.</p>
            <div id="morpheme-list">Loading...</div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/morphemes`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const morphemes: Morpheme[] = await response.json();
        const listDiv = document.getElementById('morpheme-list');
        if (listDiv) {
            if (morphemes.length === 0) {
                listDiv.innerHTML = '<p>No morphemes found.</p>';
            } else {
                listDiv.innerHTML = `
                    <ul class="list-disc pl-5">
                        ${morphemes.map(m => `<li><strong>${m.text}</strong> (${m.type})</li>`).join('')}
                    </ul>
                `;
            }
        }
    } catch (error) {
        console.error('Failed to fetch morphemes:', error);
        const listDiv = document.getElementById('morpheme-list');
        if (listDiv) listDiv.innerHTML = '<p class="text-red-500">Failed to load morphemes.</p>';
    }
}
