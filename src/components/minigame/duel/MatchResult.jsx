import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';

const MatchResult = ({ result, onReEnterQueue, onViewResults }) => {
  const isWinner = result?.place === 1;
  const isEliminated = result?.hp === 0;

  if (isEliminated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-900 via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            💀
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">You've Been Eliminated</h2>
          <p className="text-gray-300 mb-6">
            You've been eliminated from the tournament. Wait for the tournament to complete to see final results.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="text-white text-sm space-y-2">
              <div>Final HP: <span className="text-red-400 font-bold">0</span></div>
              <div>Correct Cards: <span className="text-blue-400 font-bold">{result?.correctAnswers || 0}</span></div>
              <div>Damage Dealt: <span className="text-green-400 font-bold">{result?.damageDealt || 0}</span></div>
              <div>Damage Received: <span className="text-orange-400 font-bold">{result?.damageReceived || 0}</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isWinner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-900 via-blue-900 to-indigo-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">Match Won!</h2>
          <p className="text-gray-300 mb-6">
            Congratulations! You won this match. You can continue in the tournament.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="text-white text-sm space-y-2">
              <div>Remaining HP: <span className="text-green-400 font-bold">{result?.hp || 0}</span></div>
              <div>Correct Cards: <span className="text-blue-400 font-bold">{result?.correctAnswers || 0}</span></div>
              <div>Damage Dealt: <span className="text-green-400 font-bold">{result?.damageDealt || 0}</span></div>
              <div>Damage Received: <span className="text-orange-400 font-bold">{result?.damageReceived || 0}</span></div>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={onReEnterQueue}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue in Tournament
            </Button>
            <Button
              onClick={onViewResults}
              variant="outline"
              className="w-full"
            >
              View Results
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default MatchResult;

