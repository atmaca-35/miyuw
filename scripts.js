document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');
    
    let dictionaryData = {};
    let lastQuery = '';
    let hasError = false;

    try {
        const response = await fetch('vocabulary.json');
        if (!response.ok) {
            throw new Error('Yoksa bir yerlerde bir harf mi kayıp?');
        }
        dictionaryData = await response.json();

        const wordCount = Object.keys(dictionaryData).length;
        wordCountElement.innerHTML = `Türk dilinin <span class="highlight">${wordCount}</span> maddelik arkeolojisi.`;
    } catch (error) {
        console.error('Yoksa bir yerlerde bir harf mi kayıp?', error);
        hasError = true;

        wordCountElement.innerHTML = `<p class="error-message">Yoksa bir yerlerde bir harf mi kayıp?</p>`;
        
        searchContainer.classList.add('error'); 
        resultDiv.classList.add('hidden'); 
        ghostText.classList.add('hidden'); 
    }

    function searchWord(query) {
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;

        resultDiv.innerHTML = '';

        if (query.length === 0) {
            ghostText.textContent = "";
            if (!hasError) {
                searchContainer.classList.remove('error'); 
            }
            return;
        }

        const normalizedQuery = normalizeTurkish(query);

        // Tüm kelimeleri alfabetik sıraya göre sıralar
        const sortedWords = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word));

        // En yakın kelimeyi bulur
        const closestWord = sortedWords
            .find(({ word }) => word.startsWith(normalizedQuery));

        if (closestWord) {
            const wordDetails = dictionaryData[closestWord.original];
            const description = wordDetails.a.replace(/\n/g, "<br>");
            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
            resultDiv.appendChild(descriptionElement);
            
            const descriptionHeight = descriptionElement.offsetHeight;
            descriptionElement.style.maxHeight = `${descriptionHeight}px`; 

            ghostText.textContent = closestWord.word.substring(query.length);
            searchContainer.classList.remove('error'); 
        } else {
            ghostText.textContent = "";
            searchContainer.classList.add('error'); 
        }

        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';
    }

    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
            ALLOWED_ATTR: ['href', 'class'],
        });
    }

    function highlightWords(text) {
        const specialWords = {
            '01': 'Ön Türkçe',
            '02': 'Moğolca',
            '03': 'Eski Anadolu Türkçesi',
            '04': 'Osmanlı Türkçesi',
            '05': 'Türkiye Türkçesi',
            '06': 'Azerbaycan Türkçesi',
            '07': 'Kırgız Türkçesi',
            '08': 'Başkurt Türkçesi',
            '09': 'Kazak Türkçesi',
            '10': 'Kırgız Türkçesi',
            '11': 'Özbek Türkçesi',
            '12': 'Tatar Türkçesi',
            '13': 'Türkmen Türkçesi',
            '14': 'Uygur Türkçesi',
            '15': 'Çuvaş Türkçesi',
            '16': 'Göktürk Türkçesi',
            '17': 'Karahanlı Türkçesi'
        };

        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="purple">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    function updateSearchBoxPlaceholder(query) {
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.trim();
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });

    searchBox.addEventListener('keydown', (event) => {
        // Get the current cursor position (selectionStart)
        const cursorPosition = searchBox.selectionStart;

        // Space key's keyCode is 32
        if (event.keyCode === 32 && cursorPosition === 0) {
            event.preventDefault(); // Prevent space from being entered at the beginning
        }
    });
});