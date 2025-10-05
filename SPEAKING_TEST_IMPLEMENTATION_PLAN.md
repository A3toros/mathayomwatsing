# Speaking Test Implementation Plan

## Overview
A new test type that allows students to record speech, get AI-powered feedback, and submit for teacher review.

## Student Side Features

### 🎤 Audio Recording
- **Real-time recording** with visual feedback
- **Audio quality validation** (minimum duration, volume levels)
- **Re-record capability** before final submission
- **Audio format**: WebM/MP3 for compatibility

### 📝 Speech-to-Text Processing
- **AssemblyAI integration** for transcription
- **Real-time transcription status** with progress indicators
- **Error handling** for failed transcriptions
- **Transcript preview** before submission

### 🔍 AI-Powered Feedback
- **Grammar analysis** using LanguageTool API
- **Vocabulary range assessment** (lexical density, word variety)
- **Pronunciation scoring** (if supported by STT service)
- **Confidence indicators** for transcript accuracy

### 📊 Feedback Display
- **Transcript with highlights** for errors/suggestions
- **Grammar corrections** with explanations
- **Vocabulary analysis** (unique words, complexity)
- **Overall speaking score** (grammar + vocabulary + fluency)

### 🔁 Re-recording Workflow
- **"Try Again" button** if results unsatisfactory
- **Previous attempt history** for comparison
- **Maximum attempts limit** (configurable by teacher)
- **Final submission lock** after confirmation

## Teacher Side Features

### 📋 Test Management
- **Speaking test creation** with prompts/topics
- **Time limits** and attempt restrictions
- **Scoring rubrics** (grammar, vocabulary, fluency)
- **Audio quality requirements** (minimum duration, etc.)

### 👂 Review Interface
- **Audio playback** with controls (play/pause/seek)
- **Transcript display** with grammar highlights
- **AI feedback summary** (grammar score, vocabulary analysis)
- **Manual scoring** override capabilities
- **Comments/notes** for student feedback

### 📊 Analytics Dashboard
- **Class performance** overview
- **Common grammar issues** across students
- **Vocabulary range trends**
- **Speaking confidence metrics**

## Technical Implementation

### Database Schema

#### speaking_test_results Table
```sql
CREATE TABLE speaking_test_results (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  teacher_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  class INTEGER NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),
  
  -- Audio data
  audio_file_path TEXT NOT NULL,
  audio_duration DECIMAL(10,2),
  audio_file_size INTEGER,
  
  -- Transcription
  transcript TEXT,
  transcript_confidence DECIMAL(5,4),
  word_count INTEGER,
  
  -- AI Analysis
  grammar_score DECIMAL(5,2),
  vocabulary_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  
  -- Grammar feedback
  grammar_errors JSONB,
  grammar_suggestions JSONB,
  
  -- Vocabulary analysis
  unique_words INTEGER,
  lexical_density DECIMAL(5,4),
  vocabulary_complexity DECIMAL(5,2),
  
  -- Metadata
  attempt_number INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  academic_period_id INTEGER,
  
  -- Retest support
  retest_assignment_id INTEGER,
  retest_offered BOOLEAN DEFAULT false,
  
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
  FOREIGN KEY (student_id) REFERENCES users(student_id)
);
```

#### speaking_tests Table
```sql
CREATE TABLE speaking_tests (
  id SERIAL PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  teacher_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  class INTEGER NOT NULL,
  
  -- Test configuration
  prompt TEXT NOT NULL,
  time_limit INTEGER DEFAULT 300, -- seconds
  max_attempts INTEGER DEFAULT 3,
  min_duration INTEGER DEFAULT 30, -- minimum seconds
  max_duration INTEGER DEFAULT 600, -- maximum seconds
  
  -- Scoring weights
  grammar_weight DECIMAL(3,2) DEFAULT 0.4,
  vocabulary_weight DECIMAL(3,2) DEFAULT 0.3,
  fluency_weight DECIMAL(3,2) DEFAULT 0.3,
  
  -- AI settings
  stt_provider VARCHAR(50) DEFAULT 'assemblyai',
  grammar_checker VARCHAR(50) DEFAULT 'languagetool',
  language_code VARCHAR(10) DEFAULT 'en-US',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  academic_period_id INTEGER,
  
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);
```

### API Endpoints

#### Student Endpoints
```javascript
// Submit speaking test
POST /api/speaking-test/submit
{
  test_id: number,
  audio_file: File,
  attempt_number: number,
  retest_assignment_id?: number
}

// Get transcription status
GET /api/speaking-test/transcription-status/:submission_id

// Get AI feedback
GET /api/speaking-test/feedback/:submission_id

// Re-record (delete previous attempt)
DELETE /api/speaking-test/attempt/:submission_id
```

#### Teacher Endpoints
```javascript
// Create speaking test
POST /api/speaking-test/create
{
  test_name: string,
  prompt: string,
  time_limit: number,
  max_attempts: number,
  scoring_weights: object
}

// Get student submissions
GET /api/speaking-test/submissions/:test_id

// Get audio file
GET /api/speaking-test/audio/:submission_id

// Update manual scores
PUT /api/speaking-test/score/:submission_id
{
  manual_grammar_score: number,
  manual_vocabulary_score: number,
  manual_fluency_score: number,
  teacher_notes: string
}
```

### Frontend Components

#### Student Components
```jsx
// SpeakingTestStudent.jsx
- AudioRecorder component
- TranscriptionStatus component
- FeedbackDisplay component
- ReRecordButton component

// AudioRecorder.jsx
- MediaRecorder integration
- Real-time waveform display
- Recording controls (start/stop/pause)
- Audio quality validation

// FeedbackDisplay.jsx
- Transcript with grammar highlights
- Vocabulary analysis display
- Score breakdown
- Improvement suggestions
```

#### Teacher Components
```jsx
// SpeakingTestReview.jsx
- AudioPlayer component
- TranscriptViewer component
- ScoringInterface component
- AnalyticsDashboard component

// AudioPlayer.jsx
- Custom audio controls
- Waveform visualization
- Playback speed control
- Transcript sync
```

### External API Integration

#### AssemblyAI Integration
```javascript
// functions/transcribe-audio.js
const transcribeWithAssemblyAI = async (audioUrl) => {
  const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
    audio_url: audioUrl,
    speech_model: 'universal',
    language_code: 'en'
  });
  
  const transcriptId = response.data.id;
  
  // Poll for completion
  while (true) {
    const status = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY }
    });
    
    if (status.data.status === 'completed') {
      return {
        text: status.data.text,
        confidence: status.data.confidence,
        words: status.data.words
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
};
```

#### LanguageTool Integration
```javascript
// functions/check-grammar.js
const checkGrammarWithLanguageTool = async (text) => {
  const response = await axios.post('https://api.languagetool.org/v2/check', 
    new URLSearchParams({
      text: text,
      language: 'en-US',
      enabledOnly: 'true'
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  
  return response.data.matches.map(match => ({
    message: match.message,
    replacements: match.replacements,
    offset: match.offset,
    length: match.length,
    rule: match.rule
  }));
};
```

#### Vocabulary Analysis
```javascript
// functions/analyze-vocabulary.js
const analyzeVocabulary = (text) => {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const uniqueWords = new Set(words);
  
  // Calculate lexical density
  const lexicalDensity = uniqueWords.size / words.length;
  
  // Analyze word complexity (syllable count estimation)
  const complexWords = words.filter(word => countSyllables(word) >= 3);
  const complexityRatio = complexWords.length / words.length;
  
  return {
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
    lexicalDensity,
    complexityRatio,
    averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
  };
};
```

### File Storage Strategy

#### Supabase Storage
```javascript
// Upload audio to Supabase
const uploadAudioToSupabase = async (audioBlob, studentId, testId) => {
  const fileName = `speaking-tests/${studentId}/${testId}/${Date.now()}.webm`;
  
  const { data, error } = await supabase.storage
    .from('student-audio')
    .upload(fileName, audioBlob, {
      contentType: 'audio/webm',
      upsert: false
    });
    
  if (error) throw error;
  return data.path;
};
```

### Implementation Phases

#### Phase 1: Core Recording (Week 1-2)
- [ ] Audio recording component
- [ ] Basic file upload to Supabase
- [ ] Database schema implementation
- [ ] Student interface for recording

#### Phase 2: Speech-to-Text (Week 3-4)
- [ ] AssemblyAI integration
- [ ] Transcription status polling
- [ ] Error handling for failed transcriptions
- [ ] Transcript display component

#### Phase 3: AI Feedback (Week 5-6)
- [ ] LanguageTool grammar checking
- [ ] Vocabulary analysis algorithms
- [ ] Feedback display with highlights
- [ ] Scoring calculation system

#### Phase 4: Teacher Interface (Week 7-8)
- [ ] Audio playback component
- [ ] Teacher review interface
- [ ] Manual scoring override
- [ ] Analytics dashboard

#### Phase 5: Advanced Features (Week 9-10)
- [ ] Re-recording workflow
- [ ] Retest assignment support
- [ ] Performance analytics
- [ ] Mobile optimization

### Security Considerations

#### Audio Privacy
- **Encrypted storage** for audio files
- **Access controls** for teacher review
- **Data retention policies** (auto-delete after X months)
- **GDPR compliance** for EU students

#### API Security
- **Rate limiting** for external API calls
- **API key rotation** for AssemblyAI/LanguageTool
- **Input validation** for all user data
- **Error handling** to prevent data leaks

### Performance Optimization

#### Audio Processing
- **Compression** before upload (WebM format)
- **Chunked uploads** for large files
- **Progress indicators** for long operations
- **Background processing** for transcription

#### Caching Strategy
- **Redis caching** for transcription results
- **CDN delivery** for audio files
- **Database indexing** for fast queries
- **Lazy loading** for teacher interface

### Testing Strategy

#### Unit Tests
- [ ] Audio recording functionality
- [ ] Transcription accuracy
- [ ] Grammar checking algorithms
- [ ] Vocabulary analysis functions

#### Integration Tests
- [ ] AssemblyAI API integration
- [ ] LanguageTool API integration
- [ ] Supabase storage operations
- [ ] End-to-end student workflow

#### User Acceptance Tests
- [ ] Student recording experience
- [ ] Teacher review workflow
- [ ] Mobile device compatibility
- [ ] Performance under load

### Success Metrics

#### Student Engagement
- **Completion rate** for speaking tests
- **Re-recording frequency** (quality indicator)
- **Student satisfaction** with feedback
- **Time spent** on test completion

#### Teacher Efficiency
- **Review time** per submission
- **Scoring accuracy** (AI vs manual)
- **Feedback quality** ratings
- **System reliability** (uptime)

#### Technical Performance
- **Transcription accuracy** (>95% target)
- **Processing time** (<30 seconds for 2-minute audio)
- **System availability** (>99.5% uptime)
- **Storage efficiency** (compression ratios)

### Future Enhancements

#### Advanced AI Features
- **Pronunciation scoring** with phonetic analysis
- **Speaking fluency** metrics (pauses, pace)
- **Emotion detection** in speech
- **Accent recognition** and feedback

#### Integration Opportunities
- **Video recording** for speaking tests
- **Real-time feedback** during recording
- **Peer review** capabilities
- **Speaking practice** mode

#### Analytics & Reporting
- **Speaking progress** tracking over time
- **Common error patterns** across classes
- **Teacher training** insights
- **Curriculum alignment** analysis

## Conclusion

This speaking test implementation will provide a comprehensive solution for oral assessment, combining modern AI technologies with intuitive user interfaces. The phased approach ensures steady progress while maintaining system stability and user experience quality.

The integration of AssemblyAI for transcription, LanguageTool for grammar checking, and custom vocabulary analysis will provide students with detailed, actionable feedback while giving teachers powerful tools for assessment and improvement tracking.
