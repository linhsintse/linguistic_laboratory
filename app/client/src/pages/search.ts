const API_URL = 'http://localhost:3000/api';

export function renderSearch(element: HTMLElement) {
    element.innerHTML = `
        <main class="flex-grow flex flex-col items-center p-8 md:px-16 w-full">
            <div class="w-full max-w-4xl mb-12">
                <h1 class="font-serif font-bold text-3xl mb-2">Etymological Database</h1>
                <p class="text-[0.65rem] tracking-[0.2em] text-brand-gray uppercase mb-8">Corpus Search & Analysis</p>
                
                <div class="relative group flex gap-4">
                    <div class="relative flex-grow">
                        <input 
                            type="text" 
                            id="search-input" 
                            placeholder="Enter a word to analyze..." 
                            class="w-full border-b-2 border-brand-border py-6 pl-4 pr-4 text-2xl font-serif focus:outline-none focus:border-black transition-colors bg-transparent placeholder:text-gray-300"
                        />
                    </div>
                    <button 
                        id="search-button" 
                        class="bg-black text-white px-8 py-2 font-bold uppercase tracking-widest text-[0.65rem] hover:bg-gray-800 transition-colors mt-2 mb-2"
                    >
                        Analyze
                    </button>
                </div>
            </div>

            <div id="results-container" class="w-full max-w-4xl space-y-16">
                <div id="empty-state" class="py-16 flex flex-col items-center justify-center border-b border-brand-border">
                    <p class="text-brand-gray font-serif italic text-lg">Enter a term to generate its morphological equation and historical timeline.</p>
                </div>
            </div>
        </main>
    `;

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchButton = document.getElementById('search-button') as HTMLButtonElement;
    const resultsContainer = document.getElementById('results-container') as HTMLDivElement;

    // --- SANITIZATION & FORMATTING HELPERS ---
    
    const escapeHTML = (str: string | null) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    };

    const formatRelType = (type: string) => {
        if (!type) return 'ROOT';
        return type.replace(/_/g, ' ').replace('has ', '').toUpperCase();
    };

    // --- RENDER LOGIC ---

    function renderResults(data: any[], queriedWord: string) {
        const morphTypes = ['has_prefix', 'has_suffix', 'root', 'compound_of', 'has_confix', 'has_affix', 'has_prefix_with_root', 'has_suffix_with_root'];
        const lineTypes = ['inherited_from', 'borrowed_from', 'derived_from', 'calque_of', 'semantic_loan_of', 'learned_borrowing_from', 'orthographic_borrowing_from', 'unadapted_borrowing_from'];

        const morphology = data.filter(d => morphTypes.includes(d.reltype)).sort((a, b) => (a.position || 0) - (b.position || 0));
        const lineage = data.filter(d => lineTypes.includes(d.reltype));

        // 1. Morphological Equation (Card Layout)
        let morphHtml = '';
        if (morphology.length > 0) {
            morphHtml = morphology.map((m, index) => {
                const isLast = index === morphology.length - 1;
                const card = `
                    <div class="border border-brand-border p-5 bg-brand-lightGray min-w-[140px] max-w-[250px] shadow-sm hover:border-black transition-colors">
                        <div class="text-[0.6rem] font-bold tracking-widest text-brand-gray uppercase mb-2">${formatRelType(m.reltype)}</div>
                        <div class="text-3xl font-serif text-black break-words">${escapeHTML(m.related_term) || '?'}</div>
                        <div class="text-[0.6rem] text-brand-gray mt-3 uppercase tracking-wider font-bold">${escapeHTML(m.related_lang) || 'Unknown Origin'}</div>
                    </div>
                `;
                const plus = isLast ? '' : `<div class="text-2xl font-serif text-brand-gray px-2">+</div>`;
                return card + plus;
            }).join('');
        } else {
            morphHtml = `<p class="text-brand-gray italic font-serif text-lg">No morphological breakdown available in the corpus.</p>`;
        }
``
        // 2. Ancestral Timeline Layout
        let lineageHtml = '';
        if (lineage.length > 0) {
            lineageHtml = lineage.map(l => `
                <div class="relative group">
                    <div class="absolute -left-[2.40rem] top-2 w-4 h-4 rounded-full bg-brand-border border-4 border-white group-hover:bg-black transition-colors"></div>
                    <div class="text-[0.65rem] font-bold tracking-widest text-brand-gray uppercase mb-1 flex items-center gap-2">
                        <span class="text-[12px]">&uarr;</span>
                        ${formatRelType(l.reltype)}
                    </div>
                    <h4 class="text-3xl font-serif text-black mb-2 break-words">${escapeHTML(l.related_term) || '?'}</h4>
                    <div class="mt-1">
                        <span class="inline-flex items-center bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                            ${escapeHTML(l.related_lang) || 'Unknown Language'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            lineageHtml = `<p class="text-brand-gray italic font-serif text-lg">No ancestral lineage available in the corpus.</p>`;
        }

        // 3. Inject into the DOM
        resultsContainer.innerHTML = `
            <section class="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div class="flex items-center mb-8">
                    <h3 class="text-[0.7rem] uppercase tracking-[0.15em] text-brand-gray">Morphological Equation</h3>
                    <div class="flex-grow ml-4 border-t border-brand-border"></div>
                </div>
                
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex flex-col">
                        <div class="text-[0.6rem] font-bold tracking-widest text-brand-gray uppercase mb-2 opacity-0">TARGET</div>
                        <div class="text-4xl font-serif font-bold text-black break-words">${escapeHTML(queriedWord)}</div>
                    </div>
                    <div class="text-2xl font-serif text-brand-gray px-1 mt-4">=</div>
                    <div class="flex flex-wrap items-center gap-">
                        ${morphHtml}
                    </div>
                </div>
            </section>

            <section class="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 pb-16">
                <div class="flex items-center mb-10">
                    <h3 class="text-[0.7rem] uppercase tracking-[0.15em] text-brand-gray">Ancestral Timeline</h3>
                    <div class="flex-grow ml-4 border-t border-brand-border"></div>
                </div>
                
                <div class="ml-4 border-l-2 border-brand-border pl-8 relative space-y-12 py-4">
                    <div class="relative">
                        <div class="absolute -left-[2.40rem] top-2 w-4 h-4 rounded-full bg-black border-4 border-white z-10"></div>
                        <h4 class="text-3xl font-serif font-bold text-black flex items-baseline gap-4 break-words">
                            ${escapeHTML(queriedWord)} 
                            <span class="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-gray">English</span>
                        </h4>
                    </div>
                    ${lineageHtml}
                </div>
            </section>
        `;
    }

    // --- SEARCH EXECUTION ---

    async function performSearch() {
        const word = searchInput.value.trim().toLowerCase();
        if (!word) return;

        resultsContainer.innerHTML = `
            <div class="py-16 flex flex-col items-center justify-center">
                <p class="text-brand-gray font-serif italic text-lg">Querying linguistic database...</p>
            </div>
        `;

        try {
            const response = await fetch(`${API_URL}/etymology/${word}`);
            if (!response.ok) {
                if (response.status === 404) {
                    resultsContainer.innerHTML = `
                        <div class="py-16 flex flex-col items-center justify-center border-b border-brand-border">
                            <p class="text-black font-serif italic text-lg">No records found for "<span class="font-bold">${escapeHTML(word)}</span>".</p>
                            <p class="text-brand-gray text-sm mt-2">Try searching for a base root or checking the spelling.</p>
                        </div>
                    `;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const data = await response.json();
                renderResults(data, word);
            }
        } catch (error) {
            console.error("Search failed:", error);
            resultsContainer.innerHTML = `
                <div class="py-16 text-center text-red-500 font-serif italic">
                    A network error occurred while accessing the database.
                </div>
            `;
        }
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    searchInput.focus();
}