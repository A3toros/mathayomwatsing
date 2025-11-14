import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultsPhase = ({ results, onExit }) => {
  const [showTop3, setShowTop3] = useState(true);
  const [top3Revealed, setTop3Revealed] = useState(false);

  useEffect(() => {
    // Show top 3 reveal animation
    const timer = setTimeout(() => {
      setTop3Revealed(true);
    }, 500);

    const timer2 = setTimeout(() => {
      setShowTop3(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading results...</div>
      </div>
    );
  }

  // Handle tournament completion
  if (results.tournamentComplete && results.winner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full text-center"
        >
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold text-yellow-400 mb-8"
          >
            🏆 Tournament Winner! 🏆
          </motion.h1>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-6xl">👑</span>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4"
          >
            {results.winner.nickname}
          </motion.h2>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg p-6 mb-6"
          >
            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <div className="text-2xl font-bold text-green-400">{results.winner.hp}</div>
                <div className="text-sm text-gray-400">Final HP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{results.winner.correctAnswers}</div>
                <div className="text-sm text-gray-400">Correct Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{results.winner.damageDealt}</div>
                <div className="text-sm text-gray-400">Damage Dealt</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{results.winner.damageReceived}</div>
                <div className="text-sm text-gray-400">Damage Received</div>
              </div>
            </div>
          </motion.div>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg"
          >
            Exit Game
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const sortedResults = [
    results.player1,
    results.player2
  ].filter(r => r).sort((a, b) => (a.place || 999) - (b.place || 999));

  const top3 = sortedResults.slice(0, 3);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <AnimatePresence>
        {showTop3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-6xl font-bold text-yellow-400 mb-8"
            >
              Top 3 Reveal!
            </motion.h1>

            <div className="flex justify-center gap-8">
              {top3.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: top3Revealed ? 1 : 0 }}
                  transition={{ delay: index * 0.3 }}
                  className="text-center"
                >
                  <div className={`
                    w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold
                    ${index === 0 ? 'bg-yellow-400 text-gray-900' : ''}
                    ${index === 1 ? 'bg-gray-300 text-gray-900' : ''}
                    ${index === 2 ? 'bg-orange-400 text-gray-900' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div className="mt-4 text-white text-xl font-bold">
                    {player.nickname}
                  </div>
                  <div className="text-gray-300">
                    {player.hp} HP
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!showTop3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Final Leaderboard</h2>

              <div className="space-y-4">
                {sortedResults.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      bg-gray-700 rounded-lg p-4 flex items-center justify-between
                      ${index === 0 ? 'ring-2 ring-yellow-400' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
                        ${index === 0 ? 'bg-yellow-400 text-gray-900' : ''}
                        ${index === 1 ? 'bg-gray-300 text-gray-900' : ''}
                        ${index === 2 ? 'bg-orange-400 text-gray-900' : ''}
                        ${index > 2 ? 'bg-gray-600 text-white' : ''}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{player.nickname}</div>
                        <div className="text-gray-400 text-sm">
                          Correct Cards: {player.correctAnswers} | 
                          Damage Dealt: {player.damageDealt} | 
                          Damage Received: {player.damageReceived}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold text-xl">{player.hp} HP</div>
                      <div className="text-gray-400 text-sm">Place: {player.place}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onExit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg"
                >
                  Exit Game
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsPhase;

