import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, getKpopCardBg, CYBERPUNK_COLORS, KPOP_COLORS } from '@/utils/themeUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useNotification } from '../ui/Notification';

const SessionCodeEntry = ({ onJoin }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { theme, isCyberpunk, isKpop, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const handleJoin = async () => {
    if (!sessionCode || sessionCode.length < 4) {
      showNotification('Please enter a valid session code', 'error');
      return;
    }

    setIsJoining(true);
    
    // Navigate to game page
    navigate(`/student/duel/${sessionCode.toUpperCase()}`);
    
    if (onJoin) {
      onJoin(sessionCode.toUpperCase());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const cardBg = isCyberpunk 
    ? getCyberpunkCardBg(0) 
    : isKpop 
    ? getKpopCardBg(0) 
    : null;

  // Get background color from style if available, otherwise use className
  const backgroundColor = cardBg?.style?.backgroundColor || (isCyberpunk ? '#000000' : isKpop ? '#1a0014' : '#ffffff');
  const borderColor = cardBg?.style?.borderColor || (isCyberpunk ? CYBERPUNK_COLORS.cyan : isKpop ? KPOP_COLORS.primary : '#e5e7eb');

  return (
    <Card 
      className={`max-w-md w-full p-6 ${
        isCyberpunk 
          ? `${cardBg.className} !bg-black` 
          : isKpop 
          ? `${cardBg.className} !bg-gray-900` 
          : ''
      }`}
      style={isCyberpunk ? {
        backgroundColor: '#000000',
        borderColor,
        ...cardBg?.style,
        ...themeStyles.glow
      } : isKpop ? {
        backgroundColor: '#1a0014',
        borderColor,
        ...cardBg?.style,
        ...themeStyles.glow
      } : {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 
          className={`text-2xl font-bold mb-4 text-center ${
            isCyberpunk ? 'text-cyan-400' : isKpop ? 'text-pink-400' : 'text-gray-900'
          }`}
          style={isCyberpunk ? {
            fontFamily: 'monospace',
            ...themeStyles.textShadow
          } : {}}
        >
          {isCyberpunk ? 'JOIN DUEL GAME' : 'Join Duel Game'}
        </h2>
        <p 
          className={`mb-6 text-center ${
            isCyberpunk ? 'text-cyan-300' : isKpop ? 'text-pink-300' : 'text-gray-600'
          }`}
        >
          Enter the session code provided by your teacher
        </p>

        <div className="mb-6">
          <label 
            className={`block text-sm font-medium mb-2 ${
              isCyberpunk ? 'text-cyan-400' : isKpop ? 'text-pink-400' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              fontFamily: 'monospace',
              ...themeStyles.textShadow
            } : {}}
          >
            Session Code
          </label>
          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter code (e.g., ABC123)"
            maxLength={10}
            className={`w-full px-4 py-3 rounded-lg text-center text-2xl font-bold tracking-widest uppercase transition-all ${
              isCyberpunk
                ? 'bg-gray-800/50 border-2 border-cyan-400/50 text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder-cyan-400/30'
                : isKpop
                ? 'bg-gray-800/50 border-2 border-pink-400/50 text-pink-400 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 placeholder-pink-400/30'
                : 'border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
            style={isCyberpunk ? {
              fontFamily: 'monospace',
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.3)',
              ...(sessionCode ? { boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)' } : {})
            } : isKpop ? {
              boxShadow: '0 0 10px rgba(244, 114, 182, 0.3)',
              ...(sessionCode ? { boxShadow: '0 0 15px rgba(244, 114, 182, 0.5)' } : {})
            } : {}}
            disabled={isJoining}
          />
        </div>

        <Button
          onClick={handleJoin}
          disabled={isJoining || !sessionCode}
          className={`w-full ${
            isCyberpunk
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-400'
              : isKpop
              ? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-400'
              : ''
          }`}
          style={isCyberpunk ? {
            fontFamily: 'monospace',
            ...themeStyles.textShadow,
            boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)'
          } : isKpop ? {
            boxShadow: '0 0 15px rgba(244, 114, 182, 0.5)'
          } : {}}
        >
          {isJoining 
            ? (isCyberpunk ? 'JOINING...' : 'Joining...') 
            : (isCyberpunk ? 'JOIN GAME' : 'Join Game')
          }
        </Button>
      </motion.div>
    </Card>
  );
};

export default SessionCodeEntry;

