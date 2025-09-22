import React, { useState } from 'react';
import DrawingTestCreator from '../components/test/DrawingTestCreator';
import DrawingTestStudent from '../components/test/DrawingTestStudent';
import { TestProvider } from '../contexts/TestContext';

// Demo component to test drawing test functionality
const DrawingTestDemo = () => {
  const [mode, setMode] = useState('creator'); // 'creator' or 'student'
  const [testData, setTestData] = useState(null);

  // Mock test data for student mode
  const mockTestData = {
    id: 1,
    test_name: 'Sample Drawing Test',
    teacher_id: 'T001',
    subject_id: 1,
    num_questions: 2,
    questions: [
      {
        question_id: 1,
        question_json: 'Draw a house with a tree next to it. Make sure to include windows and a door.',
        canvas_width: 600,
        canvas_height: 800,
        max_canvas_width: 1536,
        max_canvas_height: 2048
      },
      {
        question_id: 2,
        question_json: 'Draw a simple landscape with mountains in the background and a river in the foreground.',
        canvas_width: 600,
        canvas_height: 800,
        max_canvas_width: 1536,
        max_canvas_height: 2048
      }
    ]
  };

  const handleTestCreated = (data) => {
    console.log('Test created:', data);
    setTestData(data);
    setMode('student');
  };

  const handleTestSaved = (data) => {
    console.log('Test saved:', data);
    alert('Test saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Drawing Test Demo</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('creator')}
              className={`px-4 py-2 rounded-lg ${
                mode === 'creator' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Creator Mode
            </button>
            <button
              onClick={() => setMode('student')}
              className={`px-4 py-2 rounded-lg ${
                mode === 'student' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Student Mode
            </button>
          </div>
        </div>

        {mode === 'creator' ? (
          <DrawingTestCreator
            testName="Demo Drawing Test"
            onTestSaved={handleTestCreated}
            onCancel={() => console.log('Canceled')}
            onBackToCabinet={() => console.log('Back to cabinet')}
            isSaving={false}
            validationErrors={{}}
          />
        ) : (
          <TestProvider>
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800">
                <strong>Note:</strong> This is a demo with mock data. In a real implementation, 
                the test data would come from the TestContext after loading a specific test.
              </p>
            </div>
            <DrawingTestStudent />
          </TestProvider>
        )}
      </div>
    </div>
  );
};

export default DrawingTestDemo;
