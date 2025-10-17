# AI Conversation Assistant

A simple web application that listens to speech, converts it to text, and provides AI-powered suggestions for what to say next based on user context and conversation history.

## Features

- 🎤 **Speech-to-Text**: Uses browser's built-in speech recognition
- 💡 **AI Suggestions**: Powered by Google's Gemini API
- 📊 **Context-Aware**: Considers user profile, upcoming events, and recent projects
- 🎨 **Clean UI**: Simple, intuitive interface

## Setup

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a free API key
   - Copy the key

2. **Run the Application**:
   - Open `index.html` in a modern browser (Chrome, Edge, or Safari recommended)
   - Paste your API key in the input field
   - Click "Start Listening"
   - Start speaking!

## How It Works

1. Click "Start Listening" to activate the microphone
2. Speak naturally - your words will appear in the "Conversation" section
3. The AI analyzes:
   - What you and others have said
   - Your role and work style
   - Upcoming calendar events
   - Recent project information
4. Get 3 contextual suggestions for what to say next

## Customization

Edit the `userContext` object in `app.js` to customize:
- User name and role
- Upcoming events/calendar
- Recent projects or quarterly reports
- Communication style preferences
- Common topics

```javascript
const userContext = {
    name: "Your Name",
    role: "Your Role",
    upcomingEvents: ["Event 1", "Event 2"],
    recentProjects: ["Project info"],
    workStyle: "Your communication style",
    commonTopics: ["topic1", "topic2"]
};
```

## Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Safari
- ❌ Firefox (limited speech recognition support)

## Privacy

- All processing happens client-side except API calls to Gemini
- API key is stored locally in your browser
- No conversation data is saved permanently

## Requirements

- Modern web browser with microphone access
- Internet connection for Gemini API
- Free Gemini API key

## License

Free to use and modify!
