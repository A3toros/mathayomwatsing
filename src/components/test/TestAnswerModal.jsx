import React, { useMemo } from 'react';
import PerfectModal from '@/components/ui/PerfectModal';
import { LoadingSpinner } from '@/components/ui/components-ui-index';

const TestAnswerModal = ({
  isOpen,
  onClose,
  testResult,
  questions,
  isLoadingQuestions
}) => {
  // Parse answers JSONB safely
  const parseAnswers = (answers) => {
    if (!answers) return {};
    
    if (typeof answers === 'string') {
      try {
        return JSON.parse(answers);
      } catch {
        return {};
      }
    }
    
    return answers || {};
  };

  const studentAnswers = useMemo(() => {
    const rawAnswers = testResult?.answers;
    console.log('📝 [TestAnswerModal] Raw testResult.answers:', rawAnswers);
    console.log('📝 [TestAnswerModal] Raw testResult.answers type:', typeof rawAnswers);
    
    // Handle answers_by_id format: { answers_by_id: {...}, question_order: [...] }
    if (rawAnswers && typeof rawAnswers === 'object') {
      if (rawAnswers.answers_by_id) {
        console.log('📝 [TestAnswerModal] Found answers_by_id format');
        console.log('📝 [TestAnswerModal] answers_by_id:', rawAnswers.answers_by_id);
        console.log('📝 [TestAnswerModal] question_order:', rawAnswers.question_order);
        // Use answers_by_id directly - it's already keyed by question_id
        return rawAnswers.answers_by_id || {};
      }
    }
    
    // Otherwise, parse as regular answers object
    const parsed = parseAnswers(rawAnswers);
    console.log('📝 [TestAnswerModal] Parsed student answers:', parsed);
    console.log('📝 [TestAnswerModal] Full testResult:', testResult);
    return parsed;
  }, [testResult?.answers]);

  // Render Multiple Choice answers
  const renderMultipleChoice = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Q#
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((q, index) => {
              // Try both string and number keys for question_id matching
              const questionIdNum = q.question_id || q.id || (index + 1);
              const questionIdStr = String(questionIdNum);
              const questionIdNumKey = Number(questionIdNum);
              
              // Try multiple key formats: string, number, and numeric string
              const studentAnswer = studentAnswers[questionIdStr] !== undefined 
                ? studentAnswers[questionIdStr]
                : studentAnswers[questionIdNumKey] !== undefined
                ? studentAnswers[questionIdNumKey]
                : studentAnswers[questionIdNum] !== undefined
                ? studentAnswers[questionIdNum]
                : undefined;
              
              const correctAnswer = q.correct_answer;
              const isCorrect = studentAnswer === correctAnswer;
              
              // Get option text
              const getOptionText = (letter) => {
                const optionKey = `option_${letter.toLowerCase()}`;
                return q[optionKey] || letter;
              };

              return (
                <tr key={questionIdStr} className={isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {q.question}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {studentAnswer ? (
                      <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {studentAnswer} - {getOptionText(studentAnswer)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No answer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {correctAnswer} - {getOptionText(correctAnswer)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {isCorrect ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        ✗ Wrong
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render True/False answers
  const renderTrueFalse = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Q#
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((q, index) => {
              // Try both string and number keys for question_id matching
              const questionIdNum = q.question_id || q.id || (index + 1);
              const questionIdStr = String(questionIdNum);
              const questionIdNumKey = Number(questionIdNum);
              
              // Try multiple key formats: string, number, and numeric string
              const studentAnswer = studentAnswers[questionIdStr] !== undefined 
                ? studentAnswers[questionIdStr]
                : studentAnswers[questionIdNumKey] !== undefined
                ? studentAnswers[questionIdNumKey]
                : studentAnswers[questionIdNum] !== undefined
                ? studentAnswers[questionIdNum]
                : undefined;
              
              const correctAnswer = q.correct_answer;
              
              // Normalize both answers to boolean for comparison
              // Student answer might be boolean, string "true"/"false", or other
              let normalizedStudentAnswer;
              if (typeof studentAnswer === 'boolean') {
                normalizedStudentAnswer = studentAnswer;
              } else if (typeof studentAnswer === 'string') {
                normalizedStudentAnswer = studentAnswer.toLowerCase().trim() === 'true';
              } else if (studentAnswer === 1 || studentAnswer === '1') {
                normalizedStudentAnswer = true;
              } else if (studentAnswer === 0 || studentAnswer === '0') {
                normalizedStudentAnswer = false;
              } else {
                normalizedStudentAnswer = Boolean(studentAnswer);
              }
              
              // Correct answer should already be boolean, but normalize just in case
              let normalizedCorrectAnswer;
              if (typeof correctAnswer === 'boolean') {
                normalizedCorrectAnswer = correctAnswer;
              } else if (typeof correctAnswer === 'string') {
                normalizedCorrectAnswer = correctAnswer.toLowerCase().trim() === 'true';
              } else {
                normalizedCorrectAnswer = Boolean(correctAnswer);
              }
              
              const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;
              
              // Debug logging for first question
              if (index === 0) {
                console.log('📝 [TestAnswerModal] True/False First Question Debug:', {
                  questionIdStr,
                  studentAnswer,
                  studentAnswerType: typeof studentAnswer,
                  normalizedStudentAnswer,
                  correctAnswer,
                  correctAnswerType: typeof correctAnswer,
                  normalizedCorrectAnswer,
                  isCorrect
                });
              }
              
              // Display value for student answer (use normalized for display)
              const studentAnswerDisplay = studentAnswer !== undefined && studentAnswer !== null 
                ? normalizedStudentAnswer 
                : null;
              
              // Display value for correct answer
              const correctAnswerDisplay = normalizedCorrectAnswer;
              
              return (
                <tr key={questionIdStr} className={isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {q.question}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {studentAnswerDisplay !== null ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        studentAnswerDisplay ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {studentAnswerDisplay ? 'True' : 'False'}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No answer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      correctAnswerDisplay ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {correctAnswerDisplay ? 'True' : 'False'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {isCorrect ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        ✗ Wrong
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Input answers
  const renderInput = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    // Helper to check if answer is correct (using substring matching)
    const isAnswerCorrect = (studentAns, correctAnswers) => {
      if (!studentAns || !correctAnswers || correctAnswers.length === 0) return false;
      
      const normalizedStudent = String(studentAns).toLowerCase().trim();
      
      return correctAnswers.some(correctAns => {
        const normalizedCorrect = String(correctAns).toLowerCase().trim();
        
        // Exact match
        if (normalizedStudent === normalizedCorrect) return true;
        
        // Substring match (for multi-character answers)
        if (normalizedCorrect.length >= 2 && normalizedStudent.includes(normalizedCorrect)) {
          return true;
        }
        
        // Single character at start/end
        if (normalizedCorrect.length === 1) {
          return normalizedStudent.startsWith(normalizedCorrect) || 
                 normalizedStudent.endsWith(normalizedCorrect);
        }
        
        return false;
      });
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Q#
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct Answer(s)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((q, index) => {
              // Try both string and number keys for question_id matching
              const questionIdNum = q.question_id || q.id || (index + 1);
              const questionIdStr = String(questionIdNum);
              const questionIdNumKey = Number(questionIdNum);
              
              // Try multiple key formats: string, number, and numeric string
              const studentAnswer = studentAnswers[questionIdStr] !== undefined 
                ? studentAnswers[questionIdStr]
                : studentAnswers[questionIdNumKey] !== undefined
                ? studentAnswers[questionIdNumKey]
                : studentAnswers[questionIdNum] !== undefined
                ? studentAnswers[questionIdNum]
                : undefined;
              
              const correctAnswers = Array.isArray(q.correct_answers) ? q.correct_answers : 
                                   (q.correct_answer ? [q.correct_answer] : []);
              const isCorrect = isAnswerCorrect(studentAnswer, correctAnswers);
              
              // Debug logging
              if (index === 0) {
                console.log('📝 [TestAnswerModal] First question debug:', {
                  questionIdNum,
                  questionIdStr,
                  questionIdNumKey,
                  studentAnswer,
                  studentAnswers,
                  studentAnswersKeys: Object.keys(studentAnswers),
                  correctAnswers,
                  question: q
                });
              }
              
              return (
                <tr key={questionIdStr} className={isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {q.question}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {studentAnswer ? (
                      <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {studentAnswer}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No answer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {correctAnswers.length > 0 ? (
                      <div className="space-y-1">
                        {correctAnswers.map((ans, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {ans}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No correct answer defined</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {isCorrect ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        ✗ Wrong
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Word Matching answers
  const renderWordMatching = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Q#
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Left Word
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Match
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct Match
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map((q, index) => {
              // Try both string and number keys for question_id matching
              const questionIdNum = q.question_id || q.id || (index + 1);
              const questionIdStr = String(questionIdNum);
              const questionIdNumKey = Number(questionIdNum);
              
              // Try multiple key formats: string, number, and numeric string
              const studentAnswer = studentAnswers[questionIdStr] !== undefined 
                ? studentAnswers[questionIdStr]
                : studentAnswers[questionIdNumKey] !== undefined
                ? studentAnswers[questionIdNumKey]
                : studentAnswers[questionIdNum] !== undefined
                ? studentAnswers[questionIdNum]
                : undefined;
              
              const correctLeft = q.left_word;
              const correctRight = q.right_word;
              
              let studentMatch = null;
              let isCorrect = false;
              
              if (studentAnswer) {
                if (typeof studentAnswer === 'object') {
                  studentMatch = studentAnswer.definition || studentAnswer.right || studentAnswer.word;
                  isCorrect = studentAnswer.word === correctLeft && 
                            (studentAnswer.definition || studentAnswer.right) === correctRight;
                } else if (typeof studentAnswer === 'string') {
                  try {
                    const parsed = JSON.parse(studentAnswer);
                    studentMatch = parsed.definition || parsed.right || parsed.word;
                    isCorrect = parsed.word === correctLeft && 
                              (parsed.definition || parsed.right) === correctRight;
                  } catch {
                    studentMatch = studentAnswer;
                  }
                }
              }
              
              return (
                <tr key={questionIdStr} className={isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {correctLeft}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {studentMatch ? (
                      <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {studentMatch}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No answer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {correctRight}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {isCorrect ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        ✗ Wrong
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Fill Blanks answers
  const renderFillBlanks = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    return (
      <div className="space-y-6">
        {questions.map((q, index) => {
          // Try both string and number keys for question_id matching
          const questionIdNum = q.question_id || q.id || (index + 1);
          const questionIdStr = String(questionIdNum);
          const questionIdNumKey = Number(questionIdNum);
          
          // Debug logging for first question
          if (index === 0) {
            console.log('📝 [TestAnswerModal] Fill Blanks First Question Debug:', {
              questionIdNum,
              questionIdStr,
              questionIdNumKey,
              question: q,
              studentAnswers,
              studentAnswersKeys: Object.keys(studentAnswers),
              correctAnswers: q.correct_answers
            });
          }
          
          // For fill blanks, answers can be stored as:
          // 1. By question_id: { "1": ["answer1", "answer2"] } - inline mode (multiple blanks per question)
          // 2. By blank ID (which might be same as question_id in separate mode): { "1": "answer1", "2": "answer2" }
          
          // Try multiple key formats: string, number, and numeric string
          const rawAnswer = studentAnswers[questionIdStr] !== undefined 
            ? studentAnswers[questionIdStr]
            : studentAnswers[questionIdNumKey] !== undefined
            ? studentAnswers[questionIdNumKey]
            : studentAnswers[questionIdNum] !== undefined
            ? studentAnswers[questionIdNum]
            : undefined;
          
          const correctAnswers = Array.isArray(q.correct_answers) ? q.correct_answers : [];
          
          // Handle student answers: could be array or single value, or we need to check all possible blank IDs
          let studentAnswersForQ = [];
          if (Array.isArray(rawAnswer)) {
            // Already an array - use directly
            studentAnswersForQ = rawAnswer;
          } else if (rawAnswer !== undefined && rawAnswer !== null) {
            // Single value - wrap in array
            studentAnswersForQ = [rawAnswer];
          } else {
            // No answer found for this question_id - might be stored by blank ID
            // Try finding answers by checking all possible blank IDs for this question
            // In separate mode, blank IDs might be sequential: 1, 2, 3...
            // We'll try to match by checking if blank IDs match question_id + offset
            // But for now, let's try a different approach: check if answers are keyed by sequential IDs
            // If there are multiple blanks in this question, they might be stored as separate entries
            
            // Alternative: Answers might be stored with blank IDs that match the question's position
            // For now, let's just map based on array index if we can't find by question_id
            studentAnswersForQ = [];
          }
          
          return (
            <div key={questionIdStr} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Question {index + 1}
              </h4>
              <div className="space-y-3">
                {/* Render question text with blanks if available */}
                {q.question_json && (
                  <div className="text-sm text-gray-700 mb-4">
                    {typeof q.question_json === 'string' 
                      ? q.question_json 
                      : (q.question_json.text || q.question_json.question || 'Question text not available')}
                  </div>
                )}
                
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Blank #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Student Answer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Correct Answer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {correctAnswers.map((correctAns, blankIndex) => {
                      // Try to find student answer for this blank
                      // First try array index if we have an array
                      let studentAns = studentAnswersForQ[blankIndex];
                      
                      // If not found and we're in separate mode, answers might be keyed by sequential IDs
                      // For separate mode: question 1 = blank 1, question 2 = blank 2, etc.
                      // So blank ID = question_id in separate mode
                      // But in inline mode: question 1 has blanks 1, 2, 3 stored as array
                      
                      // Alternative approach: Check if answer exists for this specific blank
                      // The blank ID might be: question_id * 100 + blankIndex, or just sequential
                      // Let's try finding by checking if there's a direct match for blank index + 1
                      const potentialBlankId = blankIndex + 1;
                      const potentialBlankIdStr = String(potentialBlankId);
                      const potentialBlankIdNum = Number(potentialBlankId);
                      
                      // If we don't have an answer yet, try direct blank ID lookup
                      if (studentAns === undefined || studentAns === null || studentAns === '') {
                        studentAns = studentAnswers[potentialBlankIdStr] !== undefined
                          ? studentAnswers[potentialBlankIdStr]
                          : studentAnswers[potentialBlankIdNum] !== undefined
                          ? studentAnswers[potentialBlankIdNum]
                          : studentAns;
                      }
                      
                      // Debug for first blank of first question
                      if (index === 0 && blankIndex === 0) {
                        console.log('📝 [TestAnswerModal] Fill Blanks First Blank Debug:', {
                          blankIndex,
                          potentialBlankId,
                          potentialBlankIdStr,
                          potentialBlankIdNum,
                          studentAns,
                          studentAnswersForQ,
                          correctAns,
                          studentAnswersKeys: Object.keys(studentAnswers)
                        });
                      }
                      
                      const isCorrect = String(studentAns || '').trim().toLowerCase() === 
                                       String(correctAns || '').trim().toLowerCase();
                      
                      return (
                        <tr key={blankIndex} className={isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {blankIndex + 1}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {studentAns ? (
                              <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                {String(studentAns)}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">No answer</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {String(correctAns)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {isCorrect ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ✓
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                ✗
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Matching Type answers (simplified - visual comparison would need image)
  const renderMatchingType = () => {
    if (!questions || questions.length === 0) {
      return <p className="text-gray-500">No questions available</p>;
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Matching type tests require visual comparison. Answers stored as connection pairs.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Word
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student Connection
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((q, index) => {
                // Try both string and number keys for question_id matching
                const questionIdNum = q.question_id || q.id || (index + 1);
                const questionIdStr = String(questionIdNum);
                const questionIdNumKey = Number(questionIdNum);
                
                // Try multiple key formats: string, number, and numeric string
                const studentAnswer = studentAnswers[questionIdStr] !== undefined 
                  ? studentAnswers[questionIdStr]
                  : studentAnswers[questionIdNumKey] !== undefined
                  ? studentAnswers[questionIdNumKey]
                  : studentAnswers[questionIdNum] !== undefined
                  ? studentAnswers[questionIdNum]
                  : undefined;
                
                return (
                  <tr key={questionIdStr}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {q.word}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {studentAnswer ? (
                        typeof studentAnswer === 'object' 
                          ? JSON.stringify(studentAnswer)
                          : studentAnswer
                      ) : (
                        <span className="text-gray-400 italic">No answer</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Main render based on test type
  const renderAnswersByType = () => {
    if (!testResult) return null;

    const testType = testResult.test_type || testResult.testType;

    if (isLoadingQuestions) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-gray-600">Loading questions...</span>
        </div>
      );
    }

    if (!questions || questions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load questions for this test.</p>
          <p className="text-sm text-gray-400 mt-2">
            Test ID: {testResult.test_id}, Type: {testType}
          </p>
        </div>
      );
    }

    switch (testType) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'true_false':
        return renderTrueFalse();
      case 'input':
        return renderInput();
      case 'word_matching':
        return renderWordMatching();
      case 'fill_blanks':
        return renderFillBlanks();
      case 'matching_type':
        return renderMatchingType();
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Test type "{testType}" is not supported for answer viewing.</p>
            <p className="text-sm text-gray-400 mt-2">
              Drawing and Speaking tests have their own dedicated modals.
            </p>
          </div>
        );
    }
  };

  if (!testResult) return null;

  const testType = testResult.test_type || testResult.testType;
  const studentName = `${testResult.name || ''} ${testResult.surname || ''}`.trim();
  const title = `${testResult.test_name || 'Test'} - ${studentName || testResult.student_id}`;

  return (
    <PerfectModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
    >
      {/* Test Metadata */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex space-x-6">
          <div>
            <span className="text-xs text-gray-500">Score</span>
            <div className="text-lg font-semibold text-gray-900">
              {testResult.best_retest_score !== null && testResult.best_retest_score !== undefined
                ? `${testResult.best_retest_score} / ${testResult.best_retest_max_score || testResult.max_score || 0}`
                : `${testResult.score || 0} / ${testResult.max_score || 0}`}
              {testResult.best_retest_score !== null && testResult.best_retest_score !== undefined && (
                <span className="ml-2 text-xs text-blue-600">(Retest Best)</span>
              )}
            </div>
          </div>
          {(testResult.best_retest_percentage !== null && testResult.best_retest_percentage !== undefined && testResult.best_retest_percentage > 0) ||
           (testResult.percentage && testResult.percentage > 0) ? (
            <div>
              <span className="text-xs text-gray-500">Percentage</span>
              <div className="text-lg font-semibold text-gray-900">
                {testResult.best_retest_percentage !== null && testResult.best_retest_percentage !== undefined
                  ? `${testResult.best_retest_percentage.toFixed(1)}%`
                  : `${testResult.percentage?.toFixed(1) || '0.0'}%`}
              </div>
            </div>
          ) : null}
          {testResult.subject && testResult.subject !== 'N/A' ? (
            <div>
              <span className="text-xs text-gray-500">Subject</span>
              <div className="text-sm font-medium text-gray-700">
                {testResult.subject}
              </div>
            </div>
          ) : null}
        </div>
        {testResult.submitted_at && (
          <div className="text-right">
            <span className="text-xs text-gray-500">Submitted</span>
            <div className="text-sm text-gray-700">
              {new Date(testResult.submitted_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Answers Content */}
      <div className="max-h-[70vh] overflow-y-auto">
        {renderAnswersByType()}
      </div>

      {/* Warning if caught cheating */}
      {testResult.caught_cheating && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ This test was flagged for suspicious activity (visibility changes: {testResult.visibility_change_times || 0})
          </p>
        </div>
      )}
    </PerfectModal>
  );
};

export default TestAnswerModal;

