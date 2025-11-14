import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMiniGameWebSocket } from '../../hooks/useMiniGameWebSocket';
import { useNotification } from '../ui/Notification';
import CharacterSelection from './duel/CharacterSelection';
import LobbyPhase from './duel/LobbyPhase';
import CardPhase from './duel/CardPhase';
import QueuePhase from './duel/QueuePhase';
import BattlePhase from './duel/BattlePhase';
import ResultsPhase from './duel/ResultsPhase';
import MatchResult from './duel/MatchResult';
import LoadingSpinner from '../ui/LoadingSpinner';

const DuelGame = ({ sessionCode, gameId, studentData, onExit }) => {
  // Don't use AuthContext - game works with just student data
  const { showNotification } = useNotification();
  const [gamePhase, setGamePhase] = useState('character-selection'); // character-selection, lobby, cards, queue, battle, results
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [studentNickname, setStudentNickname] = useState(studentData?.nickname || '');
  const [questions, setQuestions] = useState([]);
  const [cardAnswers, setCardAnswers] = useState([]);
  const [damage, setDamage] = useState(5); // Base damage
  const [matchData, setMatchData] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [results, setResults] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const matchDataRef = React.useRef(null); // Ref to track current matchData

  // Use student data directly (no auth tokens needed)
  const userId = studentData?.student_id;
  const userRole = studentData?.role || 'student';

  const { isConnected, error, sendMessage, onMessage } = useMiniGameWebSocket(
    sessionCode,
    userId,
    userRole
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (!onMessage) return;

    // Character selection
    const unsubChar = onMessage('character-selection', (data) => {
      setStudentNickname(data.studentNickname || studentData?.nickname || studentData?.name || '');
    });

    // Character selected confirmation
    const unsubCharSelected = onMessage('character-selected', (data) => {
      // After character selection, show lobby join option
      // Don't change phase yet - wait for student to press "Join Lobby"
    });

    // Lobby update (list of players in lobby)
    const unsubLobbyUpdate = onMessage('lobby-update', (data) => {
      setLobbyPlayers(data.players || []);
    });

    // Joined lobby confirmation
    const unsubLobbyJoined = onMessage('lobby-joined', (data) => {
      console.log('[DuelGame] Lobby joined message received:', data);
      setGamePhase('lobby');
      setLobbyPlayers(data.players || []);
      showNotification('Joined lobby successfully!', 'success');
    });

    // Start card phase (sent by server when teacher starts game, for late joiners, or after round ends)
    const unsubCards = onMessage('start-card-phase', (data) => {
      const questions = data.questions || [];
      if (questions.length > 0) {
        setQuestions(questions);
        
        // Reset card answers and damage for new card phase
        setCardAnswers([]);
        setDamage(5); // Reset to base damage
        
        // If this is a late joiner, set their assigned character and skip to cards
        if (data.lateJoiner && data.assignedCharacter) {
          console.log('[DuelGame] Late joiner detected, assigned character:', data.assignedCharacter);
          setSelectedCharacter(data.assignedCharacter);
          setGamePhase('cards');
          showNotification('Game already started! You\'ve been assigned a character and can join now.', 'info');
        } else {
          // Normal flow - teacher started the game OR returning from battle after round ends
          console.log('[DuelGame] Starting card phase (questions:', questions.length, ')');
          setGamePhase('cards');
          // Clear match data when returning to cards
          setMatchData(null);
          matchDataRef.current = null;
        }
      } else {
        console.warn('[DuelGame] Received start-card-phase with no questions, staying in current phase');
        // Don't switch to cards phase if no questions
      }
    });

    // Card result
    const unsubCardResult = onMessage('card-result', (data) => {
      setCardAnswers(prev => [...prev, {
        questionId: data.questionId,
        isCorrect: data.isCorrect
      }]);
      setDamage(data.currentDamage);
    });

    // Cards complete
    const unsubCardsComplete = onMessage('cards-complete', (data) => {
      setGamePhase('queue');
    });

    // Queue joined
    const unsubQueue = onMessage('queue-joined', (data) => {
      // Already in queue phase
    });

    // Match found
    const unsubMatch = onMessage('match-found', (data) => {
      const newMatchData = {
        matchId: data.matchId,
        opponentId: data.opponentId,
        opponentNickname: data.opponentNickname,
        opponentCharacter: data.opponentCharacter,
        opponentDamage: data.opponentDamage,
        isPlayer1: data.isPlayer1
      };
      matchDataRef.current = newMatchData; // Update ref
      setMatchData(newMatchData);
      setGamePhase('battle');
      
      // Immediately send round-ready to start the match
      // The server will start the round when both players are ready
      console.log('[DuelGame] Match found, sending round-ready');
      sendMessage('round-ready', {
        matchId: data.matchId
      });
    });

    // Round start
    const unsubRoundStart = onMessage('round-start', (data) => {
      setBattleState(prev => ({
        ...prev,
        round: data.round,
        roundTimeLeft: data.duration / 1000,
        player1Hp: data.player1Hp,
        player2Hp: data.player2Hp
      }));
    });

    // Opponent move
    const unsubOpponentMove = onMessage('opponent-move', (data) => {
      setBattleState(prev => ({
        ...prev,
        opponentPosition: data.position
      }));
    });

    // Spell cast (from server - server creates spell with ID)
    const unsubSpellCast = onMessage('spell-cast', (data) => {
      const spell = {
        ...data.spell,
        casterId: data.spell.casterId || data.spell.owner
      };
      
      setBattleState(prev => {
        // Replace temporary spell with server spell (match by casterId + type + recent timestamp)
        let matchedTempSpell = null;
        const filteredSpells = (prev?.activeSpells || []).filter(s => {
          // Remove temp spell from same caster and type if created recently
          if (s.isTemp && s.casterId === spell.casterId && s.type === spell.type) {
            const timeDiff = Math.abs(spell.createdAt - (s.createdAt || 0));
            if (timeDiff <= 1000) {
              matchedTempSpell = s; // Remember which temp spell matched
              return false; // Remove temp spell
            }
          }
          return true;
        });
        
        // If temp spell was hit, send hit with server spell ID
        if (matchedTempSpell && prev?.tempSpellHits?.has(matchedTempSpell.id)) {
          const hitInfo = prev.tempSpellHits.get(matchedTempSpell.id);
          // Send hit with server spell ID
          const currentMatchId = matchDataRef.current?.matchId;
          if (currentMatchId) {
            sendMessage('spell-hit', {
              matchId: currentMatchId,
              spellId: spell.id, // Use server spell ID
              hitPlayerId: hitInfo.hitTargetId
            });
          }
          // Clean up temp hit tracking
          const newTempSpellHits = new Map(prev.tempSpellHits);
          newTempSpellHits.delete(matchedTempSpell.id);
          return {
            ...prev,
            activeSpells: [...filteredSpells, spell],
            tempSpellHits: newTempSpellHits
          };
        }
        
        return {
          ...prev,
          activeSpells: [...filteredSpells, spell]
        };
      });
    });

    // Spell hit (from server - HP update)
    const unsubSpellHit = onMessage('spell-hit', (data) => {
      console.log('[DuelGame] Spell hit received, updating HP:', {
        spellId: data.spellId,
        player1Hp: data.player1Hp,
        player2Hp: data.player2Hp,
        prevPlayer1Hp: battleState?.player1Hp,
        prevPlayer2Hp: battleState?.player2Hp
      });
      setBattleState(prev => ({
        ...prev,
        player1Hp: data.player1Hp ?? prev?.player1Hp ?? 200,
        player2Hp: data.player2Hp ?? prev?.player2Hp ?? 200,
        activeSpells: prev?.activeSpells?.filter(s => s.id !== data.spellId) || []
      }));
    });

    // Round end
    const unsubRoundEnd = onMessage('round-end', (data) => {
      setBattleState(prev => ({
        ...prev,
        player1Hp: data.player1Hp,
        player2Hp: data.player2Hp,
        roundTimeLeft: 0
      }));
    });

    // Match end
    const unsubMatchEnd = onMessage('match-end', (data) => {
      // Determine player's result
      const playerId = studentData?.student_id;
      const playerResult = data.results.player1?.id === playerId 
        ? data.results.player1 
        : data.results.player2?.id === playerId 
        ? data.results.player2 
        : null;
      
      if (playerResult) {
        setMatchResult(playerResult);
        setGamePhase('match-result');
      }
    });

    // Tournament end
    const unsubTournamentEnd = onMessage('tournament-end', (data) => {
      // Tournament complete - show final results
      setResults({
        tournamentComplete: true,
        winner: data.winner
      });
      setGamePhase('results');
    });

    // Error handling
    const unsubError = onMessage('error', (data) => {
      showNotification(data.message || 'An error occurred', 'error');
    });

    return () => {
      unsubChar();
      unsubCharSelected();
      unsubLobbyUpdate();
      unsubLobbyJoined();
      unsubCards();
      unsubCardResult();
      unsubCardsComplete();
      unsubQueue();
      unsubMatch();
      unsubRoundStart();
      unsubOpponentMove();
      unsubSpellCast();
      unsubSpellHit();
      unsubRoundEnd();
      unsubMatchEnd();
      unsubTournamentEnd();
      unsubError();
    };
  }, [onMessage, showNotification, studentData, sendMessage]);

  // Keep matchDataRef in sync with matchData state
  useEffect(() => {
    matchDataRef.current = matchData;
  }, [matchData]);

  // Join session when connected
  useEffect(() => {
    if (isConnected && studentData?.student_id) {
      sendMessage('join-session', {
        sessionCode,
        studentId: studentData.student_id,
        studentName: studentData.name,
        studentNickname: studentData.nickname
      });
    }
  }, [isConnected, sessionCode, studentData, sendMessage]);

  // Handle character selection
  const handleCharacterSelect = (characterId) => {
    setSelectedCharacter(characterId);
    sendMessage('character-selected', {
      sessionCode,
      studentId: studentData?.student_id,
      characterId
    });
  };

  // Handle join lobby
  const handleJoinLobby = () => {
    console.log('[DuelGame] Join Lobby clicked', { sessionCode, studentId: studentData?.student_id });
    if (!selectedCharacter) {
      showNotification('Please select a character first', 'error');
      return;
    }
    if (!sessionCode || !studentData?.student_id) {
      showNotification('Missing session code or student ID', 'error');
      return;
    }
    sendMessage('join-lobby', {
      sessionCode,
      studentId: studentData?.student_id
    });
  };

  // Handle card answer
  const handleCardAnswer = (questionId, answer) => {
    sendMessage('card-answered', {
      sessionCode,
      questionId,
      answer,
      studentId: studentData?.student_id
    });
  };

  // Handle enter queue
  const handleEnterQueue = () => {
    sendMessage('enter-queue', {
      sessionCode,
      studentId: studentData?.student_id
    });
  };

  // Handle player move in battle
  const handlePlayerMove = (position) => {
    if (matchData?.matchId) {
      sendMessage('player-move', {
        matchId: matchData.matchId,
        position
      });
    }
  };

  // Handle spell cast
  const handleSpellCast = (spellType, direction) => {
    const currentMatchId = matchDataRef.current?.matchId;
    if (currentMatchId) {
      console.log('[DuelGame] Sending spell-cast to server:', {
        matchId: currentMatchId,
        spellType,
        direction
      });
      sendMessage('spell-cast', {
        matchId: currentMatchId,
        spellType,
        direction
      });
    } else {
      console.warn('[DuelGame] Cannot send spell-cast: no matchId in ref', matchDataRef.current);
    }
  };

      // Handle spell hit - send to server
      const handleSpellHit = (spellId, hitPlayerId) => {
        const currentMatchId = matchDataRef.current?.matchId;
        if (currentMatchId) {
          sendMessage('spell-hit', {
            matchId: currentMatchId,
            spellId,
            hitPlayerId
          });
        }
      };

  // Handle round ready
  const handleRoundReady = () => {
    if (matchData?.matchId) {
      sendMessage('round-ready', {
        matchId: matchData.matchId
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Connecting to game server...</p>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <AnimatePresence mode="wait">
        {gamePhase === 'character-selection' && (
          <CharacterSelection
            key="character-selection"
            studentNickname={studentNickname || studentData?.nickname || studentData?.name}
            onSelect={handleCharacterSelect}
            onJoinLobby={handleJoinLobby}
            hasSelectedCharacter={!!selectedCharacter}
          />
        )}

        {gamePhase === 'lobby' && (
          <LobbyPhase
            key="lobby"
            players={lobbyPlayers}
            studentNickname={studentNickname || studentData?.nickname || studentData?.name}
            isTeacher={false} // Students can't start game - teacher needs separate view
            onStartGame={() => {
              // This won't be called for students
              sendMessage('start-game', { sessionCode });
            }}
          />
        )}

        {gamePhase === 'cards' && questions.length > 0 && (
          <CardPhase
            key="cards"
            questions={questions}
            onAnswer={handleCardAnswer}
            cardAnswers={cardAnswers}
            damage={damage}
          />
        )}

        {gamePhase === 'cards' && questions.length === 0 && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-white text-xl">Loading questions...</p>
            </div>
          </div>
        )}

        {gamePhase === 'queue' && (
          <QueuePhase
            key="queue"
            onEnterQueue={handleEnterQueue}
            correctAnswers={cardAnswers.filter(a => a.isCorrect).length}
            finalDamage={damage}
          />
        )}

        {gamePhase === 'battle' && (
          <BattlePhase
            key="battle"
            matchData={matchData}
            selectedCharacter={selectedCharacter}
            studentNickname={studentNickname || studentData?.nickname || studentData?.name}
            damage={damage}
            battleState={battleState}
            onPlayerMove={handlePlayerMove}
            onSpellCast={handleSpellCast}
            onSpellHit={handleSpellHit}
            onRoundReady={handleRoundReady}
          />
        )}

        {gamePhase === 'match-result' && (
          <MatchResult
            key="match-result"
            result={matchResult}
            onReEnterQueue={() => {
              setMatchResult(null);
              setGamePhase('queue');
              handleEnterQueue();
            }}
            onViewResults={() => {
              setGamePhase('results');
            }}
          />
        )}

        {gamePhase === 'results' && (
          <ResultsPhase
            key="results"
            results={results}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DuelGame;

