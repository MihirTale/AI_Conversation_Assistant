// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 1;

// DOM elements
const listenBtn = document.getElementById('listenBtn');
const clearBtn = document.getElementById('clearBtn');
const conversationDiv = document.getElementById('conversation');
const suggestionsDiv = document.getElementById('suggestions');
const reasoningDiv = document.getElementById('reasoning');
const statusDiv = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');
const micLevelDiv = document.getElementById('micLevel');
const micBar = document.getElementById('micBar');
const micText = document.getElementById('micText');

// Audio context for visualizing microphone input
let audioContext = null;
let analyser = null;
let microphone = null;
let javascriptNode = null;

// State
let isListening = false;
let conversationHistory = [];
let currentTranscript = '';
let isTogglingListening = false; // Prevent double-clicks

// Sample user context/preferences (simulating user documents)
const userContext = {
    name: "Alex",
    role: "Product Manager",
    upcomingEvents: [
        "Team standup at 10 AM",
        "Client presentation on Q4 metrics at 2 PM",
        "Budget review meeting on Friday"
    ],
    quarterlyReport: {
        quarter: "Q4 2024",
        highlights: [
            "Revenue: $2.4M (up 15% from Q3)",
            "New customers acquired: 127 enterprise clients",
            "Product adoption rate: 78% (target was 70%)",
            "Customer churn reduced to 3.2% (down from 5.1%)",
            "Mobile app launch: 50K downloads in first month"
        ],
        challenges: [
            "Server scalability issues during peak hours",
            "Delayed feature releases due to resource constraints",
            "Increased competition in European markets"
        ],
        nextQuarterGoals: [
            "Scale infrastructure to handle 2x traffic",
            "Launch AI-powered analytics dashboard",
            "Expand to 3 new international markets",
            "Achieve 85% customer satisfaction score"
        ]
    },
    lastMeetingNotes: {
        date: "October 14, 2024",
        topic: "Sprint Planning & Feature Prioritization",
        attendees: ["Engineering Team", "Design", "Sales"],
        keyPoints: [
            "Agreed to prioritize API v2.0 release for November",
            "Design team needs 2 more days for UI mockups",
            "Sales requested bulk export feature for enterprise clients",
            "Security audit scheduled for next week",
            "Bug count down to 23 (from 47 last week)"
        ],
        actionItems: [
            "Alex: Follow up with engineering on API timeline",
            "Sarah: Complete user research for new dashboard",
            "Mike: Prepare demo for client presentation Thursday"
        ]
    },
    workStyle: "Professional, concise, data-driven communication",
    commonTopics: ["quarterly metrics", "team coordination", "project timelines", "budget planning"]
};

// Event listeners
listenBtn.addEventListener('click', toggleListening);
clearBtn.addEventListener('click', clearConversation);

recognition.onstart = () => {
    updateStatus('🎤 Listening... (speak now!)', 'listening');
};

recognition.onaudiostart = () => {
    updateStatus('🎤 Microphone ready - SPEAK NOW!', 'listening');
};

recognition.onspeechstart = () => {
    console.log('🗣️ Speech detected!');
};

recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }
    
    // Show interim results in real-time
    if (interimTranscript) {
        updateStatus('Hearing: ' + interimTranscript, 'listening');
    }
    
    if (finalTranscript) {
        currentTranscript = finalTranscript.trim();
        console.log('✅ Captured:', currentTranscript);
        addToConversation(currentTranscript);
        getSuggestions();
    }
};

recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
        alert('Please allow microphone access in your browser settings and refresh the page.');
        stopListening();
    } else if (event.error === 'no-speech') {
        updateStatus('🎤 Waiting for speech - speak louder or closer to mic!', 'listening');
        return;
    } else if (event.error === 'network') {
        console.error('Network error - check internet connection');
        stopListening();
    } else if (event.error === 'aborted') {
        return;
    } else {
        console.error('Speech recognition error:', event.error);
        stopListening();
    }
};

recognition.onend = () => {
    if (isListening) {
        setTimeout(() => {
            if (isListening) {
                recognition.start();
            }
        }, 100);
    }
};

function toggleListening() {
    if (isTogglingListening) {
        return;
    }
    
    isTogglingListening = true;
    
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
    
    setTimeout(() => {
        isTogglingListening = false;
    }, 500);
}

function startListening() {
    try {
        isListening = true;
        startMicrophoneVisualization();
        recognition.start();
        listenBtn.textContent = '⏸️ Stop Listening';
        listenBtn.classList.add('listening');
        updateStatus('Starting microphone...', 'listening');
    } catch (error) {
        console.error('Error starting microphone:', error);
        alert('Error starting microphone: ' + error.message);
        isListening = false;
        listenBtn.classList.remove('listening');
        updateStatus('Error starting microphone', 'ready');
    }
}

function stopListening() {
    isListening = false;
    stopMicrophoneVisualization();
    
    try {
        recognition.stop();
    } catch (error) {
        console.error('Error stopping recognition:', error);
    }
    listenBtn.textContent = '🎤 Start Listening';
    listenBtn.classList.remove('listening');
    updateStatus('Ready to listen', 'ready');
}

function addToConversation(text) {
    conversationHistory.push(text);
    const transcriptLine = document.createElement('div');
    transcriptLine.className = 'transcript-line';
    transcriptLine.textContent = text;
    conversationDiv.appendChild(transcriptLine);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
}

function clearConversation() {
    conversationHistory = [];
    currentTranscript = '';
    conversationDiv.innerHTML = '';
    suggestionsDiv.innerHTML = '<em>Suggestions will appear here after you start speaking...</em>';
    reasoningDiv.innerHTML = '<em>Explanation will appear here...</em>';
    updateStatus('Ready to listen', 'ready');
}

function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

async function getSuggestions() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        suggestionsDiv.innerHTML = '<em>Enter your Gemini API key above to get AI suggestions...</em>';
        reasoningDiv.innerHTML = '<em>Explanation will appear here...</em>';
        return;
    }
    
    updateStatus('Getting AI suggestions...', 'processing');
    
    const prompt = buildPrompt();
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error('API request failed: ' + (errorData.error?.message || response.statusText));
        }
        
        const data = await response.json();
        
        // Check if response has the expected structure
        if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            
            // Check if we have parts with text
            if (candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
                const response = candidate.content.parts[0].text;
                parseAndDisplayResponse(response);
                updateStatus('🎤 Listening... (speak now!)', 'listening');
            } else {
                // Handle case where model didn't generate text (e.g., MAX_TOKENS on thoughts)
                console.error('No text in API response. Finish reason:', candidate.finishReason);
                suggestionsDiv.innerHTML = '<em>Unable to generate suggestions. Try speaking more or check your API key.</em>';
                reasoningDiv.innerHTML = '<em>No explanation available.</em>';
                updateStatus('🎤 Listening... (speak now!)', 'listening');
            }
        } else {
            console.error('Unexpected API response structure:', data);
            throw new Error('Invalid API response format');
        }
        
    } catch (error) {
        console.error('Error getting suggestions:', error);
        suggestionsDiv.innerHTML = `<div style="color: red;">Error: ${error.message}. Please check your API key.</div>`;
        updateStatus('🎤 Listening... (speak now!)', 'listening');
    }
}

function buildPrompt() {
    const recentConversation = conversationHistory.slice(-5).join('\n');
    
    return `You are an AI assistant helping ${userContext.name}, a ${userContext.role}.

CONTEXT:
- Role: ${userContext.role}
- Style: ${userContext.workStyle}
- Upcoming: ${userContext.upcomingEvents.join(', ')}

QUARTERLY REPORT (${userContext.quarterlyReport.quarter}):
Highlights:
${userContext.quarterlyReport.highlights.map(h => '• ' + h).join('\n')}

Challenges:
${userContext.quarterlyReport.challenges.map(c => '• ' + c).join('\n')}

Next Quarter Goals:
${userContext.quarterlyReport.nextQuarterGoals.map(g => '• ' + g).join('\n')}

LAST MEETING (${userContext.lastMeetingNotes.date}):
Topic: ${userContext.lastMeetingNotes.topic}
Key Points:
${userContext.lastMeetingNotes.keyPoints.map(k => '• ' + k).join('\n')}

Action Items:
${userContext.lastMeetingNotes.actionItems.map(a => '• ' + a).join('\n')}

CONVERSATION:
${recentConversation}

LAST HEARD: "${currentTranscript}"

Provide ONE best response ${userContext.name} should say next, then explain why.

Format your response EXACTLY as:
SUGGESTION: [your one-sentence suggestion here]
CONTEXT_USED: [quote the specific data from user context that influenced this suggestion - e.g., "Revenue: $2.4M (up 15% from Q3)" or "Agreed to prioritize API v2.0 release for November"]
SOURCES: [which context category - e.g., "Quarterly Report", "Last Meeting", "Upcoming Events"]`;
}

function parseAndDisplayResponse(response) {
    // Parse the response to extract suggestion, context used, and sources
    const suggestionMatch = response.match(/SUGGESTION:\s*(.+?)(?=\n|$)/i);
    const contextMatch = response.match(/CONTEXT_USED:\s*(.+?)(?=SOURCES:|$)/is);
    const sourcesMatch = response.match(/SOURCES:\s*(.+?)$/is);
    
    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : response.split('\n')[0];
    const contextUsed = contextMatch ? contextMatch[1].trim() : 'General conversation context';
    const sources = sourcesMatch ? sourcesMatch[1].trim() : 'Conversation History';
    
    // Display suggestion
    suggestionsDiv.innerHTML = `<div style="font-size: 18px; color: #2e7d32;">"${suggestion}"</div>`;
    
    // Display reasoning with source tags
    const sourceTags = sources.split(',').map(s => 
        `<span class="source-tag">${s.trim()}</span>`
    ).join('');
    
    reasoningDiv.innerHTML = `
        <div style="margin-bottom: 10px;">${sourceTags}</div>
        <div style="color: #666; font-style: italic; padding: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #ff9800;">
            📋 "${contextUsed}"
        </div>
    `;
}

function displaySuggestions(suggestions) {
    // Legacy fallback
    suggestionsDiv.innerHTML = suggestions;
    reasoningDiv.innerHTML = '<em>Explanation not available in this format.</em>';
}

// Microphone visualization functions
async function startMicrophoneVisualization() {
    try {
        micLevelDiv.style.display = 'block';
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        
        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        
        javascriptNode.onaudioprocess = function() {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            
            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += array[i];
            }
            
            const average = values / length;
            const percentage = Math.round((average / 255) * 100);
            
            micBar.style.width = percentage + '%';
            micText.textContent = `Volume: ${percentage}%`;
        };
    } catch (error) {
        console.error('Error starting microphone visualization:', error);
        micLevelDiv.style.display = 'none';
    }
}

function stopMicrophoneVisualization() {
    micLevelDiv.style.display = 'none';
    
    if (javascriptNode) {
        javascriptNode.disconnect();
        javascriptNode = null;
    }
    if (analyser) {
        analyser.disconnect();
        analyser = null;
    }
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    micBar.style.width = '0%';
    micText.textContent = 'Volume: 0%';
}

// Check for browser support
if (!SpeechRecognition) {
    alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    listenBtn.disabled = true;
    updateStatus('Speech recognition not supported in this browser', 'ready');
}

// Load API key from localStorage if available
const savedApiKey = localStorage.getItem('geminiApiKey');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}

// Save API key to localStorage when changed
apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('geminiApiKey', apiKeyInput.value.trim());
});
