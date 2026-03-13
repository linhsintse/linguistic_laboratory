// --- Type Definitions ---
interface VocabularyWord {
  id: number;
  wordText: string;
  dayOfWeek: string;
}

// The base URL for the backend API.
const API_URL = 'http://localhost:3002/api';
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// --- State ---
let weekOffset = 0;
let wordsByDay: { [key: string]: string[] } = {};
let focusWordsByDay: { [key: string]: string } = {};

// --- Functions ---

/**
 * Get the date for Monday of a given week offset (ISO week).
 * @param offset - The week offset from the current week.
 */
function getWeekMonday(offset: number): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Adjust for Sunday (0) being end of ISO week
    const monday = new Date(today.setDate(today.getDate() + diff));
    monday.setDate(monday.getDate() + offset * 7);
    return monday;
}

/**
 * Updates the week display.
 */
function updateWeekDisplay() {
    const weekDisplay = document.getElementById('week-display') as HTMLSpanElement;
    if (!weekDisplay) return;
    const monday = getWeekMonday(weekOffset);
    const weekNumber = Math.ceil(monday.getDate() / 7);
    const month = monday.toLocaleString('default', { month: 'long' });
    weekDisplay.textContent = `Week ${weekNumber} — ${month}`;
}

function enterEditMode(slot: HTMLElement) {
    const existingInput = slot.querySelector('input.word-edit-input');
    if (existingInput) return; // Already in edit mode

    const wordTextSpan = slot.querySelector('.word-text') as HTMLAnchorElement;
    const currentWord = wordTextSpan ? wordTextSpan.innerText : '';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentWord;
    input.className = 'word-edit-input font-serif text-xl block leading-none mb-1 bg-transparent border-none p-0 w-full';
    input.style.outline = 'none';

    if (wordTextSpan) {
        wordTextSpan.replaceWith(input);
    } else {
        const placeholder = slot.querySelector('.font-serif.italic');
        if(placeholder) {
            placeholder.replaceWith(input);
        }
    }
    input.focus();

    const save = () => {
        const newWord = input.value.trim();
        const day = (slot as HTMLDivElement).dataset.day!;
        const index = parseInt((slot as HTMLDivElement).dataset.index!);
        
        if (!wordsByDay[day]) {
            wordsByDay[day] = [];
        }
        wordsByDay[day][index] = newWord;
        
        createAndPopulateCalendar();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            save();
        }
    });
}

/**
 * Generates the calendar grid and populates it with words.
 */
async function createAndPopulateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid') as HTMLDivElement;
    if (!calendarGrid) return;

    calendarGrid.innerHTML = ''; // Clear existing calendar
    updateWeekDisplay();

    if (Object.keys(wordsByDay).length === 0) {
        const words = await fetchWords(weekOffset);
        wordsByDay = {};
        focusWordsByDay = {};

        for (const day of DAYS) {
            wordsByDay[day] = [];
        }

        words.forEach(word => {
            const dayShort = word.dayOfWeek.substring(0, 3).toUpperCase();
            if (wordsByDay[dayShort]) {
                wordsByDay[dayShort].push(word.wordText);
            }
        });
    }


    for (const day of DAYS) {
        const dayColumn = document.createElement('section');
        dayColumn.className = 'day-column border-r border-gray-200';

        const dayDate = getWeekMonday(weekOffset);
        dayDate.setDate(dayDate.getDate() + DAYS.indexOf(day));

        dayColumn.innerHTML = `
            <div class="bg-academic-gray border-b border-gray-200 p-3 flex justify-between items-center">
                <span class="text-[11px] font-bold uppercase tracking-wider">${day}</span>
                <span class="text-[9px] text-text-muted italic">${dayDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}</span>
            </div>
            <div class="p-3 border-b border-gray-200 bg-white">
                <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">FOCUS</p>
                <input class="focus-input font-serif italic text-text-muted text-base bg-transparent border-none p-0 w-full" placeholder="e.g. ambi–" value="${focusWordsByDay[day] || ''}" data-day="${day}" />
            </div>
            <div class="word-slots-container">
                ${Array(7).fill(0).map((_, i) => {
                    const word = wordsByDay[day]?.[i] || '';
                    return `
                        <div class="word-slot p-3 h-24 flex flex-col justify-center" data-day="${day}" data-index="${i}">
                            <div class="flex items-start space-x-2">
                                <span class="text-[10px] font-bold text-text-muted mt-1">${i + 1}</span>
                                <div class="w-full">
                                    ${word ? `
                                        <a href="https://www.thewordfinder.com/define/${word.toLowerCase()}" target="_blank" class="word-text font-serif text-xl block leading-none mb-1 cursor-pointer">${word}</a>
                                        <span class="material-symbols-outlined edit-button text-[20px] text-gray-400 hover:text-black cursor-pointer select-none">edit</span>
                                    ` : `
                                        <span class="font-serif italic text-xl text-text-muted block leading-none mb-1 cursor-pointer">word...</span>
                                    `}
                                    <input class="morpheme-guide bg-transparent border-none py-1 mt-2 w-full text-sm" placeholder="prefix[root]suffix" />
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        calendarGrid.appendChild(dayColumn);
    }

    // Add event listeners for focus inputs to save state locally so it persists on re-render
    calendarGrid.querySelectorAll('.focus-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            focusWordsByDay[target.dataset.day!] = target.value;
        });
    });

     // Prevent clicks on morpheme inputs from bubbling up to the slot and triggering edit mode
     calendarGrid.querySelectorAll('.morpheme-guide').forEach(input => {
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

     // Add event listeners for editing
     calendarGrid.querySelectorAll('.word-slot').forEach(slot => {
        const editButton = slot.querySelector('.edit-button');
        if (editButton) {
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                enterEditMode(slot as HTMLElement);
            });
        }
        
        slot.addEventListener('click', () => {
            const wordText = slot.querySelector('.word-text');
            if (!wordText) {
                enterEditMode(slot as HTMLElement);
            }
        });
    });
}

/**
 * Fetches the list of words from the backend API for a specific week.
 * @param offset - The week offset from the current week.
 */
async function fetchWords(offset: number): Promise<VocabularyWord[]> {
  try {
    const monday = getWeekMonday(offset);
    const response = await fetch(`${API_URL}/words?date=${monday.toISOString()}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch words:', error);
    return [];
  }
}

/**
 * Clears all words for the current week from the database.
 * @param offset - The week offset from the current week.
 */
async function clearWords(offset: number) {
    try {
        const monday = getWeekMonday(offset);
        const response = await fetch(`${API_URL}/words?date=${monday.toISOString()}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Failed to clear words:', error);
    }
}

/**
 * Handles saving the progress.
 */
async function handleSaveProgress() {
    await clearWords(weekOffset);
    const savePromises: Promise<any>[] = [];

    const monday = getWeekMonday(weekOffset);

    for (const day in wordsByDay) {
        wordsByDay[day].forEach(wordText => {
            const dayOfWeek = day === 'SUN' ? 'Sunday' : day === 'MON' ? 'Monday' : day === 'TUE' ? 'Tuesday' : day === 'WED' ? 'Wednesday' : day === 'THU' ? 'Thursday' : day === 'FRI' ? 'Friday' : 'Saturday';

            if (wordText && dayOfWeek) {
                savePromises.push(fetch(`${API_URL}/words`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wordText, dayOfWeek, date: monday.toISOString() }),
                }).catch(error => console.error('Failed to save word:', error)));
            }
        });
    }

    await Promise.all(savePromises);
    alert('Progress saved!');
    // Reset wordsByDay to force a fetch on next calendar load
    wordsByDay = {};
}

function addEventListeners() {
    const saveButton = document.getElementById('save-progress-button') as HTMLButtonElement;
    const lastWeekButton = document.getElementById('last-week-button') as HTMLButtonElement;
    const nextWeekButton = document.getElementById('next-week-button') as HTMLButtonElement;
    const newWeekButton = document.getElementById('new-week-button') as HTMLButtonElement;

    if(saveButton) {
        saveButton.addEventListener('click', () => {
            handleSaveProgress();
        });
    }

    if(lastWeekButton) {
        lastWeekButton.addEventListener('click', () => {
            weekOffset--;
            wordsByDay = {};
            createAndPopulateCalendar();
        });
    }
    
    if(nextWeekButton) {
        nextWeekButton.addEventListener('click', () => {
            weekOffset++;
            wordsByDay = {};
            createAndPopulateCalendar();
        });
    }

    if(newWeekButton) {
        newWeekButton.addEventListener('click', () => {
            weekOffset++;
            wordsByDay = {};
            createAndPopulateCalendar();
        });
    }
}

export function renderCalendar(element: HTMLElement) {
    element.innerHTML = `
    <main class="calendar-container p-6">
        <div class="calendar-grid grid grid-cols-7 gap-0 bg-white border-t border-l border-b border-gray-200 shadow-sm max-w-[95%] mx-auto" id="calendar-grid">
        </div>
    </main>
    <footer class="border-t border-gray-200 bg-white py-4 px-8">
        <div class="flex justify-center">
            <button class="bg-accent-black text-white text-[10px] font-bold py-2.5 px-6 uppercase tracking-widest hover:bg-gray-800 transition-colors" id="save-progress-button">
                Save Progress
            </button>
        </div>
    </footer>
    `;
    createAndPopulateCalendar();
    addEventListeners();
}
