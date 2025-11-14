import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderMathInText } from '../../../utils/mathRenderer';

const CardPhase = ({ questions, onAnswer, cardAnswers, damage }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [hasMovedToNext, setHasMovedToNext] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = answeredQuestions.has(currentQuestion?.question_id);

  // Reset hasMovedToNext when question changes
  useEffect(() => {
    setHasMovedToNext(false);
  }, [currentQuestionIndex]);

  useEffect(() => {
    // When we receive a card-result, move to next question after showing feedback
    if (cardAnswers.length > 0 && !hasMovedToNext) {
      const lastAnswer = cardAnswers[cardAnswers.length - 1];
      const isCurrentQuestionAnswered = lastAnswer.questionId === currentQuestion?.question_id;
      
      // If current question was just answered, move to next after delay
      if (isCurrentQuestionAnswered && currentQuestionIndex < questions.length - 1) {
        setHasMovedToNext(true);
        setTimeout(() => {
          setCurrentQuestionIndex(prev => {
            if (prev < questions.length - 1) {
              return prev + 1;
            }
            return prev;
          });
          setSelectedAnswer(null);
        }, 2000); // 2 second delay to show feedback
      }
    }
  }, [cardAnswers, currentQuestionIndex, currentQuestion?.question_id, questions.length, hasMovedToNext]);

  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.question_id]));
    
    // Send answer
    onAnswer(currentQuestion.question_id, answer);
  };

  const getAnswerClass = (option) => {
    if (!isAnswered) {
      return selectedAnswer === option
        ? 'bg-yellow-500 hover:bg-yellow-600'
        : 'bg-blue-600 hover:bg-blue-700';
    }
    
    const isCorrect = currentQuestion.correct_answer === option;
    const isSelected = selectedAnswer === option;
    
    if (isCorrect) return 'bg-green-500';
    if (isSelected && !isCorrect) return 'bg-red-500';
    return 'bg-gray-600';
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <motion.div
        key={currentQuestion.question_id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex-1 flex flex-col w-full max-w-6xl mx-auto"
      >
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-white mb-2">
            <span>Question {currentQuestionIndex + 1} of 3</span>
            <span>Damage: {damage}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / 3) * 100}%` }}
              className="bg-yellow-400 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Top Half - Question */}
        <div className="flex-1 flex flex-col justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl p-8 shadow-2xl mb-4">
          {currentQuestion.question_image_url ? (
            <div className="mb-4 flex justify-center">
              <img
                src={currentQuestion.question_image_url}
                alt="Question"
                className="max-h-64 rounded-lg"
              />
            </div>
          ) : null}
          <h2 className="text-3xl font-bold text-white text-center">
            {renderMathInText(currentQuestion.question_text || '')}
          </h2>
          
          {/* Feedback */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              {selectedAnswer === currentQuestion.correct_answer ? (
                <div className="text-green-400 text-2xl font-bold">
                  ✓ Correct! +5 damage
                </div>
              ) : (
                <div className="text-red-400 text-2xl font-bold">
                  ✗ Wrong! The correct answer is {currentQuestion.correct_answer}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Half - Answer Options Grid (2x2) */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D'].map((option) => {
            const optionText = currentQuestion[`option_${option.toLowerCase()}`];
            if (!optionText) return null;

            return (
              <motion.button
                key={option}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered}
                className={`
                  p-6 rounded-xl text-white font-semibold
                  transition-all duration-200
                  flex flex-col items-center justify-center
                  ${getAnswerClass(option)}
                  ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-3xl font-bold mb-2">{option}</span>
                <span className="text-lg text-center">{renderMathInText(optionText)}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default CardPhase;

