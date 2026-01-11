/**
 * A Word for This - Main Application
 *
 * A minimalist web app that finds the perfect word
 * for any emotion using AI.
 */

// ============================================
// CONFIGURATION
// ============================================
const Config = {
    // API calls now handled by serverless function
    // No API key needed in client-side code!

    // Constraints
    MAX_CHARS: 200,

    // Rotating placeholder examples
    PLACEHOLDERS: [
        'The feeling when...',
        'That moment when you walk into a room and forget why...',
        'The bittersweet ache of returning home after years away...',
        'The quiet satisfaction of a perfectly brewed cup of coffee...',
        'When you see something beautiful and wish you could share it...',
        'The weight of unspoken words...',
        'That fleeting connection with a stranger you\'ll never see again...',
        'The relief and sadness when something difficult finally ends...'
    ],

    // localStorage keys
    STORAGE_KEY: 'wordForThis_history',
    TUTORIAL_SEEN_KEY: 'wordForThis_tutorialSeen',

    // System prompt for the AI
    SYSTEM_PROMPT: `You are a linguistic expert and poet. When given a description of an emotion or feeling, find the single best word in any language that captures it perfectly.

Respond in this exact JSON format only, with no additional text:
{
    "word": "the word",
    "pronunciation": "phonetic pronunciation",
    "origin": "language of origin",
    "definition": "a poetic, precise definition of the word"
}

Be poetic yet precise. Prefer obscure, beautiful words from any language. If the word is not English, include the original script if applicable.`,

    // Canvas settings for share feature
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600,
        PADDING: 60,
        BACKGROUND: '#F5F5F0',
        TEXT_COLOR: '#000000'
    }
};

// ============================================
// UTILITIES
// ============================================
const Utils = {
    /**
     * Escape HTML special characters
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================
// HISTORY MODULE
// ============================================
const History = {
    /**
     * Load history from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(Config.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    },

    /**
     * Save history to localStorage
     */
    save(history) {
        try {
            localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    },

    /**
     * Add entry to history
     */
    add(entry) {
        const history = this.load();

        // Check for duplicates (same word)
        const exists = history.some(h =>
            h.word.toLowerCase() === entry.word.toLowerCase()
        );

        if (!exists) {
            history.push(entry);
            this.save(history);
        }

        return history;
    },

    /**
     * Clear all history
     */
    clear() {
        localStorage.removeItem(Config.STORAGE_KEY);
        return [];
    }
};

// ============================================
// UI MODULE
// ============================================
const UI = {
    elements: {},

    /**
     * Initialize UI - cache DOM references
     */
    init() {
        this.elements = {
            form: document.getElementById('word-form'),
            input: document.getElementById('emotion-input'),
            charCount: document.getElementById('char-count'),
            submitBtn: document.getElementById('submit-btn'),
            loadingSection: document.getElementById('loading-section'),
            resultSection: document.getElementById('result-section'),
            errorSection: document.getElementById('error-section'),
            errorMessage: document.getElementById('error-message'),
            resultWord: document.getElementById('result-word'),
            resultPronunciation: document.getElementById('result-pronunciation'),
            resultOrigin: document.getElementById('result-origin'),
            resultDefinition: document.getElementById('result-definition'),
            shareBtn: document.getElementById('share-btn'),
            shareXBtn: document.getElementById('share-x-btn'),
            newSearchBtn: document.getElementById('new-search-btn'),
            retryBtn: document.getElementById('retry-btn'),
            archiveToggle: document.getElementById('archive-toggle'),
            archiveList: document.getElementById('archive-list'),
            archiveItems: document.getElementById('archive-items'),
            clearArchive: document.getElementById('clear-archive'),
            canvas: document.getElementById('share-canvas')
        };
    },

    /**
     * Update character count display
     */
    updateCharCount(count) {
        this.elements.charCount.textContent = `${count} / ${Config.MAX_CHARS}`;
    },

    /**
     * Render loading state
     */
    renderLoadingState(isLoading) {
        this.elements.loadingSection.hidden = !isLoading;
        this.elements.submitBtn.disabled = isLoading;

        if (isLoading) {
            // Only hide other sections when starting to load
            this.elements.resultSection.hidden = true;
            this.elements.errorSection.hidden = true;
            this.elements.submitBtn.textContent = 'Searching...';
        } else {
            this.elements.submitBtn.textContent = 'Find the Word';
        }
    },

    /**
     * Render result
     */
    renderResult(result) {
        // Hide loading
        this.elements.loadingSection.hidden = true;
        this.elements.errorSection.hidden = true;

        // Add showing-result class to body for screen transition
        document.body.classList.add('showing-result');

        // Populate result fields
        this.elements.resultWord.textContent = result.word;
        this.elements.resultPronunciation.textContent = result.pronunciation
            ? `/${result.pronunciation}/`
            : '';
        this.elements.resultOrigin.textContent = result.origin;
        this.elements.resultDefinition.textContent = result.definition;

        // Show result section with fade in
        this.elements.resultSection.hidden = false;
        const wordCard = this.elements.resultSection.querySelector('.word-card');
        wordCard.classList.remove('fade-in');
        void wordCard.offsetWidth; // Force reflow
        wordCard.classList.add('fade-in');

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Render error state
     */
    renderError(error) {
        this.elements.loadingSection.hidden = true;
        this.elements.resultSection.hidden = true;
        this.elements.errorSection.hidden = false;

        const message = error instanceof Error ? error.message : error;
        this.elements.errorMessage.textContent = message;
    },

    /**
     * Reset to input state
     */
    resetToInput() {
        // Remove showing-result class for screen transition back
        document.body.classList.remove('showing-result');

        this.elements.loadingSection.hidden = true;
        this.elements.resultSection.hidden = true;
        this.elements.errorSection.hidden = true;
        this.elements.input.value = '';
        this.updateCharCount(0);

        // Scroll to top then focus input
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            this.elements.input.focus();
        }, 300);
    },

    /**
     * Toggle archive visibility
     */
    toggleArchiveVisibility(isOpen) {
        this.elements.archiveList.hidden = !isOpen;
        this.elements.archiveToggle.textContent = isOpen ? 'Hide Archive' : 'View Archive';
    },

    /**
     * Render archive list
     */
    renderArchive(history) {
        this.elements.archiveItems.innerHTML = '';

        if (history.length === 0) {
            this.elements.archiveItems.innerHTML = '<li class="archive-empty">No words saved yet</li>';
            this.elements.clearArchive.hidden = true;
            return;
        }

        this.elements.clearArchive.hidden = false;

        // Sort by date, newest first
        const sorted = [...history].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        sorted.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'archive-item';
            li.dataset.index = index;

            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            li.innerHTML = `
                <span class="archive-item-word">${Utils.escapeHtml(entry.word)}</span>
                <span class="archive-item-date">${formattedDate}</span>
            `;

            li.addEventListener('click', () => {
                State.setResult(entry);
            });

            this.elements.archiveItems.appendChild(li);
        });
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================
const State = {
    currentResult: null,
    isLoading: false,
    error: null,
    history: [],
    archiveOpen: false,

    setLoading(isLoading) {
        this.isLoading = isLoading;
        UI.renderLoadingState(isLoading);
    },

    setResult(result) {
        this.currentResult = result;
        this.error = null;
        UI.renderResult(result);
    },

    setError(error) {
        this.error = error;
        this.currentResult = null;
        UI.renderError(error);
    },

    loadHistory() {
        this.history = History.load();
        UI.renderArchive(this.history);
    },

    addToHistory(entry) {
        this.history = History.add(entry);
        UI.renderArchive(this.history);
    },

    clearHistory() {
        this.history = History.clear();
        UI.renderArchive(this.history);
    },

    toggleArchive() {
        this.archiveOpen = !this.archiveOpen;
        UI.toggleArchiveVisibility(this.archiveOpen);
    }
};

// ============================================
// API MODULE
// ============================================
const API = {
    /**
     * Query the Hugging Face API
     */
    async findWord(userInput) {
        try {
            // Call our serverless function instead of OpenRouter directly
            // This keeps the API key secure on the server
            const response = await fetch('/.netlify/functions/find-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emotionText: `User's feeling: "${userInput}"\n\nFind the perfect word. Respond with JSON only.`
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed: ${response.status}`);
            }

            const data = await response.json();
            return this.parseResponse(data);

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Parse the API response
     */
    parseResponse(data) {
        try {
            // OpenRouter returns chat completion format
            let text = '';
            if (data.choices && data.choices[0]?.message?.content) {
                text = data.choices[0].message.content;
            } else if (Array.isArray(data) && data[0]?.generated_text) {
                text = data[0].generated_text;
            } else if (typeof data === 'string') {
                text = data;
            }

            console.log('API Response text:', text);

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not parse response');
            }

            // Try to fix common JSON issues before parsing
            let jsonStr = jsonMatch[0];

            // Try parsing, if it fails try to extract fields manually
            let parsed;
            try {
                parsed = JSON.parse(jsonStr);
            } catch (e) {
                // Manual extraction fallback for malformed JSON
                console.log('JSON parse failed, attempting manual extraction');
                const wordMatch = text.match(/"word"\s*:\s*"([^"]+)"/);
                const pronMatch = text.match(/"pronunciation"\s*:\s*"([^"]+)"/);
                const originMatch = text.match(/"origin"\s*:\s*"([^"]+)"/);
                const defMatch = text.match(/"definition"\s*:\s*"([^"]*?)(?:"|$)/);

                if (wordMatch) {
                    parsed = {
                        word: wordMatch[1],
                        pronunciation: pronMatch ? pronMatch[1] : '',
                        origin: originMatch ? originMatch[1] : 'Unknown',
                        definition: defMatch ? defMatch[1] : 'A beautiful word that captures your feeling.'
                    };
                } else {
                    throw new Error('Could not extract word from response');
                }
            }

            // Validate required fields
            if (!parsed.word || !parsed.definition) {
                throw new Error('Invalid response format');
            }

            return {
                word: parsed.word,
                pronunciation: parsed.pronunciation || '',
                origin: parsed.origin || 'Unknown origin',
                definition: parsed.definition,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('Unable to find a word. Please try describing your feeling differently.');
        }
    },
};

// ============================================
// SHARE MODULE
// ============================================
const Share = {
    /**
     * Generate shareable image from result
     */
    generateImage(result) {
        const canvas = UI.elements.canvas;
        const ctx = canvas.getContext('2d');
        const { WIDTH, HEIGHT, PADDING, BACKGROUND, TEXT_COLOR } = Config.CANVAS;

        // Set canvas dimensions
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        // Background
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Border
        ctx.strokeStyle = TEXT_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(PADDING / 2, PADDING / 2, WIDTH - PADDING, HEIGHT - PADDING);

        // Double border effect (newspaper style)
        ctx.lineWidth = 1;
        ctx.strokeRect(PADDING / 2 + 4, PADDING / 2 + 4, WIDTH - PADDING - 8, HEIGHT - PADDING - 8);

        // Header - "A Word for This"
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('A Word for This', WIDTH / 2, PADDING + 30);

        // Header underline
        ctx.beginPath();
        ctx.moveTo(PADDING + 100, PADDING + 45);
        ctx.lineTo(WIDTH - PADDING - 100, PADDING + 45);
        ctx.stroke();

        // Word (large)
        ctx.font = 'bold 64px Georgia, serif';
        ctx.fillText(result.word, WIDTH / 2, HEIGHT / 2 - 40);

        // Pronunciation
        if (result.pronunciation) {
            ctx.font = 'italic 18px Arial, sans-serif';
            ctx.fillStyle = '#4A4A4A';
            ctx.fillText(`/${result.pronunciation}/`, WIDTH / 2, HEIGHT / 2);
        }

        // Origin
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(result.origin, WIDTH / 2, HEIGHT / 2 + 35);

        // Definition (word-wrapped)
        ctx.font = '16px Georgia, serif';
        const maxWidth = WIDTH - PADDING * 2 - 40;
        const lines = this.wrapText(ctx, result.definition, maxWidth);
        const lineHeight = 24;
        const startY = HEIGHT / 2 + 80;

        lines.forEach((line, index) => {
            ctx.fillText(line, WIDTH / 2, startY + (index * lineHeight));
        });

        // Footer date
        const date = new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#4A4A4A';
        ctx.fillText(date, WIDTH / 2, HEIGHT - PADDING);

        // Download
        this.downloadImage(canvas, result.word);
    },

    /**
     * Wrap text for canvas rendering
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    /**
     * Trigger download of canvas as PNG
     */
    downloadImage(canvas, word) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const sanitizedWord = word.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        link.download = `a-word-for-this-${sanitizedWord}.png`;
        link.href = dataUrl;
        link.click();
    },

    /**
     * Generate shareable image for social media (with attribution)
     */
    generateImageForShare(result) {
        const canvas = UI.elements.canvas;
        const ctx = canvas.getContext('2d');
        const { WIDTH, HEIGHT, PADDING, BACKGROUND, TEXT_COLOR } = Config.CANVAS;

        // Set canvas dimensions
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        // Background
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Border
        ctx.strokeStyle = TEXT_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(PADDING / 2, PADDING / 2, WIDTH - PADDING, HEIGHT - PADDING);

        // Double border effect (newspaper style)
        ctx.lineWidth = 1;
        ctx.strokeRect(PADDING / 2 + 4, PADDING / 2 + 4, WIDTH - PADDING - 8, HEIGHT - PADDING - 8);

        // Header - "A Word for This"
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('A Word for This', WIDTH / 2, PADDING + 30);

        // Header underline
        ctx.beginPath();
        ctx.moveTo(PADDING + 100, PADDING + 45);
        ctx.lineTo(WIDTH - PADDING - 100, PADDING + 45);
        ctx.stroke();

        // Word (large)
        ctx.font = 'bold 64px Georgia, serif';
        ctx.fillText(result.word, WIDTH / 2, HEIGHT / 2 - 40);

        // Pronunciation
        if (result.pronunciation) {
            ctx.font = 'italic 18px Arial, sans-serif';
            ctx.fillStyle = '#4A4A4A';
            ctx.fillText(`/${result.pronunciation}/`, WIDTH / 2, HEIGHT / 2);
        }

        // Origin
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(result.origin, WIDTH / 2, HEIGHT / 2 + 35);

        // Definition (word-wrapped)
        ctx.font = '16px Georgia, serif';
        const maxWidth = WIDTH - PADDING * 2 - 40;
        const lines = this.wrapText(ctx, result.definition, maxWidth);
        const lineHeight = 24;
        const startY = HEIGHT / 2 + 80;

        lines.forEach((line, index) => {
            ctx.fillText(line, WIDTH / 2, startY + (index * lineHeight));
        });

        // Footer - Powered by attribution (instead of date)
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#4A4A4A';
        ctx.fillText('Powered by A Word For This', WIDTH / 2, HEIGHT - PADDING);
    },

    /**
     * Copy canvas image to clipboard
     */
    async copyImageToClipboard(canvas) {
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            return true;
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            return false;
        }
    }
};

// ============================================
// EVENT HANDLERS
// ============================================
const Handlers = {
    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();

        const input = UI.elements.input.value.trim();
        if (!input) return;

        State.setLoading(true);

        try {
            const result = await API.findWord(input);
            console.log('Parsed result:', result);
            State.setResult(result);
            console.log('Result displayed');
            State.addToHistory({
                ...result,
                query: input
            });
        } catch (error) {
            console.error('Handler error:', error);
            State.setError(error);
        } finally {
            State.setLoading(false);
        }
    },

    /**
     * Handle input changes
     */
    handleInput(event) {
        const length = event.target.value.length;
        UI.updateCharCount(length);
    },

    /**
     * Handle share button click
     */
    handleShare() {
        if (State.currentResult) {
            Share.generateImage(State.currentResult);
        }
    },

    /**
     * Handle share to X button click
     */
    handleShareX() {
        if (!State.currentResult) return;

        const result = State.currentResult;

        // Create tweet text with word details
        const tweetText = `${result.word} (${result.origin})\n${result.definition}\n\n#AWordForThis`;

        // Open X with pre-filled text
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    },

    /**
     * Handle new search button click
     */
    handleNewSearch() {
        UI.resetToInput();
        rotatePlaceholder();
    },

    /**
     * Handle retry button click
     */
    handleRetry() {
        UI.elements.errorSection.hidden = true;
        UI.elements.input.focus();
    },

    /**
     * Handle archive toggle
     */
    handleArchiveToggle() {
        State.toggleArchive();
    },

    /**
     * Handle clear archive
     */
    handleClearArchive() {
        if (confirm('Are you sure you want to clear your word archive?')) {
            State.clearHistory();
        }
    }
};

// ============================================
// TUTORIAL
// ============================================
const Tutorial = {
    currentStep: 1,
    totalSteps: 3,

    /**
     * Initialize tutorial
     */
    init() {
        const hasSeenTutorial = localStorage.getItem(Config.TUTORIAL_SEEN_KEY);
        if (!hasSeenTutorial) {
            this.show();
        }
    },

    /**
     * Show tutorial overlay
     */
    show() {
        const overlay = document.getElementById('tutorial-overlay');
        overlay.hidden = false;
        this.currentStep = 1;
        this.updateUI();
    },

    /**
     * Hide tutorial and mark as seen
     */
    hide() {
        const overlay = document.getElementById('tutorial-overlay');
        overlay.hidden = true;
        localStorage.setItem(Config.TUTORIAL_SEEN_KEY, 'true');
    },

    /**
     * Advance to next step or complete
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateUI();
        } else {
            this.hide();
        }
    },

    /**
     * Update UI for current step
     */
    updateUI() {
        // Hide all cards
        document.querySelectorAll('.tutorial-card').forEach((card, index) => {
            card.hidden = index + 1 !== this.currentStep;
        });

        // Update dots
        document.querySelectorAll('.tutorial-dot').forEach((dot, index) => {
            dot.classList.toggle('tutorial-dot--active', index + 1 === this.currentStep);
        });

        // Update button text
        const nextBtn = document.getElementById('tutorial-next');
        nextBtn.textContent = this.currentStep === this.totalSteps ? 'Get Started' : 'Next';
    }
};

// ============================================
// PLACEHOLDER ROTATION
// ============================================
let currentPlaceholderIndex = Math.floor(Math.random() * Config.PLACEHOLDERS.length);

function rotatePlaceholder() {
    currentPlaceholderIndex = (currentPlaceholderIndex + 1) % Config.PLACEHOLDERS.length;
    UI.elements.input.placeholder = Config.PLACEHOLDERS[currentPlaceholderIndex];
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Initialize UI
    UI.init();

    // Load history
    State.loadHistory();

    // Set initial random placeholder
    UI.elements.input.placeholder = Config.PLACEHOLDERS[currentPlaceholderIndex];

    // Initialize tutorial
    Tutorial.init();

    // Bind event listeners
    UI.elements.form.addEventListener('submit', Handlers.handleSubmit);
    UI.elements.input.addEventListener('input', Handlers.handleInput);
    UI.elements.shareBtn.addEventListener('click', Handlers.handleShare);
    UI.elements.shareXBtn.addEventListener('click', Handlers.handleShareX);
    UI.elements.newSearchBtn.addEventListener('click', Handlers.handleNewSearch);
    UI.elements.retryBtn.addEventListener('click', Handlers.handleRetry);
    UI.elements.archiveToggle.addEventListener('click', Handlers.handleArchiveToggle);
    UI.elements.clearArchive.addEventListener('click', Handlers.handleClearArchive);

    // Bind tutorial event listeners
    document.getElementById('tutorial-skip').addEventListener('click', () => Tutorial.hide());
    document.getElementById('tutorial-next').addEventListener('click', () => Tutorial.nextStep());
    document.getElementById('help-btn').addEventListener('click', () => Tutorial.show());

    // Initialize donate feature
    Donate.init();

    // Focus input on load
    UI.elements.input.focus();
}

// ============================================
// DONATE MODULE
// ============================================
const Donate = {
    elements: {
        donateBtn: null,
        donatePopover: null,
        copyBtn: null,
        copyFeedback: null,
        walletAddress: null,
        ethToggle: null,
        solToggle: null
    },

    // Wallet addresses for different networks
    wallets: {
        ethereum: '0xdf6ae818b038dd887210d8b1c214a98f03b3d40d',
        solana: 'CXwLLEfvNmCK9L7KMXYo4ByhsJ8JhMwUHfvTo2xKYP1z'
    },

    currentNetwork: 'ethereum',

    /**
     * Initialize donate feature
     */
    init() {
        console.log('[Donate] Initializing donate feature...');

        // Get DOM elements
        this.elements.donateBtn = document.getElementById('donate-btn');
        this.elements.donatePopover = document.getElementById('donate-popover');
        this.elements.copyBtn = document.getElementById('copy-btn');
        this.elements.copyFeedback = document.getElementById('copy-feedback');
        this.elements.walletAddress = document.getElementById('wallet-address');
        this.elements.ethToggle = document.getElementById('eth-toggle');
        this.elements.solToggle = document.getElementById('sol-toggle');

        // Bind event listeners
        this.elements.donateBtn.addEventListener('click', () => this.togglePopover());
        this.elements.copyBtn.addEventListener('click', () => this.copyAddress());
        this.elements.ethToggle.addEventListener('click', () => this.switchNetwork('ethereum'));
        this.elements.solToggle.addEventListener('click', () => this.switchNetwork('solana'));

        // Close popover when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Keyboard accessibility
        this.elements.donateBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePopover();
            }
        });

        console.log('[Donate] Initialization complete');
    },

    /**
     * Switch between Ethereum and Solana networks
     */
    switchNetwork(network) {
        console.log(`[Donate] Switching to ${network} network`);

        this.currentNetwork = network;

        // Update wallet address display
        this.elements.walletAddress.textContent = this.wallets[network];

        // Update button states
        if (network === 'ethereum') {
            this.elements.ethToggle.classList.add('network-btn--active');
            this.elements.solToggle.classList.remove('network-btn--active');
        } else {
            this.elements.solToggle.classList.add('network-btn--active');
            this.elements.ethToggle.classList.remove('network-btn--active');
        }
    },

    /**
     * Toggle popover visibility
     */
    togglePopover() {
        const isHidden = this.elements.donatePopover.hidden;

        if (isHidden) {
            console.log('[Donate] Opening popover');
            this.elements.donatePopover.hidden = false;
            this.elements.donateBtn.setAttribute('aria-expanded', 'true');
        } else {
            console.log('[Donate] Closing popover');
            this.elements.donatePopover.hidden = true;
            this.elements.donateBtn.setAttribute('aria-expanded', 'false');
        }
    },

    /**
     * Copy wallet address to clipboard
     */
    async copyAddress() {
        const address = this.elements.walletAddress.textContent;
        console.log('[Donate] Attempting to copy address:', address);

        try {
            // Try modern Clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(address);
                console.log('[Donate] Address copied via Clipboard API');
                this.showCopyFeedback();
            } else {
                // Fallback for older browsers or blocked clipboard
                console.warn('[Donate] Clipboard API not available, using fallback');
                this.copyAddressFallback(address);
            }
        } catch (error) {
            console.error('[Donate] Copy failed:', error);
            // Use fallback on error
            this.copyAddressFallback(address);
        }
    },

    /**
     * Fallback copy method for older browsers
     */
    copyAddressFallback(address) {
        console.log('[Donate] Using fallback copy method');

        // Create temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = address;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);

        try {
            // Select and copy
            textarea.select();
            textarea.setSelectionRange(0, address.length);
            const successful = document.execCommand('copy');

            if (successful) {
                console.log('[Donate] Address copied via fallback method');
                this.showCopyFeedback();
            } else {
                console.error('[Donate] Fallback copy failed');
                this.showManualCopyPrompt(address);
            }
        } catch (error) {
            console.error('[Donate] Fallback copy error:', error);
            this.showManualCopyPrompt(address);
        } finally {
            document.body.removeChild(textarea);
        }
    },

    /**
     * Show manual copy prompt as last resort
     */
    showManualCopyPrompt(address) {
        console.log('[Donate] Showing manual copy prompt');

        // Use window.prompt as last resort
        const userAction = window.prompt(
            'Automatic copy failed. Please manually copy this address:',
            address
        );

        if (userAction !== null) {
            console.log('[Donate] User acknowledged manual copy prompt');
        }
    },

    /**
     * Show "Copied!" feedback message
     */
    showCopyFeedback() {
        console.log('[Donate] Showing copy feedback');

        // Show feedback
        this.elements.copyFeedback.hidden = false;

        // Hide after 2 seconds
        setTimeout(() => {
            this.elements.copyFeedback.hidden = true;
            console.log('[Donate] Copy feedback hidden');
        }, 2000);
    },

    /**
     * Handle clicks outside popover to close it
     */
    handleOutsideClick(event) {
        const isClickInside = this.elements.donateBtn.contains(event.target) ||
                             this.elements.donatePopover.contains(event.target);

        if (!isClickInside && !this.elements.donatePopover.hidden) {
            console.log('[Donate] Outside click detected, closing popover');
            this.togglePopover();
        }
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
