/**
 * Chess Opening Book
 *
 * Maps move sequences (SAN, space-separated) to opening names.
 * Covers 100+ openings across all major systems.
 */

const OPENINGS = {
  // ---------------------------------------------------------------
  // 1.e4
  // ---------------------------------------------------------------
  "e4": "King's Pawn Opening",

  // 1.e4 e5 — Open Games
  "e4 e5": "Open Game",
  "e4 e5 Nf3": "King's Knight Opening",
  "e4 e5 Nf3 Nc6": "King's Knight Opening",

  // Ruy Lopez
  "e4 e5 Nf3 Nc6 Bb5": "Ruy Lopez",
  "e4 e5 Nf3 Nc6 Bb5 a6": "Ruy Lopez: Morphy Defense",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4": "Ruy Lopez: Morphy Defense",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6": "Ruy Lopez: Morphy Defense",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O": "Ruy Lopez: Morphy Defense, Closed",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7": "Ruy Lopez: Closed",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6": "Ruy Lopez: Closed, Chigorin Defense",
  "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5": "Ruy Lopez: Marshall Attack",
  "e4 e5 Nf3 Nc6 Bb5 Nf6": "Ruy Lopez: Berlin Defense",
  "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4": "Ruy Lopez: Berlin Defense, Rio Gambit",
  "e4 e5 Nf3 Nc6 Bb5 f5": "Ruy Lopez: Schliemann Defense",
  "e4 e5 Nf3 Nc6 Bb5 d6": "Ruy Lopez: Steinitz Defense",
  "e4 e5 Nf3 Nc6 Bb5 Bc5": "Ruy Lopez: Classical Defense",

  // Italian Game
  "e4 e5 Nf3 Nc6 Bc4": "Italian Game",
  "e4 e5 Nf3 Nc6 Bc4 Bc5": "Giuoco Piano",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 c3": "Giuoco Piano: Giuoco Pianissimo",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 b4": "Evans Gambit",
  "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4": "Evans Gambit Accepted",
  "e4 e5 Nf3 Nc6 Bc4 Nf6": "Two Knights Defense",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5": "Two Knights Defense: Knight Attack",
  "e4 e5 Nf3 Nc6 Bc4 Nf6 d4": "Two Knights Defense: Open Variation",

  // Scotch Game
  "e4 e5 Nf3 Nc6 d4": "Scotch Game",
  "e4 e5 Nf3 Nc6 d4 exd4": "Scotch Game",
  "e4 e5 Nf3 Nc6 d4 exd4 Nxd4": "Scotch Game",
  "e4 e5 Nf3 Nc6 d4 exd4 Bc4": "Scotch Gambit",

  // Four Knights Game
  "e4 e5 Nf3 Nc6 Nc3": "Three Knights Opening",
  "e4 e5 Nf3 Nc6 Nc3 Nf6": "Four Knights Game",
  "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5": "Four Knights: Spanish Variation",

  // Petrov / Russian Defense
  "e4 e5 Nf3 Nf6": "Petrov's Defense",
  "e4 e5 Nf3 Nf6 Nxe5": "Petrov's Defense: Classical Attack",
  "e4 e5 Nf3 Nf6 d4": "Petrov's Defense: Steinitz Attack",

  // Philidor Defense
  "e4 e5 Nf3 d6": "Philidor Defense",
  "e4 e5 Nf3 d6 d4": "Philidor Defense",
  "e4 e5 Nf3 d6 d4 Nf6": "Philidor Defense: Hanham Variation",

  // King's Gambit
  "e4 e5 f4": "King's Gambit",
  "e4 e5 f4 exf4": "King's Gambit Accepted",
  "e4 e5 f4 exf4 Nf3": "King's Gambit Accepted: King's Knight Gambit",
  "e4 e5 f4 exf4 Bc4": "King's Gambit Accepted: Bishop's Gambit",
  "e4 e5 f4 d5": "King's Gambit Declined: Falkbeer Countergambit",
  "e4 e5 f4 Bc5": "King's Gambit Declined: Classical",

  // Vienna Game
  "e4 e5 Nc3": "Vienna Game",
  "e4 e5 Nc3 Nf6": "Vienna Game",
  "e4 e5 Nc3 Nc6": "Vienna Game",
  "e4 e5 Nc3 Nf6 f4": "Vienna Gambit",
  "e4 e5 Nc3 Nf6 Bc4": "Vienna Game: Falkbeer Variation",

  // Bishop's Opening
  "e4 e5 Bc4": "Bishop's Opening",

  // ---------------------------------------------------------------
  // 1.e4 — Semi-Open Games
  // ---------------------------------------------------------------

  // Sicilian Defense
  "e4 c5": "Sicilian Defense",
  "e4 c5 Nf3": "Sicilian Defense",
  "e4 c5 Nf3 d6": "Sicilian Defense",
  "e4 c5 Nf3 d6 d4": "Sicilian Defense: Open",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4": "Sicilian Defense: Open",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6": "Sicilian: Najdorf Variation",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5": "Sicilian Najdorf: English Attack",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6": "Sicilian: Dragon Variation",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3": "Sicilian Dragon: Yugoslav Attack",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6": "Sicilian: Scheveningen Variation",
  "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6": "Sicilian: Classical Variation",
  "e4 c5 Nf3 Nc6": "Sicilian Defense",
  "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5": "Sicilian: Sveshnikov Variation",
  "e4 c5 Nf3 Nc6 Bb5": "Sicilian: Rossolimo Variation",
  "e4 c5 Nf3 e6": "Sicilian Defense",
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6": "Sicilian: Kan Variation",
  "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6": "Sicilian: Taimanov Variation",
  "e4 c5 c3": "Sicilian: Alapin Variation",
  "e4 c5 Nc3": "Sicilian: Closed Variation",
  "e4 c5 d4 cxd4 c3": "Sicilian: Smith-Morra Gambit",
  "e4 c5 f4": "Sicilian: Grand Prix Attack",

  // French Defense
  "e4 e6": "French Defense",
  "e4 e6 d4": "French Defense",
  "e4 e6 d4 d5": "French Defense",
  "e4 e6 d4 d5 Nc3": "French Defense: Paulsen Variation",
  "e4 e6 d4 d5 Nc3 Bb4": "French Defense: Winawer Variation",
  "e4 e6 d4 d5 Nc3 Bb4 e5": "French Winawer: Advance Variation",
  "e4 e6 d4 d5 Nc3 Nf6": "French Defense: Classical Variation",
  "e4 e6 d4 d5 Nc3 Nf6 Bg5": "French Classical: Steinitz Variation",
  "e4 e6 d4 d5 Nd2": "French Defense: Tarrasch Variation",
  "e4 e6 d4 d5 Nd2 Nf6": "French Tarrasch: Open Variation",
  "e4 e6 d4 d5 Nd2 c5": "French Tarrasch",
  "e4 e6 d4 d5 e5": "French Defense: Advance Variation",
  "e4 e6 d4 d5 e5 c5": "French Advance: Paulsen Attack",
  "e4 e6 d4 d5 exd5": "French Defense: Exchange Variation",

  // Caro-Kann Defense
  "e4 c6": "Caro-Kann Defense",
  "e4 c6 d4": "Caro-Kann Defense",
  "e4 c6 d4 d5": "Caro-Kann Defense",
  "e4 c6 d4 d5 Nc3": "Caro-Kann: Classical Variation",
  "e4 c6 d4 d5 Nc3 dxe4 Nxe4": "Caro-Kann: Classical Variation",
  "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5": "Caro-Kann: Classical, Main Line",
  "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7": "Caro-Kann: Karpov Variation",
  "e4 c6 d4 d5 e5": "Caro-Kann: Advance Variation",
  "e4 c6 d4 d5 e5 Bf5": "Caro-Kann: Advance, Short Variation",
  "e4 c6 d4 d5 exd5 cxd5": "Caro-Kann: Exchange Variation",
  "e4 c6 d4 d5 Nd2": "Caro-Kann: Two Knights Variation",
  "e4 c6 d4 d5 f3": "Caro-Kann: Fantasy Variation",

  // Pirc Defense
  "e4 d6": "Pirc Defense",
  "e4 d6 d4": "Pirc Defense",
  "e4 d6 d4 Nf6": "Pirc Defense",
  "e4 d6 d4 Nf6 Nc3": "Pirc Defense: Classical Variation",
  "e4 d6 d4 Nf6 Nc3 g6": "Pirc Defense: Classical",
  "e4 d6 d4 Nf6 Nc3 g6 f4": "Pirc Defense: Austrian Attack",

  // Modern Defense
  "e4 g6": "Modern Defense",
  "e4 g6 d4 Bg7": "Modern Defense",

  // Alekhine's Defense
  "e4 Nf6": "Alekhine's Defense",
  "e4 Nf6 e5 Nd5": "Alekhine's Defense",
  "e4 Nf6 e5 Nd5 d4 d6": "Alekhine's Defense: Modern Variation",
  "e4 Nf6 e5 Nd5 d4 d6 Nf3": "Alekhine's Defense: Modern Variation",
  "e4 Nf6 e5 Nd5 c4": "Alekhine's Defense: Chase Variation",

  // Scandinavian Defense
  "e4 d5": "Scandinavian Defense",
  "e4 d5 exd5 Qxd5": "Scandinavian Defense: Mieses-Kotroc Variation",
  "e4 d5 exd5 Qxd5 Nc3 Qa5": "Scandinavian Defense: Main Line",
  "e4 d5 exd5 Nf6": "Scandinavian Defense: Modern Variation",

  // ---------------------------------------------------------------
  // 1.d4 d5 — Closed Games
  // ---------------------------------------------------------------
  "d4": "Queen's Pawn Opening",
  "d4 d5": "Queen's Pawn Game",
  "d4 d5 c4": "Queen's Gambit",
  "d4 d5 c4 dxc4": "Queen's Gambit Accepted",
  "d4 d5 c4 dxc4 Nf3": "Queen's Gambit Accepted: Main Line",
  "d4 d5 c4 e6": "Queen's Gambit Declined",
  "d4 d5 c4 e6 Nc3": "Queen's Gambit Declined",
  "d4 d5 c4 e6 Nc3 Nf6": "Queen's Gambit Declined: Orthodox Defense",
  "d4 d5 c4 e6 Nc3 Nf6 Bg5": "Queen's Gambit Declined: Orthodox, Main Line",
  "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7": "QGD: Orthodox, Main Line",
  "d4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 Bf4": "Queen's Gambit Declined: Ragozin Defense",
  "d4 d5 c4 e6 Nc3 c5": "Queen's Gambit Declined: Tarrasch Defense",
  "d4 d5 c4 c6": "Slav Defense",
  "d4 d5 c4 c6 Nf3": "Slav Defense",
  "d4 d5 c4 c6 Nf3 Nf6": "Slav Defense",
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4": "Slav Defense: Main Line",
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6": "Semi-Slav Defense",
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5": "Semi-Slav: Anti-Meran",
  "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3": "Semi-Slav: Meran Variation",

  // London System
  "d4 d5 Bf4": "London System",
  "d4 d5 Nf3 Nf6 Bf4": "London System",
  "d4 Nf6 Bf4": "London System",
  "d4 Nf6 Nf3 d5 Bf4": "London System",

  // Colle System
  "d4 d5 Nf3 Nf6 e3": "Colle System",
  "d4 d5 Nf3 Nf6 e3 e6 Bd3": "Colle System",

  // Torre Attack
  "d4 Nf6 Nf3 e6 Bg5": "Torre Attack",

  // ---------------------------------------------------------------
  // 1.d4 Nf6 — Indian Defenses
  // ---------------------------------------------------------------
  "d4 Nf6": "Indian Defense",
  "d4 Nf6 c4": "Indian Defense",

  // Nimzo-Indian Defense
  "d4 Nf6 c4 e6": "Indian Defense",
  "d4 Nf6 c4 e6 Nc3": "Nimzo-Indian Defense",
  "d4 Nf6 c4 e6 Nc3 Bb4": "Nimzo-Indian Defense",
  "d4 Nf6 c4 e6 Nc3 Bb4 Qc2": "Nimzo-Indian: Classical Variation",
  "d4 Nf6 c4 e6 Nc3 Bb4 e3": "Nimzo-Indian: Rubinstein Variation",
  "d4 Nf6 c4 e6 Nc3 Bb4 f3": "Nimzo-Indian: Saemisch Variation",

  // Queen's Indian Defense
  "d4 Nf6 c4 e6 Nf3": "Queen's Indian Defense",
  "d4 Nf6 c4 e6 Nf3 b6": "Queen's Indian Defense",
  "d4 Nf6 c4 e6 Nf3 b6 g3": "Queen's Indian: Fianchetto Variation",

  // Bogo-Indian Defense
  "d4 Nf6 c4 e6 Nf3 Bb4+": "Bogo-Indian Defense",

  // King's Indian Defense
  "d4 Nf6 c4 g6": "King's Indian Defense",
  "d4 Nf6 c4 g6 Nc3": "King's Indian Defense",
  "d4 Nf6 c4 g6 Nc3 Bg7": "King's Indian Defense",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4": "King's Indian Defense",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6": "King's Indian Defense",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5": "King's Indian: Classical Variation",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3": "King's Indian: Saemisch Variation",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4": "King's Indian: Four Pawns Attack",
  "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7": "King's Indian: Mar del Plata",

  // Grunfeld Defense
  "d4 Nf6 c4 g6 Nc3 d5": "Grunfeld Defense",
  "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5": "Grunfeld Defense: Exchange Variation",
  "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4": "Grunfeld: Exchange, Classical",
  "d4 Nf6 c4 g6 Nc3 d5 Nf3": "Grunfeld Defense: Russian Variation",

  // Benoni Defense
  "d4 Nf6 c4 c5": "Benoni Defense",
  "d4 Nf6 c4 c5 d5": "Benoni Defense",
  "d4 Nf6 c4 c5 d5 e6": "Benoni Defense: Modern Variation",
  "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6": "Benoni: Modern, Main Line",

  // Dutch Defense
  "d4 f5": "Dutch Defense",
  "d4 f5 c4 Nf6 g3 e6 Bg2": "Dutch Defense: Leningrad Variation",
  "d4 f5 c4 Nf6 g3 g6": "Dutch Defense: Leningrad Variation",
  "d4 f5 c4 e6": "Dutch Defense: Classical Variation",

  // ---------------------------------------------------------------
  // 1.c4 — English Opening
  // ---------------------------------------------------------------
  "c4": "English Opening",
  "c4 e5": "English Opening: Reversed Sicilian",
  "c4 e5 Nc3": "English Opening: Reversed Sicilian",
  "c4 c5": "English Opening: Symmetrical Variation",
  "c4 c5 Nc3": "English Opening: Symmetrical Variation",
  "c4 c5 Nf3 Nc6 Nc3": "English: Symmetrical, Four Knights",
  "c4 Nf6": "English Opening: Anglo-Indian Defense",
  "c4 Nf6 Nc3 e5": "English: Reversed Sicilian",
  "c4 e6": "English Opening",
  "c4 c6": "English Opening: Caro-Kann Setup",

  // ---------------------------------------------------------------
  // 1.Nf3 — Reti Opening
  // ---------------------------------------------------------------
  "Nf3": "Reti Opening",
  "Nf3 d5": "Reti Opening",
  "Nf3 d5 c4": "Reti Opening",
  "Nf3 d5 g3": "King's Indian Attack",
  "Nf3 Nf6 g3 g6 Bg2 Bg7": "King's Indian Attack",
  "Nf3 d5 g3 Nf6 Bg2": "King's Indian Attack",

  // ---------------------------------------------------------------
  // Other Openings
  // ---------------------------------------------------------------

  // Bird's Opening
  "f4": "Bird's Opening",
  "f4 d5": "Bird's Opening",
  "f4 e5": "Bird's Opening: From Gambit",

  // Larsen's Opening
  "b3": "Larsen's Opening",
  "b3 e5": "Larsen's Opening",
  "b3 d5": "Larsen's Opening",

  // Benko Opening / King's Fianchetto
  "g3": "Benko Opening",
  "g3 d5": "Benko Opening",
  "g3 e5": "Benko Opening",

  // Catalan
  "d4 Nf6 c4 e6 g3": "Catalan Opening",
  "d4 Nf6 c4 e6 g3 d5 Bg2": "Catalan Opening",
};

/**
 * Looks up the most specific opening name that matches the given move
 * sequence. Tries the full move list first, then progressively shorter
 * prefixes until a match is found.
 *
 * @param {string[]} moves  Array of SAN moves, e.g. ["e4", "e5", "Nf3"]
 * @returns {string|null}   Opening name, or null if no match
 */
export function getOpeningName(moves) {
  if (!moves || moves.length === 0) return null;

  // Try longest match first, then shorten
  for (let length = moves.length; length > 0; length--) {
    const key = moves.slice(0, length).join(" ");
    if (OPENINGS[key]) {
      return OPENINGS[key];
    }
  }

  return null;
}

export default OPENINGS;
