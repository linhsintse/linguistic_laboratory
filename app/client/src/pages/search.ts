const API_URL = 'http://localhost:3000/api';

interface Word {
    id: number;
    text: string;
}

export function renderSearch(element: HTMLElement) {
    element.innerHTML = `
        <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Search</h1>
            <div class="mb-4 flex space-x-2">
                <input id="search-input" type="text" placeholder="Search words..." class="border p-2 rounded w-full" />
                <button id="search-btn" class="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
            </div>
            <div id="search-results"></div>
        </div>
    `;

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchBtn = document.getElementById('search-btn');
    const resultsDiv = document.getElementById('search-results');

    const handleSearch = async () => {
        if (!searchInput || !resultsDiv) return;
        const query = searchInput.value.trim();
        if (!query) {
            resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
            return;
        }

        resultsDiv.innerHTML = '<p>Searching...</p>';

        try {
            const response = await fetch(`${API_URL}/words/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const words: Word[] = await response.json();

            if (words.length === 0) {
                resultsDiv.innerHTML = '<p>No words found.</p>';
            } else {
                resultsDiv.innerHTML = `
                    <ul class="list-disc pl-5">
                        ${words.map(w => `<li><strong>${w.text}</strong></li>`).join('')}
                    </ul>
                `;
            }
        } catch (error) {
            console.error('Failed to search words:', error);
            resultsDiv.innerHTML = '<p class="text-red-500">Failed to execute search.</p>';
        }
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
}
