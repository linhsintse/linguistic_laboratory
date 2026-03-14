const API_URL = 'http://localhost:3000/api';

interface Progress {
    totalWords: number;
    totalMorphemes: number;
}

export async function renderVocabularyProgress(element: HTMLElement) {
    element.innerHTML = `
        <div class="p-4">
            <h1 class="text-2xl font-bold mb-4">Vocabulary Progress</h1>
            <p class="mb-4">Track your learned vocabularies and used morphemes.</p>
            <div id="progress-data">Loading progress...</div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/progress`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const progress: Progress = await response.json();
        const dataDiv = document.getElementById('progress-data');
        if (dataDiv) {
            dataDiv.innerHTML = `
                <div class="bg-white p-4 rounded shadow border">
                    <p class="text-lg"><strong>Words Learned:</strong> ${progress.totalWords}</p>
                    <p class="text-lg"><strong>Morphemes Used:</strong> ${progress.totalMorphemes}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to fetch progress:', error);
        const dataDiv = document.getElementById('progress-data');
        if (dataDiv) dataDiv.innerHTML = '<p class="text-red-500">Failed to load progress data.</p>';
    }
}
