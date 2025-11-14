import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button, LoadingSpinner, useNotification } from '../ui/components-ui-index';
import Card from '../ui/Card';
import MathEditorButton from '../math/MathEditorButton';
import { renderMathInText } from '../../utils/mathRenderer';
import { validateImageFile } from '../../utils/imageUtils';
import axios from 'axios';

const MiniGameCreator = ({ onGameSaved, onCancel }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // Hardcoded subjects from database
  const subjects = [
    { subject_id: 1, subject: 'Listening and Speaking' },
    { subject_id: 2, subject: 'English for career' },
    { subject_id: 3, subject: 'Tourism' },
    { subject_id: 4, subject: 'Reading and Writing' },
    { subject_id: 5, subject: 'Geography' },
    { subject_id: 6, subject: 'Grammar' },
    { subject_id: 7, subject: 'English for Communication' },
    { subject_id: 8, subject: 'Health' },
    { subject_id: 9, subject: 'Science Fundamental' },
    { subject_id: 10, subject: 'Science Supplementary' },
    { subject_id: 11, subject: 'Chemistry' },
    { subject_id: 12, subject: 'Biology' },
    { subject_id: 13, subject: 'Math Fundamental' },
    { subject_id: 14, subject: 'Math Supplementary' }
  ];

  // Basic form state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [topic, setTopic] = useState('');
  const [gameName, setGameName] = useState('');
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' or 'ai'
  
  // Custom tab state
  const [numQuestions, setNumQuestions] = useState(3);
  const [customQuestions, setCustomQuestions] = useState([]);
  
  // AI tab state
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for MathEditorButton
  const questionRefs = useRef({});
  const optionRefs = useRef({});

  // Initialize custom questions when numQuestions changes
  useEffect(() => {
    if (activeTab === 'custom' && numQuestions > 0) {
      const newQuestions = Array.from({ length: numQuestions }, (_, i) => ({
        question_id: i + 1,
        question_text: '',
        question_image_url: null,
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A'
      }));
      setCustomQuestions(newQuestions);
    }
  }, [numQuestions, activeTab]);

  const [selectedSubjectName, setSelectedSubjectName] = useState('');

  const handleSubjectChange = (e) => {
    const subjectId = parseInt(e.target.value);
    setSelectedSubject(subjectId);
    
    // Get subject name for KaTeX detection
    const subject = subjects.find(s => s.subject_id === subjectId);
    if (subject) {
      // Store subject name for AI generation
      setSelectedSubjectName(subject.subject);
    }
  };

  const handleGradeChange = (e) => {
    setSelectedGrade(parseInt(e.target.value));
  };

  const handleCustomQuestionChange = (questionId, field, value) => {
    setCustomQuestions(prev => prev.map(q => 
      q.question_id === questionId 
        ? { ...q, [field]: value }
        : q
    ));
  };

  const handleImageUpload = async (questionId, file) => {
    if (!file) return;

    try {
      // Validate image
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        showNotification(validation.errors.join(', '), 'error');
        return;
      }

      // Compress if needed
      let processedFile = file;
      if (file.size > 500 * 1024) {
        showNotification('Image is large, compressing...', 'info');
        // Compression would be handled here if needed
      }

      // Upload to Cloudinary
      // Convert file to base64 for Netlify function
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          // Use tokenManager for authenticated request
          if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            throw new Error('No valid authentication token found');
          }
          
          const token = await window.tokenManager.getToken();
          const response = await axios.post('/.netlify/functions/upload-image', {
            image: base64Data,
            folder: 'mini_games',
            filename: file.name
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            handleCustomQuestionChange(questionId, 'question_image_url', response.data.url);
            showNotification('Image uploaded successfully', 'success');
          } else {
            showNotification('Failed to upload image', 'error');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          showNotification('Failed to upload image', 'error');
        }
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('Failed to upload image', 'error');
    }
  };

  const handleGenerateAIQuestions = async () => {
    if (!selectedSubject || !selectedGrade || !topic || !aiNumQuestions) {
      showNotification('Please fill in subject, grade, topic, and number of questions', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Use tokenManager for authenticated request (like speaking test)
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }

      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/mini-game-generate-ai-questions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: selectedSubject,
            subjectName: selectedSubjectName,
            grade: selectedGrade,
            topic: topic,
            numQuestions: aiNumQuestions
          })
        }
      );

      const data = await response.json();

      console.log('[Frontend] AI Question Generation Response:', {
        success: data.success,
        questionsCount: data.questions?.length,
        error: data.error,
        message: data.message,
        responseStatus: response.status
      });

      if (data.success && data.questions) {
        console.log('[Frontend] Setting AI questions:', data.questions.length);
        console.log('[Frontend] Sample question:', data.questions[0]);
        setAiQuestions(data.questions);
        showNotification(`Successfully generated ${data.questions.length} questions`, 'success');
      } else {
        console.error('[Frontend] Failed to generate questions:', data);
        showNotification(data.error || data.message || 'Failed to generate questions', 'error');
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      showNotification(error.message || 'Failed to generate questions', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIQuestionChange = (questionId, field, value) => {
    setAiQuestions(prev => prev.map(q => 
      q.question_id === questionId 
        ? { ...q, [field]: value }
        : q
    ));
  };

  const isMathOrScience = selectedSubjectName && (
    selectedSubjectName.toLowerCase().includes('math') ||
    selectedSubjectName.toLowerCase().includes('mathematics') ||
    selectedSubjectName.toLowerCase().includes('science') ||
    selectedSubjectName.toLowerCase().includes('physics') ||
    selectedSubjectName.toLowerCase().includes('chemistry')
  );

  const handleSave = async () => {
    // Validation
    if (!selectedSubject || !selectedGrade || !topic || !gameName) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const questions = activeTab === 'custom' ? customQuestions : aiQuestions;
    if (questions.length === 0) {
      showNotification('Please create at least one question', 'error');
      return;
    }

    // Validate all questions
    for (const q of questions) {
      if (!q.question_text && !q.question_image_url) {
        showNotification(`Question ${q.question_id} must have text or image`, 'error');
        return;
      }
      if (!q.option_a || !q.option_b) {
        showNotification(`Question ${q.question_id} must have at least 2 options`, 'error');
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        showNotification(`Question ${q.question_id} must have a valid correct answer`, 'error');
        return;
      }
    }

    try {
      setIsSaving(true);
      
      // Use tokenManager for authenticated request (like AI generation)
      console.log('[Save Game] Checking tokenManager...', {
        exists: !!window.tokenManager,
        isAuthenticated: window.tokenManager?.isAuthenticated?.()
      });
      
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }

      const requestBody = {
        subject_id: selectedSubject,
        grade: selectedGrade,
        class: 0, // Default class for grade-level games
        topic: topic,
        game_type: 'spell_duel',
        game_name: gameName
      };
      
      console.log('[Save Game] Making request with body:', requestBody);

      // Create game - class is set to 0 as default (all classes)
      // Use same pattern as testService.assignTestToClasses
      const gameResponse = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/create-mini-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[Save Game] Response status:', gameResponse.status, gameResponse.statusText);

      const gameData = await gameResponse.json();
      console.log('[Save Game] Response:', gameData);

      if (!gameData.success) {
        throw new Error(gameData.error || 'Failed to create game');
      }

      const gameId = gameData.game.id;

      // Save questions - use same pattern as testService
      const questionsResponse = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/save-mini-game-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          questions: questions
        })
      });

      const questionsData = await questionsResponse.json();
      console.log('[Save Questions] Response:', questionsData);

      if (!questionsData.success) {
        throw new Error(questionsData.error || 'Failed to save questions');
      }

      showNotification('Game created successfully', 'success');
      if (onGameSaved) {
        onGameSaved(gameId);
      }
    } catch (error) {
      console.error('Error saving game:', error);
      // Use same error handling pattern as testService
      showNotification(error.message || 'Failed to save game', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Create Mini Game</h2>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <select
              value={selectedSubject || ''}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grade *</label>
            <select
              value={selectedGrade || ''}
              onChange={handleGradeChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Grade</option>
              {[7, 8, 9, 10, 11, 12].map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Game Name *</label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'custom'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Custom
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'ai'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              AI Generated
            </button>
          </div>
        </div>

        {/* Custom Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <input
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {customQuestions.map((question, idx) => (
              <div key={question.question_id} className="relative">
                <QuestionEditor
                  question={question}
                  index={idx}
                  onQuestionChange={handleCustomQuestionChange}
                  onImageUpload={handleImageUpload}
                  isMathOrScience={isMathOrScience}
                  questionRefs={questionRefs}
                  optionRefs={optionRefs}
                />
                {customQuestions.length > 1 && (
                  <button
                    onClick={() => {
                      const newQuestions = customQuestions.filter(q => q.question_id !== question.question_id);
                      // Renumber questions
                      const renumbered = newQuestions.map((q, i) => ({
                        ...q,
                        question_id: i + 1
                      }));
                      setCustomQuestions(renumbered);
                    }}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete Question
                  </button>
                )}
              </div>
            ))}
            
            <Button
              onClick={() => {
                const newQuestionId = Math.max(...customQuestions.map(q => q.question_id), 0) + 1;
                setCustomQuestions([
                  ...customQuestions,
                  {
                    question_id: newQuestionId,
                    question_text: '',
                    question_image_url: null,
                    option_a: '',
                    option_b: '',
                    option_c: '',
                    option_d: '',
                    correct_answer: 'A'
                  }
                ]);
              }}
              variant="outline"
            >
              + Add Question
            </Button>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiNumQuestions}
                  onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button
                onClick={handleGenerateAIQuestions}
                disabled={isGenerating || !selectedSubject || !selectedGrade || !topic}
              >
                {isGenerating ? <LoadingSpinner size="sm" /> : 'Generate Questions'}
              </Button>
              {aiQuestions.length > 0 && (
                <Button
                  onClick={handleGenerateAIQuestions}
                  variant="outline"
                  disabled={isGenerating}
                >
                  Regenerate
                </Button>
              )}
            </div>

            {isGenerating && (
              <div className="flex justify-center p-8">
                <LoadingSpinner />
                <span className="ml-2">Generating questions...</span>
              </div>
            )}

            {aiQuestions.map((question, idx) => (
              <QuestionEditor
                key={question.question_id}
                question={question}
                index={idx}
                onQuestionChange={handleAIQuestionChange}
                onImageUpload={null}
                isMathOrScience={isMathOrScience}
                questionRefs={questionRefs}
                optionRefs={optionRefs}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <LoadingSpinner size="sm" /> : 'Save Game'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Question Editor Component
const QuestionEditor = ({ 
  question, 
  index, 
  onQuestionChange, 
  onImageUpload,
  isMathOrScience,
  questionRefs,
  optionRefs
}) => {
  const { showNotification } = useNotification();
  const [showPreview, setShowPreview] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && onImageUpload) {
      onImageUpload(question.question_id, file);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Question {index + 1}</h3>
        {isMathOrScience && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium mb-2">Question Text</label>
        <div className="flex gap-2">
          <input
            ref={el => questionRefs.current[`q_${question.question_id}`] = el}
            type="text"
            value={question.question_text || ''}
            onChange={(e) => onQuestionChange(question.question_id, 'question_text', e.target.value)}
            placeholder="Enter question text"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          {isMathOrScience && (
            <MathEditorButton
              inputRef={questionRefs.current[`q_${question.question_id}`]}
              onInsert={(formula) => {
                const current = question.question_text || '';
                const newValue = current + (current ? ' ' : '') + `$${formula}$`;
                onQuestionChange(question.question_id, 'question_text', newValue);
              }}
            />
          )}
        </div>
        {showPreview && question.question_text && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div dangerouslySetInnerHTML={{ __html: renderMathInText(question.question_text) }} />
          </div>
        )}
      </div>

      {/* Question Image */}
      {onImageUpload && (
        <div>
          <label className="block text-sm font-medium mb-2">Question Image (Optional, max 500KB)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border rounded-md"
          />
          {question.question_image_url && (
            <div className="mt-2">
              <img src={question.question_image_url} alt="Question" className="max-w-xs rounded" />
              <button
                onClick={() => onQuestionChange(question.question_id, 'question_image_url', null)}
                className="ml-2 text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Options */}
      {['A', 'B', 'C', 'D'].map((option, optIdx) => (
        <div key={option}>
          <label className="block text-sm font-medium mb-2">Option {option} *</label>
          <div className="flex gap-2">
            <input
              ref={el => optionRefs.current[`${question.question_id}_${option}`] = el}
              type="text"
              value={question[`option_${option.toLowerCase()}`] || ''}
              onChange={(e) => onQuestionChange(question.question_id, `option_${option.toLowerCase()}`, e.target.value)}
              placeholder={`Enter option ${option}`}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            {isMathOrScience && (
              <MathEditorButton
                inputRef={optionRefs.current[`${question.question_id}_${option}`]}
                onInsert={(formula) => {
                  const current = question[`option_${option.toLowerCase()}`] || '';
                  const newValue = current + (current ? ' ' : '') + `$${formula}$`;
                  onQuestionChange(question.question_id, `option_${option.toLowerCase()}`, newValue);
                }}
              />
            )}
          </div>
          {showPreview && question[`option_${option.toLowerCase()}`] && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <div dangerouslySetInnerHTML={{ __html: renderMathInText(question[`option_${option.toLowerCase()}`]) }} />
            </div>
          )}
        </div>
      ))}

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium mb-2">Correct Answer *</label>
        <select
          value={question.correct_answer || 'A'}
          onChange={(e) => onQuestionChange(question.question_id, 'correct_answer', e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          {['A', 'B', 'C', 'D'].map(opt => (
            <option key={opt} value={opt}>Option {opt}</option>
          ))}
        </select>
      </div>
    </Card>
  );
};

export default MiniGameCreator;

