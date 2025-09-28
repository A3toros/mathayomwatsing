# Fill Blanks Test Implementation Plan

## Overview
Implement a new "Fill Blanks" test type that combines Lexical text editor with multiple choice options. Teachers create rich text content with blanks, and students fill them using multiple choice options.

## 🎯 **Test Type Concept**
- **Teacher Side**: Create rich text content using Lexical editor with blank spaces
- **Student Side**: Fill blanks using multiple choice options (A, B, C, D)
- **Scoring**: Auto-scored like multiple choice tests
- **Structure**: Similar to drawing tests but with text content + MC options

## 📋 **Implementation Analysis**

### **Existing Patterns Scanned**

#### **Drawing Test Pattern** (Reference)
- **Database**: `drawing_tests`, `drawing_test_questions`, `drawing_test_results`
- **Questions**: Lexical JSON content stored in `question_json`
- **Creator**: `DrawingTestCreator.jsx` with LexicalEditor
- **Student**: `DrawingTestStudent.jsx` with canvas
- **Scoring**: Manual scoring (not auto-scored)

#### **Multiple Choice Pattern** (Reference)
- **Database**: `multiple_choice_tests`, `multiple_choice_test_questions`, `multiple_choice_test_results`
- **Questions**: Text + options (A, B, C, D) + correct_answer
- **Creator**: `QuestionForm.jsx` with option inputs
- **Student**: `MultipleChoiceQuestion.jsx` with radio buttons
- **Scoring**: Auto-scored using `checkAnswerCorrectness` in `scoreCalculation.js`

#### **Scoring Functions** (Found)
- **Primary**: `checkAnswerCorrectness` in `src/utils/scoreCalculation.js`
- **Secondary**: `calculateTestScore` for overall scoring
- **Multiple Choice Logic**: Handles both letter answers (A, B, C) and numeric indices

## 🗄️ **Database Schema**

### **1. Main Fill Blanks Tests Table**
```sql
CREATE TABLE fill_blanks_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    test_text TEXT NOT NULL, -- Full text content from Lexical editor
    num_questions INTEGER NOT NULL,
    num_blanks INTEGER NOT NULL, -- Number of blanks in the text
    separate_type BOOLEAN DEFAULT TRUE, -- TRUE = separate mode, FALSE = inline mode
    passing_score INTEGER,
    allowed_time INTEGER, -- Timer support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Fill Blanks Test Questions Table**
```sql
CREATE TABLE fill_blanks_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL, -- Question number (1, 2, 3, etc.)
    question_json JSONB NOT NULL, -- Question text for this specific blank
    blank_positions JSONB NOT NULL, -- Position of blank in main text
    blank_options JSONB NOT NULL, -- Array of answer options
    correct_answers JSONB NOT NULL, -- Correct answer(s) for this blank
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **3. Fill Blanks Test Results Table**
```sql
CREATE TABLE fill_blanks_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    student_id VARCHAR(50) REFERENCES users(student_id),
    student_name VARCHAR(100),
    student_surname VARCHAR(100),
    student_nickname VARCHAR(50),
    student_grade INTEGER,
    student_class VARCHAR(50),
    student_number INTEGER,
    answers JSONB NOT NULL, -- Student's answers
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    time_taken INTEGER, -- Time taken in seconds
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT FALSE,
    visibility_change_times INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **4. Indexes for Performance**
```sql
-- Indexes for fill blanks tables
CREATE INDEX idx_fill_blanks_tests_teacher_id ON fill_blanks_tests(teacher_id);
CREATE INDEX idx_fill_blanks_tests_subject_id ON fill_blanks_tests(subject_id);
CREATE INDEX idx_fill_blanks_tests_created_at ON fill_blanks_tests(created_at);

CREATE INDEX idx_fill_blanks_questions_test_id ON fill_blanks_test_questions(test_id);
CREATE INDEX idx_fill_blanks_questions_question_id ON fill_blanks_test_questions(question_id);

CREATE INDEX idx_fill_blanks_results_test_id ON fill_blanks_test_results(test_id);
CREATE INDEX idx_fill_blanks_results_student_id ON fill_blanks_test_results(student_id);
CREATE INDEX idx_fill_blanks_results_teacher_id ON fill_blanks_test_results(teacher_id);
CREATE INDEX idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX idx_fill_blanks_results_score ON fill_blanks_test_results(score);
```

## 🎨 **Frontend Implementation**

### **1. Lexical Editor Integration (Following Drawing Test Pattern)**

**Reference**: `src/components/test/DrawingTestCreator.jsx` - Uses LexicalEditor for rich text content

```javascript
// Enhanced Lexical Editor with Add Blank functionality (following drawing test pattern)
import LexicalEditor from '../ui/LexicalEditor';

// Custom Add Blank button component for Lexical toolbar
const AddBlankButton = ({ onAddBlank, disabled = false }) => (
  <button
    onClick={onAddBlank}
    disabled={disabled}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Add Blank Space"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline mr-1">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
    Add Blank
  </button>
);

// Enhanced LexicalEditor wrapper with blank functionality
const LexicalEditorWithBlanks = ({ 
  value, 
  onChange, 
  placeholder, 
  showAddBlankButton = false, 
  onAddBlank,
  blanks = [],
  disabled = false
}) => {
  // Insert blank placeholder at cursor position
  const insertBlank = useCallback(() => {
    if (onAddBlank) {
      onAddBlank();
    }
  }, [onAddBlank]);

  return (
    <div className="lexical-editor-with-blanks">
      {/* Custom toolbar with Add Blank button */}
      {showAddBlankButton && (
        <div className="border-b border-gray-300 p-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rich Text Editor</span>
            <AddBlankButton onAddBlank={insertBlank} disabled={disabled} />
          </div>
        </div>
      )}
      
      {/* Main Lexical Editor (following drawing test pattern) */}
      <LexicalEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      
      {/* Blank indicators display */}
      {blanks.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            <strong>Blanks:</strong> {blanks.length} blank(s) added to text
          </div>
        </div>
      )}
    </div>
  );
};
```

### **2. Test Form Integration**
```javascript
// Add to src/components/forms/TestForm.jsx
const testTypes = [
  // ... existing types
  { 
    id: 'fill_blanks', 
    name: 'Fill Blanks', 
    description: 'Rich text with multiple choice blanks',
    icon: '/pics/fill-blanks.png',
    fields: ['test_text', 'blanks']
  }
];
```

### **3. Fill Blanks Test Creator (Following Drawing Test Pattern)**

**Reference**: `src/components/test/DrawingTestCreator.jsx` - Lexical integration pattern

```javascript
// Create src/components/test/FillBlanksTestCreator.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import LexicalEditor from '../ui/LexicalEditor';

const FillBlanksTestCreator = ({
  testName = '',
  onTestSaved,
  onCancel,
  onBackToCabinet,
  isSaving = false,
  validationErrors = {}
}) => {
  const { user } = useAuth();
  const { post } = useApi();
  const { showNotification } = useNotification();

  const [testData, setTestData] = useState({
    test_name: testName,
    test_text: '', // Main text content from Lexical editor
    num_questions: 1, // Auto-calculated based on blanks
    num_blanks: 0,
    passing_score: 100,
    separate_type: true, // true = separate mode, false = inline mode
    allowed_time: null, // Timer in minutes (null = no timer)
    blanks: [] // Array of blank objects with positions and options
  });

  const [ui, setUI] = useState({
    isLoading: false,
    error: null,
    showPreview: true
  });

  // Update test name when prop changes (like drawing test)
  useEffect(() => {
    setTestData(prev => ({
      ...prev,
      test_name: testName || ''
    }));
  }, [testName]);

  // Update main test text from Lexical editor
  const updateTestText = (content) => {
    setTestData(prev => ({
      ...prev,
      test_text: content
    }));
  };

  // Add blank button functionality - inserts blank at cursor position
  const addBlank = () => {
    const blankId = testData.blanks.length + 1;
    const newBlank = {
      id: blankId,
      position: 0, // Will be set by Lexical editor
      question: '', // Question text for this blank
      options: ['', '', '', ''], // Default 4 options
      correct_answer: ''
    };
    
    setTestData(prev => ({
      ...prev,
      blanks: [...prev.blanks, newBlank],
      num_blanks: prev.num_blanks + 1
    }));
  };

  // Remove blank functionality
  const removeBlank = (blankId) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.filter(blank => blank.id !== blankId),
      num_blanks: prev.num_blanks - 1
    }));
  };

  // Add option to blank
  const addBlankOption = (blankId) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, options: [...blank.options, ''] }
          : blank
      )
    }));
  };

  // Remove option from blank
  const removeBlankOption = (blankId, optionIndex) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? {
              ...blank,
              options: blank.options.filter((_, optIndex) => optIndex !== optionIndex),
              correct_answer: blank.correct_answer === String.fromCharCode(65 + optionIndex) ? '' : blank.correct_answer
            }
          : blank
      )
    }));
  };

  // Update blank option
  const updateBlankOption = (blankId, optionIndex, value) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? {
              ...blank,
              options: blank.options.map((option, optIndex) => 
                      optIndex === optionIndex ? value : option
              )
            }
          : blank
      )
    }));
  };

  // Update blank question text
  const updateBlankQuestion = (blankId, question) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, question }
          : blank
      )
    }));
  };

  // Update correct answer for blank
  const updateCorrectAnswer = (blankId, value) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, correct_answer: value }
          : blank
      )
    }));
  };

  // Save test function (following drawing test pattern)
  const handleSaveTest = async () => {
    if (!testData.test_name.trim()) {
      setUI(prev => ({ ...prev, error: 'Test name is required' }));
      return;
    }

    if (!testData.test_text.trim()) {
      setUI(prev => ({ ...prev, error: 'Test text is required' }));
      return;
    }

    if (testData.blanks.length === 0) {
      setUI(prev => ({ ...prev, error: 'At least one blank is required' }));
      return;
    }

    if (testData.blanks.some(blank => !blank.question.trim() || !blank.correct_answer)) {
      setUI(prev => ({ ...prev, error: 'All blanks must have question text and correct answer' }));
      return;
    }

    setUI(prev => ({ ...prev, isLoading: true, error: null }));

    try {
  // Prepare test data for parent component (following pattern of drawing test)
  const testDataForParent = {
    test_name: testData.test_name,
    test_text: testData.test_text,
    num_questions: testData.blanks.length, // Auto-calculated
    num_blanks: testData.blanks.length,
    separate_type: testData.separate_type, // Include mode
    passing_score: testData.passing_score,
    allowed_time: testData.allowed_time, // Timer setting
    blanks: testData.blanks.map((blank, index) => ({
      question_id: index + 1,
      question: blank.question,
      options: blank.options,
      correct_answer: blank.correct_answer
    }))
  };

      // Pass test data to parent component for processing (like drawing test)
      if (onTestSaved) {
        onTestSaved(testDataForParent);
      }
    } catch (error) {
      console.error('Error preparing fill blanks test:', error);
      setUI(prev => ({ 
        ...prev, 
        error: 'Failed to prepare fill blanks test. Please try again.' 
      }));
      showNotification('Failed to prepare fill blanks test', 'error');
    } finally {
      setUI(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="fill-blanks-test-creator max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Fill Blanks Test</h2>
          <p className="text-gray-600">Create a test with rich text content and multiple choice blanks</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span><strong>Test Name:</strong> {testName || 'Untitled Test'}</span>
                      <span><strong>Blanks:</strong> {testData.num_blanks} (auto-calculated)</span>
                      <span><strong>Timer:</strong> {testData.allowed_time ? `${testData.allowed_time} minutes` : 'No timer'}</span>
                      <span><strong>Shuffle:</strong> {testData.is_shuffled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
          {ui.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{ui.error}</p>
            </div>
          )}
        </div>

        {/* Blank Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Text Content with Blanks
              </h3>
              <p className="text-sm text-gray-500">Type your text and add blanks where needed</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Blank Mode Toggle */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Mode:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTestData(prev => ({ ...prev, separate_type: true }))}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      testData.separate_type === true
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Separate
                  </button>
                  <button
                    onClick={() => setTestData(prev => ({ ...prev, separate_type: false }))}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      testData.separate_type === false
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Inline
                  </button>
                </div>
              </div>
              <Button
                onClick={addBlank}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Blank
              </Button>
            </div>
          </div>
          
          {/* Mode Description */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{testData.separate_type === true ? 'Separate Mode:' : 'Inline Mode:'}</strong>{' '}
              {testData.separate_type === true 
                ? 'Students see numbered blanks in text and answer questions below'
                : 'Students see clickable blanks in text with dropdown options'
              }
            </p>
          </div>

          {/* Lexical Editor for Main Text (Following Drawing Test Pattern) */}
          <div className="border border-gray-300 rounded-lg">
            <LexicalEditor
              value={testData.test_text}
              onChange={updateTestText}
              placeholder="Type your text here. Click 'Add Blank' to insert blanks."
            />
          </div>
          
          {/* Add Blank Button (Following Drawing Test Pattern) */}
          <div className="mt-4 flex justify-center">
            <Button
              onClick={addBlank}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Blank
            </Button>
          </div>
          </div>

        {/* Blank Questions and Options - Only show in separate mode */}
        {testData.separate_type === true && (
          <div className="space-y-4">
            {testData.blanks.map((blank, index) => (
              <Card key={blank.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Blank {blank.id} Configuration</h4>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeBlank(blank.id)}
                    className="px-2 py-1 text-sm"
                  >
                    Remove Blank
                  </Button>
                </div>
            
            {/* Question Text for this Blank */}
          <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text for Blank {blank.id} *
              </label>
              <input
                type="text"
                placeholder="Enter question text for this blank"
                value={blank.question}
                onChange={(e) => updateBlankQuestion(blank.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          
          {/* Blank Options */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700">Answer Options:</h5>
            {blank.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                  {String.fromCharCode(65 + optionIndex)}
                </div>
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                  value={option || ''}
                  onChange={(e) => updateBlankOption(blank.id, optionIndex, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                {blank.options.length > 2 && (
            <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeBlankOption(blank.id, optionIndex)}
                    className="px-2 py-1 text-sm"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            
            {blank.options.length < 6 && (
              <Button
              variant="secondary"
                size="small"
                onClick={() => addBlankOption(blank.id)}
                className="w-full"
            >
                + Add Option
            </Button>
            )}
          </div>

          {/* Correct Answer Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            <select
              value={blank.correct_answer || ''}
              onChange={(e) => updateCorrectAnswer(blank.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select correct answer</option>
              {blank.options.filter(opt => opt.trim().length > 0).map((option, optIndex) => (
                <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                  {String.fromCharCode(65 + optIndex)}) {option}
                </option>
              ))}
            </select>
              </div>
            </Card>
          ))}
        </div>
        )}

        {/* Inline Mode - Show simplified blank configuration */}
        {testData.separate_type === false && (
          <div className="space-y-4">
            {testData.blanks.map((blank, index) => (
              <Card key={blank.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Blank {blank.id} Options</h4>
                <Button
                  variant="danger"
                  size="small"
                    onClick={() => removeBlank(blank.id)}
                  className="px-2 py-1 text-sm"
                >
                  Remove Blank
                </Button>
              </div>
              
                {/* Blank Options for Inline Mode */}
              <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Answer Options:</h5>
                  {blank.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      value={option || ''}
                        onChange={(e) => updateBlankOption(blank.id, optionIndex, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                      {blank.options.length > 2 && (
                      <Button
                        variant="danger"
                        size="small"
                          onClick={() => removeBlankOption(blank.id, optionIndex)}
                        className="px-2 py-1 text-sm"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                
                  {blank.options.length < 6 && (
                  <Button
                    variant="secondary"
                    size="small"
                      onClick={() => addBlankOption(blank.id)}
                    className="w-full"
                  >
                    + Add Option
                  </Button>
                )}
              </div>
              
                {/* Correct Answer Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer *
                </label>
                <select
                    value={blank.correct_answer || ''}
                    onChange={(e) => updateCorrectAnswer(blank.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select correct answer</option>
                    {blank.options.filter(opt => opt.trim().length > 0).map((option, optIndex) => (
                    <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                      {String.fromCharCode(65 + optIndex)}) {option}
                    </option>
                  ))}
                </select>
              </div>
        </Card>
      ))}
          </div>
        )}

        {/* Test Settings */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timer Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timer (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                placeholder="No timer"
                value={testData.allowed_time || ''}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  allowed_time: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no timer</p>
            </div>

          </div>
        </div>

        {/* Save Test Button */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTest}
            variant="primary"
            disabled={isSaving || testData.blanks.length === 0}
          >
            {isSaving ? <LoadingSpinner size="sm" /> : 'Save Test'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

### **4. Fill Blanks Test Student Component (Following Matching Test Pattern)**

**Reference**: `src/components/test/MatchingTestStudent.jsx` - Frontend-backend communication pattern

```jsx
// Create src/components/test/FillBlanksTestStudent.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNotification } from '@/components/ui/Notification';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useAntiCheating } from '@/hooks/useAntiCheating';
import { useLocalStorageManager } from '@/hooks/useLocalStorage';
import { getCachedData, setCachedData, CACHE_TTL, clearTestData } from '@/utils/cacheUtils';
import PerfectModal from '@/components/ui/PerfectModal';

const FillBlanksTestStudent = ({ 
  testText,
  blanks,
  separateType = true, // true = separate mode, false = inline mode
  allowedTime = null, // Timer in minutes
  testId, 
  testName,
  teacherId,
  subjectId,
  onTestComplete
}) => {
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const { showNotification } = useNotification();
  const { makeAuthenticatedRequest } = useApi();
  const { user } = useAuth();
  
  // Anti-cheating tracking (following matching test pattern)
  const { startTracking, stopTracking, getCheatingData, clearData } = useAntiCheating(
    'fill_blanks', 
    testId,
    user?.student_id || user?.id
  );
  
  const { getItem, setItem } = useLocalStorageManager();

  // Render main text with numbered blanks (separate mode)
  const renderTextWithBlanks = useCallback((text, blanks) => {
    try {
      let content = text;
      
      // Replace blank placeholders with numbered underscores
      blanks.forEach((blank, index) => {
        const blankPlaceholder = `[BLANK${blank.id}]`;
        const numberedBlank = `${index + 1}_________`;
        content = content.replace(blankPlaceholder, numberedBlank);
      });
      
      return (
        <div className="prose max-w-none mb-6">
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering text with blanks:', error);
      return <div className="text-red-500">Error loading test content</div>;
    }
  }, []);

  // Render main text with clickable dropdown blanks (inline mode)
  const renderTextWithInlineBlanks = useCallback((text, blanks) => {
    try {
      let content = text;
      const blankElements = [];
      
      // Replace blank placeholders with clickable dropdowns
      blanks.forEach((blank, index) => {
        const blankPlaceholder = `[BLANK${blank.id}]`;
        const selectedAnswer = answers[blank.id];
        const selectedOption = selectedAnswer ? blank.options[selectedAnswer.charCodeAt(0) - 65] : null;
        
        const blankDisplay = selectedOption ? (
          <span 
            key={index}
            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded border-2 border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors"
            onClick={() => setShowDropdown(blank.id)}
          >
            {selectedOption}
          </span>
        ) : (
          <span 
            key={index}
            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => setShowDropdown(blank.id)}
          >
            {index + 1}_________
          </span>
        );
        
        blankElements.push(blankDisplay);
        content = content.replace(blankPlaceholder, `__BLANK_${blank.id}__`);
      });
      
      // Split content and insert blank elements
      const parts = content.split(/__BLANK_\d+__/);
      const result = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          result.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
        if (i < blankElements.length) {
          result.push(blankElements[i]);
        }
      }
      
      return (
        <div className="prose max-w-none mb-6">
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {result}
            </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering text with inline blanks:', error);
      return <div className="text-red-500">Error loading test content</div>;
    }
  }, [answers]);

  // Render questions with multiple choice options
  const renderQuestions = useCallback((blanks) => {
    return (
      <div className="space-y-6">
        {blanks.map((blank, index) => (
          <Card key={blank.id} className="p-4">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Question {index + 1}
              </h4>
              <p className="text-gray-600 mb-4">{blank.question}</p>
            </div>
            
            <div className="space-y-3">
              {blank.options.filter(option => option.trim().length > 0).map((option, optIndex) => (
                <label key={optIndex} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name={`blank_${blank.id}`}
                    value={String.fromCharCode(65 + optIndex)}
                    checked={answers[blank.id] === String.fromCharCode(65 + optIndex)}
                    onChange={(e) => handleBlankAnswer(blank.id, e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }, [answers, handleBlankAnswer]);

  const handleBlankAnswer = useCallback((blankId, answer) => {
    const newAnswers = { ...answers, [blankId]: answer };
    setAnswers(newAnswers);
  }, [answers]);

  // Initialize test start time, shuffle blanks, and load saved progress
  useEffect(() => {
    if (testId && user?.student_id) {
      const startTime = new Date();
      setTestStartTime(startTime);
      
      // Start anti-cheating tracking (following matching test pattern)
      startTracking();
      console.log('🛡️ Anti-cheating tracking started for fill blanks test');
      
      // Initialize timer if enabled
      if (allowedTime) {
        setTimeRemaining(allowedTime * 60); // Convert minutes to seconds
      }
      
      
      // Load saved progress using cache pattern (following word matching)
      const progressKey = `test_progress_${user.student_id}_fill_blanks_${testId}`;
      const savedProgress = getCachedData(progressKey);
      if (savedProgress) {
        setAnswers(savedProgress.answers || {});
        setTestStartTime(new Date(savedProgress.startTime));
        console.log('🎯 Fill blanks test progress restored:', savedProgress);
      }
    }
  }, [testId, user?.student_id, allowedTime, blanks, startTracking]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Auto-save progress (following word matching pattern)
  useEffect(() => {
    if (testStartTime && user?.student_id && testId) {
      const interval = setInterval(() => {
        const progressData = {
          answers: answers,
          startTime: testStartTime.toISOString()
        };
        const progressKey = `test_progress_${user.student_id}_fill_blanks_${testId}`;
        setCachedData(progressKey, progressData, CACHE_TTL.test_progress);
        console.log('🎯 Fill blanks progress auto-saved');
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [testStartTime, answers, user?.student_id, testId]);

  // Cleanup anti-cheating on component unmount (following matching test pattern)
  useEffect(() => {
    return () => {
      stopTracking();
      clearData();
      console.log('🛡️ Fill blanks test component unmounted - anti-cheating cleanup');
    };
  }, [stopTracking, clearData]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Calculate score using frontend scoring (following multiple choice pattern)
      const totalBlanks = blanks.length;
      let correctBlanks = 0;
      
      // Check each blank answer
      blanks.forEach((blank, index) => {
        const studentAnswer = answers[blank.id];
        if (studentAnswer && studentAnswer === blank.correct_answer) {
          correctBlanks++;
        }
      });
      
      const score = correctBlanks;
      const maxScore = totalBlanks;
      
      console.log(`🎯 Fill Blanks Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0;
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      // Get anti-cheating data (following matching test pattern)
      const cheatingData = getCheatingData();
      console.log('🛡️ Anti-cheating data for fill blanks submission:', cheatingData);
      
      // Prepare submission data (following word matching pattern)
      const submissionData = {
        test_id: testId,
        test_name: testName,
        teacher_id: teacherId || null,
        subject_id: subjectId || null,
        student_id: user.student_id,
        answers: answers,
        score: score,
        maxScore: maxScore,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: cheatingData.caught_cheating,
        visibility_change_times: cheatingData.visibility_change_times
      };
      
      console.log('🎯 Submitting fill blanks test:', submissionData);
      
      // Submit test results (following word matching pattern)
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-fill-blanks-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const result = await response.json();
      
      if (result.success) {
      showNotification('Test submitted successfully!', 'success');

        // Clear anti-cheating data (following matching test pattern)
        stopTracking();
        clearData();
        console.log('🛡️ Anti-cheating tracking stopped and data cleared for fill blanks test');

        // Clear test data from cache (following word matching pattern)
        if (user?.student_id) {
          clearTestData(user.student_id, 'fill_blanks', testId);
          console.log('🎓 Fill blanks test data cleared from cache');
        }

        // Mark test as completed in localStorage (following word matching pattern)
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_fill_blanks_${testId}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Fill blanks test marked as completed in localStorage:', completionKey);
        }

        // Cache the test results immediately after successful submission (following word matching pattern)
        if (user?.student_id) {
          const cacheKey = `student_results_table_${user.student_id}`;
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Fill blanks test results cached with key:', cacheKey);
        }

      setShowSubmitModal(false);

        // Navigate back to student cabinet with score (following word matching pattern)
        setTimeout(() => {
          if (onTestComplete) {
            onTestComplete(score);
          }
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      showNotification('Error submitting test. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, blanks, testId, testName, teacherId, subjectId, testStartTime, getCheatingData, stopTracking, clearData, makeAuthenticatedRequest, showNotification, onTestComplete, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              {mode === 'student' ? `Question ${displayNumber}` : `Question ${question?.question_id}`}
            </h3>
            {isSubmitting && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <LoadingSpinner size="small" />
                <span>Submitting...</span>
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {/* Timer Display */}
          {timeRemaining !== null && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Time Remaining:</span>
                <span className={`text-lg font-bold ${timeRemaining <= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
          </div>
            </div>
          )}

          {/* Main Text - Different rendering based on mode */}
          {separateType === true ? (
            <>
              {/* Separate Mode: Numbered blanks + Questions below */}
              {renderTextWithBlanks(testText, blanks)}
              {renderQuestions(blanks)}
            </>
          ) : (
            <>
              {/* Inline Mode: Clickable blanks in text */}
              {renderTextWithInlineBlanks(testText, blanks)}
            </>
          )}
        </Card.Body>
        
        {/* Inline Mode Dropdown */}
        {separateType === false && showDropdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Select Answer</h3>
              <div className="space-y-2">
                {blanks.find(b => b.id === showDropdown)?.options.filter(option => option.trim().length > 0).map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => {
                      handleBlankAnswer(showDropdown, String.fromCharCode(65 + optIndex));
                      setShowDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    <span className="font-semibold text-blue-600 mr-2">
                      {String.fromCharCode(65 + optIndex)})
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowDropdown(null)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Card.Footer>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowSubmitModal(true)}
              variant="success"
              disabled={isSubmitting || Object.keys(answers).length !== blanks.length}
            >
              {timeRemaining !== null && timeRemaining <= 60 ? 'Submit Now' : 'Submit Answer'}
            </Button>
          </div>
        </Card.Footer>
      </Card>

      {/* Submit Confirmation Modal */}
      <PerfectModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Answer"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to submit your answer? You cannot change it after submission.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowSubmitModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="success"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : 'Submit'}
            </Button>
          </div>
        </div>
      </PerfectModal>
    </motion.div>
  );
};

export default FillBlanksTestStudent;
```

### **5. Scoring Integration**
```javascript
// Update src/utils/scoreCalculation.js
const checkAnswerCorrectness = (question, studentAnswer, testType) => {
  // ... existing cases
  
  case TEST_TYPES.FILL_BLANKS:
    // For fill blanks, compare student answer with correct answer for this specific blank
    if (question.correct_answer && studentAnswer) {
      // Support both letter answers (A, B, C, ...) and numeric indices
      let userLetter = '';
      if (typeof studentAnswer === 'string') {
        const trimmed = studentAnswer.trim();
        if (/^[a-z]$/i.test(trimmed)) {
          userLetter = trimmed.toUpperCase();
        } else if (/^\d+$/.test(trimmed)) {
          const n = parseInt(trimmed, 10);
          const idx = n >= 0 ? n : NaN;
          if (!Number.isNaN(idx)) userLetter = String.fromCharCode(65 + idx);
        }
      } else if (typeof studentAnswer === 'number') {
        const idx = studentAnswer;
        if (!Number.isNaN(idx)) userLetter = String.fromCharCode(65 + idx);
      }
      return userLetter !== '' && userLetter === String(question.correct_answer || '').toUpperCase();
    }
    return false;
    break;
};
```

## 🔧 **Backend Implementation (Following Matching Test Pattern)**

**Reference**: `functions/save-test-with-assignments.js` - Unified test saving pattern

### **1. Save Test Function**
```javascript
// Update functions/save-test-with-assignments.js
case 'fill_blanks':
  testTable = 'fill_blanks_tests';
  const fbResult = await sql`
    INSERT INTO fill_blanks_tests (teacher_id, subject_id, test_name, test_text, num_questions, num_blanks, separate_type, allowed_time, created_at)
    VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${test_text}, ${num_questions}, ${num_blanks}, ${separate_type === true}, ${allowed_time || null}, NOW() AT TIME ZONE 'UTC')
    RETURNING id
  `;
  testId = fbResult[0].id;
  break;
```

### **2. Backend Response and Frontend Notifications**
```javascript
// In functions/submit-fill-blanks-test.js, return JSON only.
// Frontend components (Student/Teacher) show notifications based on response.
return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify({ success: true, score: actualScore, max_score: totalQuestions })
};
```

### **2. Get Test Questions**
```javascript
// Update functions/get-test-questions.js
case 'fill_blanks':
  const fbTest = await sql`
    SELECT 
      fbt.test_text,
      fbt.separate_type,
      fbt.allowed_time,
      fbt.num_blanks
    FROM fill_blanks_tests fbt
    WHERE fbt.id = ${testId}
  `;
  
  const fbQuestions = await sql`
    SELECT 
      fbq.question_id,
      fbq.question_json,
      fbq.blank_positions,
      fbq.blank_options,
      fbq.correct_answers
    FROM fill_blanks_test_questions fbq
    WHERE fbq.test_id = ${testId}
    ORDER BY fbq.question_id
  `;
  
  // Return test with main text and questions
  return {
    test_text: fbTest[0].test_text,
    separate_type: fbTest[0].separate_type,
    blanks: fbQuestions,
    allowed_time: fbTest[0].allowed_time,
    num_blanks: fbTest[0].num_blanks
  };
  break;
```

### **3. Submit Test Results (Following Matching Test Pattern)**

**Reference**: `functions/submit-matching-type-test.js` - Submission pattern

```javascript
// Create functions/submit-fill-blanks-test.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Parse request body (following multiple choice pattern)
    const { test_id, test_name, teacher_id, subject_id, score, maxScore, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times } = JSON.parse(event.body);
    
    // Extract student info from JWT token
    const studentId = decoded.sub;
    const studentGrade = decoded.grade;
    const studentClass = decoded.class;
    const studentNumber = decoded.number;
    const studentName = decoded.name;
    const studentSurname = decoded.surname;
    const studentNickname = decoded.nickname;

    // Validate required fields (handle 0 values properly)
    if (test_id === undefined || test_id === null || 
        !test_name || 
        !teacher_id || !subject_id ||
        score === undefined || score === null || 
        maxScore === undefined || maxScore === null || 
        !answers) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, teacher_id, subject_id, score, maxScore, answers' 
        })
      };
    }

    // Connect to database using @neondatabase/serverless
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Use frontend calculated score directly (following multiple choice pattern)
    const actualScore = score;
    const totalQuestions = maxScore;
    
    // Calculate percentage manually (not generated column)
    const percentageScore = Math.round((actualScore / totalQuestions) * 100);

    // Insert test result with correct field names
    const result = await sql`
      INSERT INTO fill_blanks_test_results 
      (test_id, test_name, teacher_id, subject_id, student_id, student_name, student_surname, student_nickname, student_grade, student_class, student_number, score, max_score, percentage_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, created_at)
      VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${studentId}, ${studentName}, ${studentSurname}, ${studentNickname}, ${studentGrade}, ${studentClass}, ${studentNumber}, ${actualScore}, ${totalQuestions}, ${percentageScore}, ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, NOW())
      RETURNING id
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        result_id: result[0].id,
        score: actualScore,
        max_score: totalQuestions,
        percentage_score: percentageScore,
        message: 'Fill blanks test submitted successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error' 
      })
    };
  }
};
```

## 📊 **Data Structure Examples**

### **Test Data Structure**
```json
{
  "test_text": "The capital of France is [BLANK1] and the capital of Germany is [BLANK2]. The largest city in Italy is [BLANK3].",
  "blanks": [
    {
      "id": 1,
      "question": "What is the capital of France?",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correct_answer": "A"
    },
    {
      "id": 2,
      "question": "What is the capital of Germany?",
      "options": ["Berlin", "Munich", "Hamburg", "Cologne"],
      "correct_answer": "A"
    },
    {
      "id": 3,
      "question": "What is the largest city in Italy?",
      "options": ["Rome", "Milan", "Naples", "Turin"],
      "correct_answer": "A"
    }
  ]
}
```

### **Student Answer Structure**
```json
{
  "1": "A",  // Blank 1: Paris
  "2": "A",  // Blank 2: Berlin
  "3": "A"   // Blank 3: Rome
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Database Setup**
1. Create database tables
2. Add indexes for performance
3. Test table creation

### **Phase 2: Backend APIs**
1. Update `save-test-with-assignments.js`
2. Update `get-test-questions.js`
3. Create `submit-fill-blanks-test.js`
4. Test API endpoints

### **Phase 3: Frontend Components**
1. Create `FillBlanksTestCreator.jsx`
2. Create `FillBlanksTestStudent.jsx`
3. Update `TestForm.jsx` to include fill-blanks
4. Update scoring functions

### **Phase 4: Integration**
1. Update `TeacherTests.jsx` for fill-blanks
2. Update `StudentTests.jsx` for fill-blanks
3. Test complete flow
4. Add to materialized view:
   - Union `fill_blanks_test_results` into `class_summary_view` in `class_summary_semester_view.sql`
   - Ensure columns: teacher_id, subject_id, grade, class, student_id, score, max_score, caught_cheating, submitted_at, academic_year, semester
   - Add indexes:
     - `CREATE INDEX IF NOT EXISTS idx_fb_results_teacher ON fill_blanks_test_results(teacher_id);`
     - `CREATE INDEX IF NOT EXISTS idx_fb_results_subject ON fill_blanks_test_results(subject_id);`
     - `CREATE INDEX IF NOT EXISTS idx_fb_results_submitted_at ON fill_blanks_test_results(submitted_at);`
     - `CREATE INDEX IF NOT EXISTS idx_fb_results_period ON fill_blanks_test_results(academic_period_id);`

### **Phase 5: LocalStorage Integration**
1. **Student Progress**: Auto-save each blank answer with 1-second delay
2. **Timer Persistence**: Store remaining time with drift correction
3. **Shuffle Order**: Cache deterministic question order for consistent experience
4. **Cleanup Strategy**: Clear all test data on successful submission
5. **Login Cleanup**: Remove test data older than 7 days on login

## 🎯 **Key Features (Following Drawing + Matching Test Patterns)**

### **Teacher Experience (Following Drawing Test Pattern)**
- **Rich text editor** with Lexical for main content creation (like DrawingTestCreator)
- **Add blank button** separate from Lexical editor (following drawing test pattern)
- **Blank visualization** showing "Blank1", "Blank2", etc. in the editor
- **Question configuration** for each blank with multiple choice options
- **Correct answer selection** for each blank
- **Timer support** like other tests

### **Student Experience (Following Matching Test Pattern)**
- **Main text display** with blanks replaced by dropdown selectors
- **Multiple choice options** for each blank (A, B, C, D)
- **Auto-scoring** like multiple choice tests
- **Progress tracking** and timer support
- **Frontend-backend communication** following matching test pattern

### **LocalStorage Management**
- **Student Progress**: `test_progress_{studentId}_{testType}_{testId}` for all blank answers
- **Timer Persistence**: `test_timer_{studentId}_{testType}_{testId}` with remaining time and drift correction
- **Auto-save**: 1-second delay for student answers, 2-second delay for teacher forms
- **Cleanup**: Clear all test data on successful submission or login cleanup (7+ days old)

### **Scoring System**
- **Auto-scored** like multiple choice tests
- **Per-blank scoring**: score equals number of correct blanks; max equals total blanks
- **Percentage calculation** based on correct blanks
- **Integration with existing scoring functions**

#### **Two-Tier Scoring Architecture**
1. **Frontend Immediate Scoring**: 
   - Uses `checkAnswerCorrectness()` from `scoreCalculation.js`
   - Provides instant feedback to students
   - Calculates score before submission

2. **Backend Scoring Validation**:
   - Accepts frontend-calculated score
   - Stores results in database
   - Maintains consistency with frontend logic

#### **Scoring Functions**
- **`checkAnswerCorrectness()`**: Validates individual blank answers
- **`calculateTestScore()`**: Calculates overall test score (for fill_blanks, sums correct blanks across all questions)
- **`calculatePercentage()`**: Converts score to percentage
- **Backend submission**: Stores validated scores in database

## 📈 **Benefits**

1. **Flexible Content**: Rich text with multiple blanks
2. **Auto-Scoring**: No manual grading required
3. **Familiar Interface**: Similar to existing test types
4. **Scalable**: Support for multiple questions and blanks
5. **Integrated**: Works with existing timer and scoring systems

## 🔄 **Implementation Patterns**

### **Drawing Test Pattern (Lexical Integration)**
- **Reference**: `src/components/test/DrawingTestCreator.jsx`
- **Lexical Editor**: Uses `LexicalEditor` component for rich text content
- **Content Storage**: Stores Lexical JSON in `question_json` field
- **Add Button**: Separate "Add Question" button outside Lexical editor
- **Content Rendering**: Renders Lexical JSON in student view

### **Matching Test Pattern (Frontend-Backend Communication)**
- **Reference**: `src/components/test/MatchingTestStudent.jsx`
- **Submission Flow**: Frontend calculates score → Backend stores results
- **Anti-cheating**: Uses `useAntiCheating` hook for tracking
- **Cache Management**: Auto-save progress and clear on completion
- **Error Handling**: Comprehensive error handling and notifications

## 🎨 **Visual Blank Indicators in Lexical Editor**

### **Blank Visualization System**
- **Teacher View**: Blanks appear as highlighted yellow boxes with "Blank1", "Blank2", etc.
- **Interactive Editing**: Teachers can click on blank indicators to edit their configuration
- **Real-time Updates**: Adding/removing blanks updates the visual indicators immediately
- **Position Tracking**: Blanks maintain their position in the text even when content is edited

### **CSS for Blank Indicators**
```css
.blank-indicator {
  background-color: #fef3c7;
  border: 2px dashed #f59e0b;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 2px;
  display: inline-block;
  font-weight: 600;
  color: #92400e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.blank-indicator:hover {
  background-color: #fde68a;
  border-color: #d97706;
}

.blank-indicator.selected {
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}
```

This implementation combines the best of drawing tests (rich content) with multiple choice tests (auto-scoring) to create a powerful new test type!
