import { useState, useEffect, useCallback } from 'react';

export const useDataParsing = (drawing) => {
  const [questionsData, setQuestionsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Parse drawing data from drawing object
  const parseDrawingData = useCallback((drawing) => {
    console.log('parseDrawingData - input drawing:', drawing);
    console.log('parseDrawingData - drawing.answers:', drawing?.answers);
    
    if (!drawing?.answers) {
      console.log('parseDrawingData - no answers found, returning empty array');
      return [];
    }
    
    try {
      // Handle string answers
      if (typeof drawing.answers === 'string') {
        console.log('parseDrawingData - parsing string answers');
        const parsed = JSON.parse(drawing.answers);
        console.log('parseDrawingData - parsed string result:', parsed);
        return parsed;
      }
      
      // Handle array answers
      if (Array.isArray(drawing.answers)) {
        console.log('parseDrawingData - answers is already array');
        return drawing.answers;
      }
      
      console.log('parseDrawingData - answers is neither string nor array, returning empty array');
      return [];
    } catch (error) {
      console.error('Error parsing drawing data:', error);
      return [];
    }
  }, []);

  // Process questions from answers
  const processQuestions = useCallback((answers) => {
    console.log('processQuestions - input answers:', answers);
    console.log('processQuestions - answers type:', typeof answers);
    console.log('processQuestions - answers isArray:', Array.isArray(answers));
    
    if (!Array.isArray(answers)) {
      console.log('processQuestions - answers is not array, returning empty array');
      return [];
    }
    
    console.log('processQuestions - processing', answers.length, 'answers');
    
    return answers.map((answer, index) => {
      console.log(`processQuestions - processing answer ${index}:`, answer);
      console.log(`processQuestions - answer ${index} type:`, typeof answer);
      console.log(`processQuestions - answer ${index} isArray:`, Array.isArray(answer));
      
      let drawingData = [];
      
      if (typeof answer === 'string') {
        try {
          console.log(`processQuestions - parsing string answer ${index}`);
          // Parse the JSON string
          const parsed = JSON.parse(answer);
          console.log(`processQuestions - parsed answer ${index}:`, parsed);
          drawingData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
          console.error('Error parsing answer JSON:', error);
          drawingData = [];
        }
      } else if (Array.isArray(answer)) {
        console.log(`processQuestions - answer ${index} is already array`);
        // This is a line segment (array of points) - keep it as is
        drawingData = [answer]; // Wrap in array to make it a line segment
      } else {
        console.log(`processQuestions - answer ${index} is object, wrapping in array`);
        drawingData = [answer];
      }
      
      console.log(`processQuestions - final drawingData for answer ${index}:`, drawingData);
      console.log(`processQuestions - drawingData length:`, drawingData?.length);
      
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
      console.log('useDataParsing - drawing.answers type:', typeof drawing.answers);
      console.log('useDataParsing - drawing.answers length:', drawing.answers?.length);
      const answers = parseDrawingData(drawing);
      console.log('useDataParsing - parsed answers:', answers);
      console.log('useDataParsing - parsed answers type:', typeof answers);
      console.log('useDataParsing - parsed answers length:', answers?.length);
      const questions = processQuestions(answers);
      console.log('useDataParsing - processed questions:', questions);
      console.log('useDataParsing - processed questions length:', questions?.length);
      if (questions.length > 0) {
        console.log('useDataParsing - first question drawingData:', questions[0]?.drawingData);
        console.log('useDataParsing - first question drawingData length:', questions[0]?.drawingData?.length);
      }
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
