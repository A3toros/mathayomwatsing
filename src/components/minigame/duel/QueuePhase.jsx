import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const QueuePhase = ({ onEnterQueue, correctAnswers, finalDamage }) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Auto-enter queue after showing stats
    const timer = setTimeout(() => {
      setEntered(true);
      onEnterQueue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onEnterQueue]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl p-8 shadow-2xl mb-6">
          <h2 className="text-3xl font-bold text-white mb-6">Cards Complete!</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-4xl font-bold text-yellow-400 mb-2">{correctAnswers}</div>
              <div className="text-gray-300">Correct Answers</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-4xl font-bold text-red-400 mb-2">{finalDamage}</div>
              <div className="text-gray-300">Total Damage</div>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-800 to-cyan-900 rounded-2xl p-8 shadow-2xl"
        >
          {entered ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h3>
              <p className="text-gray-300">Please wait while we match you with another player</p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-white mb-2">Entering Queue</h3>
              <p className="text-gray-300">Preparing to find your opponent...</p>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QueuePhase;

