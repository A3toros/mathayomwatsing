import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from '../components/ui/Notification';
import MiniGameCreator from '../components/minigame/MiniGameCreator';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const MiniGameCreatorPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleGameSaved = () => {
    // Show success notification
    showNotification('Game created successfully!', 'success');
    // Navigate back to teacher cabinet with minigames view
    navigate('/teacher', { state: { view: 'minigames' } });
  };

  const handleCancel = () => {
    // Navigate back to teacher cabinet with minigames view
    navigate('/teacher', { state: { view: 'minigames' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Mini Game</h1>
              <p className="text-gray-600 mt-1">Create a new educational mini game for your students</p>
            </div>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <MiniGameCreator
              onGameSaved={handleGameSaved}
              onCancel={handleCancel}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MiniGameCreatorPage;

