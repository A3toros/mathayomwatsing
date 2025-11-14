import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, getKpopCardBg, CYBERPUNK_COLORS, KPOP_COLORS } from '@/utils/themeUtils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SessionCodeEntry from '@/components/minigame/SessionCodeEntry';

const JoinGamePage = () => {
  const navigate = useNavigate();
  const { theme, isCyberpunk, isLight, isKpop, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <div
      className="min-h-screen p-4"
      style={isCyberpunk ? {
        ...themeStyles.background,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 255, 210, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 210, 0.05) 0%, transparent 50%)'
      } : isKpop ? {
        ...themeStyles.background
      } : {
        backgroundColor: '#ffffff'
      }}
    >
      <div className="max-w-4xl mx-auto pt-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Button
            onClick={() => navigate('/student')}
            variant="secondary"
            className={`mb-4 ${
              isCyberpunk 
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-400/50' 
                : isKpop
                ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border-pink-400/50'
                : ''
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace',
              ...themeStyles.textShadow
            } : isKpop ? {
              color: KPOP_COLORS.primary
            } : {}}
          >
            ← {isCyberpunk ? 'BACK TO CABINET' : 'Back to Cabinet'}
          </Button>
        </motion.div>

        {/* Join Game Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className={`${isCyberpunk ? `${getCyberpunkCardBg(0).className} !bg-black` : isKpop ? `${getKpopCardBg(0).className} !bg-gray-900` : ''} max-w-2xl mx-auto`}
            style={isCyberpunk ? {
              backgroundColor: '#000000',
              borderColor: CYBERPUNK_COLORS.cyan,
              ...getCyberpunkCardBg(0).style,
              ...themeStyles.glow
            } : isKpop ? {
              backgroundColor: '#1a0014',
              borderColor: KPOP_COLORS.primary,
              ...getKpopCardBg(0).style
            } : {}}
          >
            <Card.Header>
              <Card.Title 
                className="text-center"
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace',
                  ...themeStyles.textShadow
                } : isKpop ? {
                  color: KPOP_COLORS.primary
                } : {}}
              >
                {isCyberpunk ? 'JOIN DUEL GAME' : 'Join Duel Game'}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="flex justify-center">
                <SessionCodeEntry />
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinGamePage;

