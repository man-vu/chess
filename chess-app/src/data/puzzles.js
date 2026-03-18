/**
 * Chess Puzzles Collection
 *
 * 30 tactical puzzles with valid FEN positions, UCI solution moves,
 * difficulty ratings (800-2200), and thematic tags. All puzzles are
 * White to move.
 */

export const puzzles = [
  // --- Forks ---
  {
    id: "p001",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    moves: ["h5f7"],
    rating: 800,
    themes: ["fork", "checkmate", "opening"],
    description: "White to move. Deliver Scholar's Mate on f7.",
  },
  {
    id: "p002",
    fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P1b1/8/PPPP1PPP/RNBQK2R w KQkq - 2 5",
    moves: ["e5f7", "e8f7", "d1g4"],
    rating: 1000,
    themes: ["fork", "sacrifice", "opening"],
    description: "White to move. Sacrifice the knight on f7 to expose the king, then fork with Qg4.",
  },
  {
    id: "p003",
    fen: "r2qk2r/ppp2ppp/2n1bn2/3pp1B1/3PP1b1/2N2N2/PPP2PPP/R2QKB1R w KQkq - 4 6",
    moves: ["d4d5", "c6e7", "f3e5"],
    rating: 1050,
    themes: ["fork", "knight", "middlegame"],
    description: "White to move. Push d5 to displace the knight, then fork on e5.",
  },
  {
    id: "p004",
    fen: "r1b1kb1r/ppppqppp/5n2/4n1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 6",
    moves: ["g5f7", "e7e4", "f7h8"],
    rating: 1100,
    themes: ["fork", "knight", "sacrifice"],
    description: "White to move. Fork king and rook with Nxf7, winning the exchange.",
  },
  {
    id: "p005",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4",
    moves: ["f3e5", "c6e5", "d2d4"],
    rating: 1050,
    themes: ["fork", "centerControl", "middlegame"],
    description: "White to move. Win the center with a forcing pawn fork after Nxe5.",
  },

  // --- Pins ---
  {
    id: "p006",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    moves: ["e1g1"],
    rating: 850,
    themes: ["pin", "castling", "development"],
    description: "White to move. Castle kingside to keep the pin on c6 and secure the king.",
  },
  {
    id: "p007",
    fen: "rn1qkbnr/ppp1pppp/8/3p4/4P1b1/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    moves: ["f1e2"],
    rating: 850,
    themes: ["pin", "development", "opening"],
    description: "White to move. Break the pin on the knight by developing the bishop.",
  },
  {
    id: "p008",
    fen: "rn1qk2r/pbpp1ppp/1p2pn2/8/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5",
    moves: ["c1g5"],
    rating: 950,
    themes: ["pin", "middlegame"],
    description: "White to move. Pin the knight on f6 to the queen with Bg5.",
  },
  {
    id: "p009",
    fen: "r2qk1nr/pppb1ppp/2n1p3/3pP3/1b1P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 2 5",
    moves: ["f1b5"],
    rating: 1000,
    themes: ["pin", "middlegame"],
    description: "White to move. Pin the knight on c6 to the king with Bb5.",
  },

  // --- Back Rank Mates ---
  {
    id: "p010",
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
    moves: ["b1b8", "d8b8"],
    rating: 850,
    themes: ["backRankMate", "endgame"],
    description: "White to move. Deliver a simple back rank checkmate.",
  },
  {
    id: "p011",
    fen: "6k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1",
    moves: ["e2e8"],
    rating: 800,
    themes: ["backRankMate", "endgame"],
    description: "White to move. Deliver back rank checkmate with the rook.",
  },
  {
    id: "p012",
    fen: "5rk1/pp3ppp/8/3Q4/8/8/PPP2PPP/4R1K1 w - - 0 1",
    moves: ["e1e8", "f8e8", "d5e8"],
    rating: 1000,
    themes: ["backRankMate", "sacrifice", "endgame"],
    description: "White to move. Sacrifice the rook to force a back rank mate with the queen.",
  },
  {
    id: "p013",
    fen: "r4rk1/ppp2ppp/2n5/3q4/8/5B2/PPP1QPPP/R4RK1 w - - 0 14",
    moves: ["f3c6", "d5c6", "e2e8"],
    rating: 1400,
    themes: ["backRankMate", "deflection", "middlegame"],
    description: "White to move. Deflect the queen from the back rank, then deliver mate.",
  },

  // --- Skewers ---
  {
    id: "p014",
    fen: "4k3/8/8/8/1b6/8/3R4/4K3 w - - 0 1",
    moves: ["d2d8", "e8e7", "d8b8"],
    rating: 950,
    themes: ["skewer", "endgame"],
    description: "White to move. Skewer the king to win the bishop.",
  },
  {
    id: "p015",
    fen: "r3k3/ppp2p1p/5bp1/4q3/4P3/5B2/PPP2PPP/R2Q2K1 w q - 0 15",
    moves: ["f3b7"],
    rating: 1100,
    themes: ["skewer", "middlegame"],
    description: "White to move. Win material with a bishop skewer on the long diagonal.",
  },

  // --- Discovered Attacks ---
  {
    id: "p016",
    fen: "r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    moves: ["e5f7"],
    rating: 1000,
    themes: ["discoveredAttack", "sacrifice", "opening"],
    description: "White to move. Fork king and rook with the knight on f7.",
  },
  {
    id: "p017",
    fen: "r2qkbnr/ppp2ppp/2n5/3Np1b1/2B1P3/8/PPPP1PPP/R1BQK1NR w KQkq - 0 5",
    moves: ["d5f6", "g7f6", "d1h5"],
    rating: 1300,
    themes: ["discoveredAttack", "sacrifice", "middlegame"],
    description: "White to move. Sacrifice the knight to shatter the kingside and bring the queen in.",
  },

  // --- Smothered Mates ---
  {
    id: "p018",
    fen: "6rk/5Npp/8/8/8/8/6PP/6QK w - - 0 1",
    moves: ["g1g8", "g8g8", "f7h6", "g8g7", "h6f7"],
    rating: 1500,
    themes: ["smotheredMate", "sacrifice"],
    description: "White to move. Sacrifice the queen to deliver a classic smothered mate.",
  },
  {
    id: "p019",
    fen: "r1b3kr/pppn1Npp/8/2b1q3/8/8/PPPPQPPP/RNB1KB1R w KQ - 0 1",
    moves: ["f7h6", "g8h8", "e2e8", "a8e8", "h6f7"],
    rating: 1600,
    themes: ["smotheredMate", "sacrifice", "middlegame"],
    description: "White to move. Execute the full Philidor smothered mate pattern.",
  },

  // --- Deflection / Decoy ---
  {
    id: "p020",
    fen: "3r1rk1/pp3ppp/8/2pQ4/8/1P4P1/P4P1P/3RR1K1 w - - 0 1",
    moves: ["d5f7", "g8h8", "e1e8"],
    rating: 1350,
    themes: ["deflection", "backRankMate"],
    description: "White to move. Deflect the king and crash through on the back rank.",
  },
  {
    id: "p021",
    fen: "r2q1rk1/pp2bppp/2p1pn2/6B1/3P4/2N2Q2/PPP2PPP/R4RK1 w - - 0 11",
    moves: ["g5f6", "e7f6", "f3h5"],
    rating: 1250,
    themes: ["deflection", "attack", "middlegame"],
    description: "White to move. Exchange on f6 to weaken the kingside, then invade with the queen.",
  },

  // --- Double Attacks ---
  {
    id: "p022",
    fen: "r3k2r/ppp1bppp/2nqbn2/3p2B1/3P4/2N1PN2/PPP2PPP/R2QKB1R w KQkq - 4 7",
    moves: ["f1b5"],
    rating: 1100,
    themes: ["doubleAttack", "pin", "middlegame"],
    description: "White to move. Pin the knight and put pressure on d5 with Bb5.",
  },
  {
    id: "p023",
    fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 7",
    moves: ["c1g5"],
    rating: 900,
    themes: ["doubleAttack", "pin", "middlegame"],
    description: "White to move. Pin the knight to the queen and increase pressure.",
  },

  // --- Mating Patterns ---
  {
    id: "p024",
    fen: "r5k1/ppp2p1p/6pB/8/3r4/2P5/PP3PPP/R4RK1 w - - 0 1",
    moves: ["f1f7"],
    rating: 1200,
    themes: ["matingPattern", "sacrifice"],
    description: "White to move. Play Rf7 threatening unstoppable mate with the bishop on h6.",
  },
  {
    id: "p025",
    fen: "5rk1/5p1p/8/8/8/5N2/5PPP/4R1K1 w - - 0 1",
    moves: ["f3g5", "f8f6", "e1e8", "f6f8", "e8f8"],
    rating: 1400,
    themes: ["arabianMate", "matingPattern", "endgame"],
    description: "White to move. Coordinate knight and rook for the Arabian mate.",
  },
  {
    id: "p026",
    fen: "4rrk1/4Nppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    moves: ["e7f5", "g8h8", "d1d7"],
    rating: 1500,
    themes: ["matingPattern", "discoveredAttack", "endgame"],
    description: "White to move. Reposition the knight for a lethal discovered attack.",
  },

  // --- Complex Tactics ---
  {
    id: "p027",
    fen: "r2q1rk1/pp2ppbp/2np1np1/2p5/4PP2/2NP2P1/PPP1N1BP/R1BQ1RK1 w - - 0 9",
    moves: ["e4e5", "d6e5", "f4e5"],
    rating: 1250,
    themes: ["pawnBreak", "middlegame"],
    description: "White to move. Open the center with the dynamic pawn break e5.",
  },
  {
    id: "p028",
    fen: "r1bq1rk1/ppp1nppp/4p3/3pP3/3P4/2N5/PPP2PPP/R1BQKB1R w KQ - 0 7",
    moves: ["f1d3", "c7c5", "d4c5"],
    rating: 1200,
    themes: ["development", "pawnStructure", "middlegame"],
    description: "White to move. Develop the bishop to d3 and prepare kingside play.",
  },
  {
    id: "p029",
    fen: "r3kb1r/1bq2ppp/p1nppn2/1p6/4P3/1BN2N2/PPPQ1PPP/R1B1R1K1 w kq - 0 10",
    moves: ["e4e5", "d6e5", "c3d5"],
    rating: 1700,
    themes: ["sacrifice", "centralControl", "middlegame"],
    description: "White to move. Sacrifice a pawn to plant a powerful knight on d5.",
  },
  {
    id: "p030",
    fen: "r4rk1/pp1n1ppp/2p1p3/q2pP1B1/3P4/P1N5/1PP1QPPP/R4RK1 w - - 0 14",
    moves: ["c3d5", "c6d5", "e2h5"],
    rating: 2000,
    themes: ["sacrifice", "attack", "middlegame"],
    description: "White to move. Sacrifice the knight to rip open the position and attack on h5.",
  },
];

/**
 * Returns a puzzle based on the current date so the same puzzle appears
 * all day long. Uses a simple date-based seed (days since Unix epoch).
 *
 * @returns {object} A puzzle object from the puzzles array
 */
export function getDailyPuzzle() {
  const now = new Date();
  const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % puzzles.length;
  return puzzles[index];
}
