import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';

const LobbyPhase = ({ players, studentNickname, onStartGame, isTeacher = false }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Game Lobby
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300"
          >
            {isTeacher ? 'Waiting for players to join...' : 'Waiting for game to start...'}
          </motion.p>
        </div>

        {/* Players List */}
        <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Players ({players.length})
          </h2>
          <div className="space-y-3">
            {players.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No players in lobby yet...</p>
            ) : (
              players.map((player, index) => (
                <motion.div
                  key={player.studentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    player.studentNickname === studentNickname
                      ? 'bg-yellow-500 bg-opacity-30 border-2 border-yellow-400'
                      : 'bg-gray-700 bg-opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {player.studentNickname || player.studentName}
                        {player.studentNickname === studentNickname && (
                          <span className="ml-2 text-yellow-400 text-sm">(You)</span>
                        )}
                      </p>
                      {player.selectedCharacter && (
                        <p className="text-gray-400 text-sm capitalize">
                          Character: {player.selectedCharacter}
                        </p>
                      )}
                    </div>
                  </div>
                  {player.selectedCharacter && (
                    <div className="text-green-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Teacher Start Button */}
        {isTeacher && players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button
              onClick={onStartGame}
              className="px-8 py-4 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
              Start Game ({players.length} {players.length === 1 ? 'player' : 'players'})
            </Button>
          </motion.div>
        )}

        {/* Student Waiting Message */}
        {!isTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
              />
            </div>
            <p className="text-gray-400">
              The teacher will start the game when ready...
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LobbyPhase;

