import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';

const QRCodeDisplay = ({ sessionCode, gameName, onClose, hideCloseButton = false }) => {
  const canvasRef = useRef(null);
  const gameUrl = `${window.location.origin}/student/duel/${sessionCode}`;

  useEffect(() => {
    if (canvasRef.current && sessionCode) {
      QRCode.toCanvas(canvasRef.current, gameUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        }
      });
    }
  }, [sessionCode, gameUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(gameUrl);
    // You can add a notification here if needed
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Join Game: {gameName || 'Duel Game'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Scan QR code or share link with students
          </p>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
          
          <div className="w-full">
            <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
              Session Code:
            </p>
            <div className="bg-gray-100 rounded-lg p-3 mb-3">
              <p className="text-2xl font-mono font-bold text-center text-gray-800 tracking-widest">
                {sessionCode}
              </p>
            </div>
          </div>

          <div className="w-full">
            <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
              Game Link:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 text-center">
            <strong>Important:</strong> Students must be logged in to join the game.
            They will need to log in first if they haven't already.
          </p>
        </div>

            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            )}
      </motion.div>
    </motion.div>
  );
};

export default QRCodeDisplay;

