import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DuelGame from '../components/minigame/DuelGame';
import { useNotification } from '../components/ui/Notification';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { authService } from '../services/authService';

const DuelGamePage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  // Don't use AuthContext - game doesn't need authentication tokens
  const [gameId, setGameId] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true); // Show by default
  const [loginFormData, setLoginFormData] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [studentData, setStudentData] = useState(null); // Local student data for game

  useEffect(() => {
    // Check if we already have student data stored
    const stored = sessionStorage.getItem(`game_student_${sessionCode}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setStudentData(data);
        setShowLoginPrompt(false);
      } catch (e) {
        // Invalid stored data, show login prompt
      }
    }
  }, [sessionCode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const username = loginFormData.username;

      // Only allow student login (numeric student ID)
      if (!/^\d+$/.test(username)) {
        setLoginError('Please use your student ID to log in');
        setIsLoggingIn(false);
        return;
      }

      // Call student login just to verify credentials and get student data
      // We don't need tokens for the game
      const loginResult = await authService.studentLogin({ 
        username, 
        password: loginFormData.password 
      });

      if (loginResult.success && loginResult.data) {
        // Store only student data needed for the game (no tokens)
        const studentData = {
          student_id: loginResult.data.student_id || username,
          name: loginResult.data.name || loginResult.data.first_name || '',
          surname: loginResult.data.surname || loginResult.data.last_name || '',
          nickname: loginResult.data.nickname || '',
          grade: loginResult.data.grade || null,
          class: loginResult.data.class || null,
          number: loginResult.data.number || null,
          role: 'student'
        };

        // Store in local state and sessionStorage (not in AuthContext - this is just for the game)
        setStudentData(studentData);
        sessionStorage.setItem(`game_student_${sessionCode}`, JSON.stringify(studentData));

        // Close login prompt
        setShowLoginPrompt(false);
        showNotification('Login successful!', 'success');
      } else {
        setLoginError(loginResult.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full p-6">
          <h2 className="text-2xl font-bold mb-4">Invalid Session</h2>
          <p className="text-gray-600 mb-4">No session code provided.</p>
          <Button onClick={() => navigate('/student')}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Login Prompt Overlay - shown when student data is not available */}
      <AnimatePresence>
        {showLoginPrompt && !studentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-center">Join Duel Game</h2>
              <p className="text-gray-600 mb-6 text-center text-sm">
                Session Code: <span className="font-mono font-bold text-blue-600">{sessionCode}</span>
              </p>
              <p className="text-gray-700 mb-4 text-center">
                Please log in with your student ID to join the game
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={loginFormData.username}
                    onChange={(e) => setLoginFormData({ ...loginFormData, username: e.target.value })}
                    placeholder="Enter your student ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={loginFormData.password}
                    onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  {isLoggingIn ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Logging in...</span>
                    </>
                  ) : (
                    'Log In & Join Game'
                  )}
                </Button>
              </form>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Don't have an account? Contact your teacher.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Component - always rendered, but needs student data */}
      {!studentData ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Waiting for login...</p>
          </div>
        </div>
      ) : (
        <DuelGame
          sessionCode={sessionCode}
          gameId={gameId}
          studentData={studentData}
          onExit={() => navigate('/student')}
        />
      )}
    </div>
  );
};

export default DuelGamePage;

