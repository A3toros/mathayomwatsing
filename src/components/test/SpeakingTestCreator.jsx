import React, { useState, useCallback } from 'react';
import { useNotification } from '../ui/Notification';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const SpeakingTestCreator = ({
  testName = '',
  onTestSaved,
  onCancel,
  onBackToCabinet,
  isSaving = false,
  validationErrors = {}
}) => {
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    min_words: 50, // Only field that requires teacher input
    questions: [
      {
        question_id: 1,
        prompt: '',
        expected_duration: null,
        difficulty_level: 'medium'
      }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleQuestionChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const addQuestion = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_id: prev.questions.length + 1,
          prompt: '',
          expected_duration: null,
          difficulty_level: 'medium'
        }
      ]
    }));
  }, []);

  const removeQuestion = useCallback((index) => {
    if (formData.questions.length > 1) {
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  }, [formData.questions.length]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (formData.min_words < 10) {
      errors.min_words = 'Minimum word count must be at least 10 words';
    }
    
    // Validate questions
    formData.questions.forEach((question, index) => {
      if (!question.prompt.trim()) {
        errors[`question_${index}_prompt`] = 'Question prompt is required';
      }
    });
    
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      showNotification('Please fix the validation errors', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare test data for parent component (following pattern of other creators)
      const testDataForParent = {
        test_name: testName,
        time_limit: 300, // Default: 5 minutes
        min_duration: 30, // Default: 30 seconds
        max_duration: 600, // Default: 10 minutes
        max_attempts: 3, // Default: 3 attempts
        min_words: formData.min_words,
        passing_score: 50, // Default: 50%
        allowed_time: null, // Default: no time limit
        questions: formData.questions.map((q, index) => ({
          question_id: index + 1,
          prompt: q.prompt,
          expected_duration: q.expected_duration,
          difficulty_level: q.difficulty_level
        }))
      };

      // Pass test data to parent component for processing (like other creators)
      console.log('🎯 [DEBUG] Calling onTestSaved with data:', testDataForParent);
      if (onTestSaved) {
        console.log('🎯 [DEBUG] onTestSaved function exists, calling it...');
        onTestSaved(testDataForParent);
        console.log('🎯 [DEBUG] onTestSaved called successfully');
      } else {
        console.log('❌ [DEBUG] onTestSaved function is null/undefined');
      }
    } catch (error) {
      console.error('Error preparing speaking test:', error);
      showNotification('Failed to prepare speaking test', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, showNotification, onTestSaved, testName]);

  if (isLoading || isSaving) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Creating speaking test...</span>
      </div>
    );
  }

  return (
    <div className="speaking-test-creator max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Speaking Test</h2>
          <p className="text-gray-600">Create a speaking test where students record audio responses with AI-powered feedback</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Scoring Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Scoring Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Word Count *
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.min_words}
                  onChange={(e) => handleInputChange('min_words', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {validationErrors.min_words && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.min_words}</p>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                >
                  Add Question
                </Button>
              </div>
              
              {formData.questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    {formData.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Prompt *
                      </label>
                      <textarea
                        value={question.prompt}
                        onChange={(e) => handleQuestionChange(index, 'prompt', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Enter the question prompt for students"
                      />
                      {validationErrors[`question_${index}_prompt`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors[`question_${index}_prompt`]}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Duration (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="600"
                          value={question.expected_duration || ''}
                          onChange={(e) => handleQuestionChange(index, 'expected_duration', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={question.difficulty_level}
                          onChange={(e) => handleQuestionChange(index, 'difficulty_level', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || isSaving}
              >
                {isLoading || isSaving ? 'Creating...' : 'Create Speaking Test'}
              </Button>
            </div>
        </form>
      </Card>
    </div>
  );
};

export default SpeakingTestCreator;
