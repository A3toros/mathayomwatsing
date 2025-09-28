import { useState, useEffect, useCallback } from 'react';

export const useDataParsing = (drawing) => {
  const [questionsData, setQuestionsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Parse drawing data from drawing object
  const parseDrawingData = useCallback((drawing) => {
    if (!drawing?.answers) return [];
    
    try {
      // Handle string answers
      if (typeof drawing.answers === 'string') {
        return JSON.parse(drawing.answers);
      }
      
      // Handle array answers
      if (Array.isArray(drawing.answers)) {
        return drawing.answers;
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing drawing data:', error);
      return [];
    }
  }, []);

  // Process questions from answers
  const processQuestions = useCallback((answers) => {
    if (!Array.isArray(answers)) return [];
    
    return answers.map((answer, index) => {
      let drawingData = [];
      
      if (typeof answer === 'string') {
        try {
          // Parse the JSON string
          const parsed = JSON.parse(answer);
          drawingData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
          console.error('Error parsing answer JSON:', error);
          drawingData = [];
        }
      } else if (Array.isArray(answer)) {
        drawingData = answer;
      } else {
        drawingData = [answer];
      }
      
      console.log(`useDataParsing - processed answer ${index}:`, drawingData);
      
      return {
        questionNumber: index + 1,
        drawingData: drawingData
      };
    });
  }, []);

  // Parse drawing data when drawing changes
  useEffect(() => {
    if (drawing) {
      console.log('useDataParsing - drawing object:', drawing);
      console.log('useDataParsing - drawing.answers:', drawing.answers);
      const answers = parseDrawingData(drawing);
      console.log('useDataParsing - parsed answers:', answers);
      const questions = processQuestions(answers);
      console.log('useDataParsing - processed questions:', questions);
      setQuestionsData(questions);
      setCurrentQuestionIndex(0);
    }
  }, [drawing, parseDrawingData, processQuestions]);

  return {
    questionsData,
    setQuestionsData,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    parseDrawingData,
    processQuestions,
  };
};
