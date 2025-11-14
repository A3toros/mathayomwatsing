import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, LoadingSpinner, useNotification } from '../components/ui/components-ui-index';
import Card from '../components/ui/Card';
import PerfectModal from '../components/ui/PerfectModal';
import QRCodeDisplay from '../components/minigame/QRCodeDisplay';
import { useMiniGameWebSocket } from '../hooks/useMiniGameWebSocket';
import QRCode from 'qrcode';

// QR Code Canvas Component
const QRCodeCanvas = ({ sessionCode }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (canvasRef.current && sessionCode) {
      const gameUrl = `${window.location.origin}/student/duel/${sessionCode}`;
      QRCode.toCanvas(canvasRef.current, gameUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('Error generating QR code:', error);
      });
    }
  }, [sessionCode]);

  return (
    <div className="flex justify-center">
      <div className="bg-white p-2 rounded-lg border border-gray-200">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

const MiniGame = ({ onBackToCabinet }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [sessionCode, setSessionCode] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerStats, setPlayerStats] = useState([]); // Leaderboard data
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLeaderboardFullscreen, setIsLeaderboardFullscreen] = useState(false);

  // WebSocket connection for teacher (when session is started)
  const { isConnected: wsConnected, sendMessage: wsSendMessage, onMessage: wsOnMessage } = useMiniGameWebSocket(
    sessionCode,
    user?.teacher_id,
    'teacher'
  );

  // Load games on mount and when navigating back from creator page
  useEffect(() => {
    loadGames();
  }, [location.pathname]);

  // No need to group games - show them directly

  const loadGames = async () => {
    try {
      setIsLoading(true);
      
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }

      const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-mini-games', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setGames(data.games);
      } else {
        showNotification('Failed to load games', 'error');
      }
    } catch (error) {
      console.error('Error loading games:', error);
      showNotification(error.message || 'Failed to load games', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetails = (game) => {
    setSelectedGame(game);
    setShowGameDetails(true);
  };

  const handleCloseDetails = () => {
    setShowGameDetails(false);
    setSelectedGame(null);
  };

  const handleDeleteClick = (game) => {
    setGameToDelete(game);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;
    await handleDeleteGame(gameToDelete);
    setShowDeleteModal(false);
    setGameToDelete(null);
    handleCloseDetails();
  };

  const handleToggleActive = async (game) => {
    try {
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }

      const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/update-mini-game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.id,
          is_active: !game.is_active
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        showNotification(`Game ${!game.is_active ? 'activated' : 'deactivated'}`, 'success');
      } else {
        showNotification('Failed to update game', 'error');
      }
    } catch (error) {
      console.error('Error toggling game:', error);
      showNotification(error.message || 'Failed to update game', 'error');
    }
  };

  const handleDeleteGame = async (game) => {
    try {
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }

      const response = await window.tokenManager.makeAuthenticatedRequest(`/.netlify/functions/delete-mini-game?game_id=${game.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        await loadGames();
        showNotification('Game deleted successfully', 'success');
      } else {
        showNotification('Failed to delete game', 'error');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      showNotification(error.message || 'Failed to delete game', 'error');
    }
  };

  // Removed handleOpenSettings - using handleShowDetails instead

  const handleStartGame = async () => {
    if (!selectedGame) return;

    try {
      setIsCreatingSession(true);
      
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        throw new Error('No valid authentication token found');
      }
      
      // Create session in database
      const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/create-mini-game-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: selectedGame.id
        })
      });

      const data = await response.json();

      if (data.success) {
        const code = data.session.session_code;
        setSessionCode(code);
        setLobbyPlayers([]); // Reset lobby players
        setShowStartModal(true); // Open start modal
        showNotification(`Game session created! Code: ${code}`, 'success');
        
        // WebSocket connection is handled by useMiniGameWebSocket hook
        // It will automatically connect when sessionCode is set
      } else {
        showNotification(data.error || 'Failed to start game', 'error');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      showNotification(error.message || 'Failed to start game', 'error');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleStartServer = () => {
    if (!sessionCode || !wsSendMessage) {
      showNotification('Not connected to server. Please wait...', 'error');
      return;
    }

    if (lobbyPlayers.length === 0) {
      showNotification('No players in lobby yet', 'warning');
      return;
    }

    // Send start-game message to WebSocket server
    wsSendMessage('start-game', { sessionCode });
    setGameStarted(true);
    showNotification('Game started! Students will begin the card phase.', 'success');
  };

  const handleFinishGame = () => {
    setShowFinishModal(true);
  };

  const handleFinishConfirm = async () => {
    if (!sessionCode || !wsSendMessage) {
      showNotification('Not connected to server', 'error');
      return;
    }

    // Send finish-game message to server
    wsSendMessage('finish-game', { sessionCode });
    
    // Close WebSocket connection
    // The hook will handle cleanup, but we can also reset state
    setGameStarted(false);
    setPlayerStats([]);
    setLobbyPlayers([]);
    setSessionCode(null);
    setShowStartModal(false);
    setShowFinishModal(false);
    
    showNotification('Game finished. Session closed.', 'success');
  };

  // Join session when connected (teacher needs to join session to receive lobby updates)
  useEffect(() => {
    if (wsConnected && sessionCode && user?.teacher_id && wsSendMessage) {
      console.log('[Teacher] Joining session:', sessionCode);
      // Teacher joins session - server will detect role from WebSocket connection
      wsSendMessage('join-session', {
        sessionCode
        // teacherId is not needed - server uses ws.userId from connection
      });
    }
  }, [wsConnected, sessionCode, user?.teacher_id, wsSendMessage]);

  // Handle WebSocket messages for teacher
  useEffect(() => {
    if (!wsOnMessage || !sessionCode) return;

    // Listen for lobby updates
    const unsubLobbyUpdate = wsOnMessage('lobby-update', (data) => {
      console.log('[Teacher] Lobby update:', data);
      setLobbyPlayers(data.players || []);
    });

    // Listen for player joined
    const unsubPlayerJoined = wsOnMessage('player-joined', (data) => {
      console.log('[Teacher] Player joined:', data);
      // Lobby update will handle the player list
    });

    // Listen for game started confirmation
    const unsubGameStarted = wsOnMessage('game-started', (data) => {
      console.log('[Teacher] Game started:', data);
      setGameStarted(true);
    });

    // Listen for game finished
    const unsubGameFinished = wsOnMessage('game-finished', (data) => {
      console.log('[Teacher] Game finished:', data);
      setGameStarted(false);
      setPlayerStats([]);
      setLobbyPlayers([]);
      setSessionCode(null);
      setShowStartModal(false);
      showNotification('Game finished successfully', 'success');
    });

    // Listen for player stats updates (leaderboard)
    const unsubPlayerStats = wsOnMessage('player-stats-update', (data) => {
      console.log('[Teacher] Player stats update:', data);
      setPlayerStats(data.stats || []);
    });

    return () => {
      unsubLobbyUpdate();
      unsubPlayerJoined();
      unsubGameStarted();
      unsubPlayerStats();
      unsubGameFinished();
    };
  }, [wsOnMessage, sessionCode]);

  // Game saved handler - games are reloaded when navigating back from creator page
  // We'll reload games when component mounts or when navigating back

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mini Games</h2>
        <Button onClick={() => navigate('/teacher/minigames/create')}>
          + Create New Game
        </Button>
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <Card>
          <div className="text-center p-8 text-gray-500">
            <p>No games created yet.</p>
            <Button onClick={() => navigate('/teacher/minigames/create')} className="mt-4">
              Create Your First Game
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <Card key={game.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{game.game_name}</h3>
                    {game.is_active && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-medium">
                        Active
                      </span>
                    )}
                    {!game.is_active && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {game.topic} • {game.question_count || 0} questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleShowDetails(game)}
                    variant="outline"
                    size="sm"
                  >
                    Details
                  </Button>
                  {sessionCode && selectedGame?.id === game.id ? (
                    <Button
                      onClick={() => {
                        setSelectedGame(game);
                        setShowStartModal(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Session Active
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedGame(game);
                        handleStartGame();
                      }}
                      disabled={isCreatingSession || !game.is_active}
                      size="sm"
                    >
                      {isCreatingSession && selectedGame?.id === game.id ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-1">Creating...</span>
                        </>
                      ) : (
                        'Start'
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteClick(game)}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Game Details Modal */}
      {showGameDetails && selectedGame && (
        <PerfectModal
          isOpen={showGameDetails}
          onClose={handleCloseDetails}
          title={selectedGame.game_name}
        >
          <div className="space-y-4">
            {/* Game Details */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Topic</label>
                <p className="text-gray-900">{selectedGame.topic || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Grade</label>
                <p className="text-gray-900">Grade {selectedGame.grade}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Class</label>
                <p className="text-gray-900">{selectedGame.class === 0 ? 'All Classes' : `Class ${selectedGame.class}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Game Type</label>
                <p className="text-gray-900 capitalize">{selectedGame.game_type?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Questions</label>
                <p className="text-gray-900">{selectedGame.question_count || 0} questions</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedGame.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedGame.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(selectedGame.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Session Code Display (if session started) */}
            {sessionCode && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg"
              >
                <p className="font-semibold mb-2 text-green-800">Game Session Active!</p>
                <p className="text-2xl font-mono font-bold text-center mb-3 text-green-600 tracking-widest">
                  {sessionCode}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(sessionCode);
                      showNotification('Session code copied!', 'success');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Copy Code
                  </Button>
                  <Button
                    onClick={() => setShowQRCode(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Show QR Code
                  </Button>
                </div>
                {wsConnected && (
                  <p className="text-xs text-green-600 mt-2 text-center">✓ Connected to game server</p>
                )}
              </motion.div>
            )}

            {/* Details only - no action buttons here */}
          </div>
        </PerfectModal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && gameToDelete && (
        <PerfectModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setGameToDelete(null);
          }}
          title="Delete Game"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>"{gameToDelete.game_name}"</strong>?
            </p>
            <p className="text-sm text-gray-500">
              This action cannot be undone. All questions and game data will be permanently deleted.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setGameToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="destructive"
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </PerfectModal>
      )}

      {/* Start Game Modal */}
      {showStartModal && sessionCode && selectedGame && (
        <PerfectModal
          isOpen={showStartModal}
          onClose={() => {
            setShowStartModal(false);
            setIsFullscreen(false);
            setIsLeaderboardFullscreen(false);
          }}
          title={`Start Game: ${selectedGame.game_name}`}
          size={isFullscreen ? 'large' : 'large'}
          className={isFullscreen ? 'h-[95vh] max-w-[95vw]' : 'max-h-[90vh] max-w-[90vw]'}
        >
          <div className={`space-y-4 overflow-y-auto pr-2 custom-scrollbar ${isFullscreen ? 'h-[calc(95vh-120px)]' : 'max-h-[calc(90vh-120px)]'}`}>
            {/* Session Code */}
            <div className="text-center">
              <label className="text-sm font-medium text-gray-500 block mb-2">Session Code</label>
              <p className="text-3xl font-mono font-bold text-green-600 tracking-widest mb-4">
                {sessionCode}
              </p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(sessionCode);
                  showNotification('Session code copied!', 'success');
                }}
                variant="outline"
                size="sm"
              >
                Copy Code
              </Button>
            </div>

            {/* Game Link */}
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Game Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/student/duel/${sessionCode}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  onClick={() => {
                    const url = `${window.location.origin}/student/duel/${sessionCode}`;
                    navigator.clipboard.writeText(url);
                    showNotification('Game link copied!', 'success');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <QRCodeCanvas sessionCode={sessionCode} />

            {/* Lobby Status */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Students in Lobby</span>
                <span className="text-lg font-bold text-blue-600">{lobbyPlayers.length}</span>
              </div>
              {lobbyPlayers.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {lobbyPlayers.map((player, index) => (
                    <div key={player.studentId || index} className="text-sm text-gray-600">
                      • {player.studentNickname || player.studentName || player.studentId}
                      {player.selectedCharacter && (
                        <span className="text-gray-400 ml-2 capitalize">({player.selectedCharacter})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {lobbyPlayers.length === 0 && (
                <p className="text-sm text-gray-500 italic">Waiting for students to join...</p>
              )}
            </div>

            {/* Connection Status */}
            {wsConnected ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Connected to game server</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Connecting to server...</span>
              </div>
            )}

            {/* Leaderboard (during game) */}
            {gameStarted && playerStats.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Live Leaderboard</h3>
                  <button
                    onClick={() => setIsLeaderboardFullscreen(!isLeaderboardFullscreen)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={isLeaderboardFullscreen ? 'Exit leaderboard fullscreen' : 'Fullscreen leaderboard'}
                    title={isLeaderboardFullscreen ? 'Exit fullscreen' : 'Fullscreen leaderboard'}
                  >
                    {isLeaderboardFullscreen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className={`space-y-2 overflow-y-auto custom-scrollbar ${isLeaderboardFullscreen ? 'max-h-[70vh]' : 'max-h-64'}`}>
                  {playerStats
                    .sort((a, b) => {
                      // Sort by: correct answers (desc), then damage dealt (desc)
                      if (b.correctAnswers !== a.correctAnswers) {
                        return b.correctAnswers - a.correctAnswers;
                      }
                      return (b.damageDealt || 0) - (a.damageDealt || 0);
                    })
                    .map((player, index) => (
                      <div
                        key={player.studentId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-gray-900 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {player.studentNickname || player.studentName || player.studentId}
                            </p>
                            {player.selectedCharacter && (
                              <p className="text-xs text-gray-500 capitalize">{player.selectedCharacter}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">XP:</span>
                              <span className="font-semibold text-green-600 ml-1">
                                {player.correctAnswers * 10 || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dealt:</span>
                              <span className="font-semibold text-blue-600 ml-1">
                                {player.damageDealt || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Taken:</span>
                              <span className="font-semibold text-red-600 ml-1">
                                {player.damageReceived || 0}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {player.correctAnswers || 0} / 3 cards correct
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Start/Finish Game Button */}
            <div className="pt-4 border-t">
              {!gameStarted ? (
                <>
                  <Button
                    onClick={handleStartServer}
                    disabled={!wsConnected || lobbyPlayers.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    {lobbyPlayers.length === 0
                      ? 'Waiting for players...'
                      : `Start Game (${lobbyPlayers.length} ${lobbyPlayers.length === 1 ? 'player' : 'players'} ready)`
                    }
                  </Button>
                  {lobbyPlayers.length === 0 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Students need to join and select characters first
                    </p>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleFinishGame}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  Finish Game
                </Button>
              )}
            </div>
          </div>
        </PerfectModal>
      )}

      {/* Finish Game Confirmation Modal */}
      {showFinishModal && (
        <PerfectModal
          isOpen={showFinishModal}
          onClose={() => setShowFinishModal(false)}
          title="Finish Game"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to finish the game? This will close the session and disconnect all players.
            </p>
            <p className="text-sm text-gray-500">
              All game progress will be saved, but players will be disconnected from the game.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowFinishModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinishConfirm}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Finish Game
              </Button>
            </div>
          </div>
        </PerfectModal>
      )}

      {/* QR Code Modal */}
      {showQRCode && sessionCode && (
        <QRCodeDisplay
          sessionCode={sessionCode}
          gameName={selectedGame?.game_name}
          onClose={() => setShowQRCode(false)}
        />
      )}

      {/* Leaderboard Fullscreen Modal */}
      {isLeaderboardFullscreen && gameStarted && playerStats.length > 0 && (
        <PerfectModal
          isOpen={isLeaderboardFullscreen}
          onClose={() => setIsLeaderboardFullscreen(false)}
          title="Live Leaderboard"
          size="large"
          className="h-[90vh] flex flex-col"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-2">
              {playerStats
                .sort((a, b) => {
                  // Sort by: correct answers (desc), then damage dealt (desc)
                  if (b.correctAnswers !== a.correctAnswers) {
                    return b.correctAnswers - a.correctAnswers;
                  }
                  return (b.damageDealt || 0) - (a.damageDealt || 0);
                })
                .map((player, index) => (
                  <div
                    key={player.studentId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400 text-gray-900 font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-gray-900">
                          {player.studentNickname || player.studentName || player.studentId}
                        </p>
                        {player.selectedCharacter && (
                          <p className="text-sm text-gray-500 capitalize">{player.selectedCharacter}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-6 text-base">
                        <div>
                          <span className="text-gray-500">XP:</span>
                          <span className="font-semibold text-green-600 ml-2">
                            {player.correctAnswers * 10 || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dealt:</span>
                          <span className="font-semibold text-blue-600 ml-2">
                            {player.damageDealt || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Taken:</span>
                          <span className="font-semibold text-red-600 ml-2">
                            {player.damageReceived || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        {player.correctAnswers || 0} / 3 cards correct
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </PerfectModal>
      )}
    </div>
  );
};

export default MiniGame;

