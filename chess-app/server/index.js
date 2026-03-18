const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      // Allow localhost ports 5173-5180 and no-origin requests (curl, etc.)
      if (
        !origin ||
        /^http:\/\/localhost:(517[3-9]|5180)$/.test(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error("CORS: origin not allowed"));
    },
    methods: ["GET", "POST"],
  },
});

const PORT = 3001;

// ---------------------------------------------------------------------------
// State stores
// ---------------------------------------------------------------------------

// Lobby queue — array of { socketId, username, elo }
const lobbyQueue = [];

// Active games keyed by gameId
// { chess, white: { socketId, username, elo }, black: { socketId, username, elo },
//   drawOffer: null | "white" | "black", disconnectTimers: {} }
const games = {};

// Reverse lookup: socketId -> gameId
const playerGameMap = {};

let gameCounter = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateGameId() {
  gameCounter += 1;
  return `game_${gameCounter}_${Math.random().toString(16).slice(2, 8)}`;
}

function findClosestMatch() {
  if (lobbyQueue.length < 2) return null;

  let bestPair = null;
  let bestDiff = Infinity;

  for (let i = 0; i < lobbyQueue.length; i++) {
    for (let j = i + 1; j < lobbyQueue.length; j++) {
      const diff = Math.abs(lobbyQueue[i].elo - lobbyQueue[j].elo);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestPair = [i, j];
      }
    }
  }

  if (!bestPair) return null;

  // Remove from queue (higher index first to avoid shifting issues)
  const [iA, iB] = bestPair;
  const playerB = lobbyQueue.splice(iB, 1)[0];
  const playerA = lobbyQueue.splice(iA, 1)[0];
  return [playerA, playerB];
}

function colorOfSocket(game, socketId) {
  if (game.white.socketId === socketId) return "white";
  if (game.black.socketId === socketId) return "black";
  return null;
}

function opponentColor(color) {
  return color === "white" ? "black" : "white";
}

function buildGameOverPayload(chess) {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? "black" : "white";
    return { result: winner, reason: "checkmate" };
  }
  if (chess.isStalemate()) return { result: "draw", reason: "stalemate" };
  if (chess.isThreefoldRepetition()) return { result: "draw", reason: "threefold repetition" };
  if (chess.isInsufficientMaterial()) return { result: "draw", reason: "insufficient material" };
  if (chess.isDraw()) return { result: "draw", reason: "50-move rule" };
  return null;
}

function cleanupGame(gameId) {
  const game = games[gameId];
  if (!game) return;

  // Clear any pending disconnect timers
  for (const timerId of Object.values(game.disconnectTimers)) {
    clearTimeout(timerId);
  }

  // Remove reverse lookups
  if (game.white) delete playerGameMap[game.white.socketId];
  if (game.black) delete playerGameMap[game.black.socketId];

  delete games[gameId];
}

// ---------------------------------------------------------------------------
// Socket.io connection handling
// ---------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ------ Lobby ----------------------------------------------------------

  socket.on("join-lobby", ({ username, elo }) => {
    // Prevent duplicate entries
    const existing = lobbyQueue.findIndex((p) => p.socketId === socket.id);
    if (existing !== -1) lobbyQueue.splice(existing, 1);

    lobbyQueue.push({ socketId: socket.id, username, elo: Number(elo) || 1200 });
    console.log(`[lobby] ${username} (${elo}) queued — ${lobbyQueue.length} waiting`);

    const pair = findClosestMatch();
    if (!pair) return;

    const [playerA, playerB] = pair;
    const gameId = generateGameId();

    const chess = new Chess();

    games[gameId] = {
      chess,
      white: { socketId: playerA.socketId, username: playerA.username, elo: playerA.elo },
      black: { socketId: playerB.socketId, username: playerB.username, elo: playerB.elo },
      drawOffer: null,
      disconnectTimers: {},
    };

    playerGameMap[playerA.socketId] = gameId;
    playerGameMap[playerB.socketId] = gameId;

    // Both sockets join the room
    const whiteSocket = io.sockets.sockets.get(playerA.socketId);
    const blackSocket = io.sockets.sockets.get(playerB.socketId);
    if (whiteSocket) whiteSocket.join(gameId);
    if (blackSocket) blackSocket.join(gameId);

    // Notify both players
    io.to(playerA.socketId).emit("match-found", {
      gameId,
      opponent: { username: playerB.username, elo: playerB.elo },
      playerColor: "white",
    });

    io.to(playerB.socketId).emit("match-found", {
      gameId,
      opponent: { username: playerA.username, elo: playerA.elo },
      playerColor: "black",
    });

    console.log(`[match] ${gameId}: ${playerA.username} (W) vs ${playerB.username} (B)`);
  });

  // ------ Moves ----------------------------------------------------------

  socket.on("make-move", ({ gameId, move }) => {
    const game = games[gameId];
    if (!game) return socket.emit("error", { message: "Game not found" });

    const color = colorOfSocket(game, socket.id);
    if (!color) return socket.emit("error", { message: "You are not in this game" });

    // Verify it is this player's turn
    const expectedColor = game.chess.turn() === "w" ? "white" : "black";
    if (color !== expectedColor) {
      return socket.emit("error", { message: "Not your turn" });
    }

    // Attempt the move via chess.js (validates legality)
    let result;
    try {
      result = game.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || undefined,
      });
    } catch {
      return socket.emit("error", { message: "Illegal move" });
    }

    if (!result) {
      return socket.emit("error", { message: "Illegal move" });
    }

    // Clear any pending draw offer on a move
    game.drawOffer = null;

    const payload = {
      from: result.from,
      to: result.to,
      promotion: result.promotion || null,
      fen: game.chess.fen(),
      san: result.san,
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isDraw: game.chess.isDraw(),
      turn: game.chess.turn() === "w" ? "white" : "black",
    };

    // Broadcast to everyone in the room (including sender for confirmation)
    io.to(gameId).emit("move-made", payload);

    // Check for game over
    if (game.chess.isGameOver()) {
      const gameOver = buildGameOverPayload(game.chess);
      io.to(gameId).emit("game-over", gameOver);
      cleanupGame(gameId);
    }
  });

  // ------ Resign ---------------------------------------------------------

  socket.on("resign", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    io.to(gameId).emit("game-over", {
      result: opponentColor(color),
      reason: "resignation",
    });

    cleanupGame(gameId);
  });

  // ------ Draw offers ----------------------------------------------------

  socket.on("offer-draw", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    game.drawOffer = color;
    const opponent = game[opponentColor(color)];
    io.to(opponent.socketId).emit("draw-offered", { from: color });
  });

  socket.on("accept-draw", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    // Only accept if the other side actually offered
    if (game.drawOffer !== opponentColor(color)) return;

    io.to(gameId).emit("game-over", { result: "draw", reason: "agreement" });
    cleanupGame(gameId);
  });

  socket.on("decline-draw", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    game.drawOffer = null;
    const opponent = game[opponentColor(color)];
    io.to(opponent.socketId).emit("draw-declined");
  });

  // ------ Chat -----------------------------------------------------------

  socket.on("game-chat", ({ gameId, message }) => {
    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    const username = game[color].username;

    // Broadcast to the room (opponent and sender)
    io.to(gameId).emit("chat-message", {
      username,
      message,
      timestamp: Date.now(),
    });
  });

  // ------ Leave game -----------------------------------------------------

  socket.on("leave-game", ({ gameId }) => {
    const game = games[gameId];
    if (!game) return;

    socket.leave(gameId);
    const color = colorOfSocket(game, socket.id);
    if (color) delete playerGameMap[socket.id];
  });

  // ------ Disconnect / Reconnect -----------------------------------------

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);

    // Remove from lobby queue
    const lobbyIdx = lobbyQueue.findIndex((p) => p.socketId === socket.id);
    if (lobbyIdx !== -1) lobbyQueue.splice(lobbyIdx, 1);

    // Handle in-game disconnection
    const gameId = playerGameMap[socket.id];
    if (!gameId) return;

    const game = games[gameId];
    if (!game) return;

    const color = colorOfSocket(game, socket.id);
    if (!color) return;

    const opColor = opponentColor(color);

    // Notify opponent
    io.to(game[opColor].socketId).emit("opponent-disconnected");

    // Start 30-second abandonment timer
    game.disconnectTimers[color] = setTimeout(() => {
      // If still disconnected after 30s, opponent wins
      if (!games[gameId]) return; // game may have been cleaned up already

      io.to(gameId).emit("game-over", {
        result: opColor,
        reason: "abandonment",
      });

      cleanupGame(gameId);
    }, 30_000);
  });

  // Reconnection: client re-emits "reconnect-game" after reconnecting
  socket.on("reconnect-game", ({ gameId, username }) => {
    const game = games[gameId];
    if (!game) return socket.emit("error", { message: "Game not found" });

    // Identify which color this player is by username
    let color = null;
    if (game.white.username === username) color = "white";
    else if (game.black.username === username) color = "black";

    if (!color) return socket.emit("error", { message: "You are not in this game" });

    // Update socket mapping
    const oldSocketId = game[color].socketId;
    delete playerGameMap[oldSocketId];

    game[color].socketId = socket.id;
    playerGameMap[socket.id] = gameId;
    socket.join(gameId);

    // Cancel abandonment timer
    if (game.disconnectTimers[color]) {
      clearTimeout(game.disconnectTimers[color]);
      delete game.disconnectTimers[color];
    }

    // Notify opponent
    const opColor = opponentColor(color);
    io.to(game[opColor].socketId).emit("opponent-reconnected");

    // Send current game state to reconnected player
    socket.emit("game-state", {
      gameId,
      fen: game.chess.fen(),
      turn: game.chess.turn() === "w" ? "white" : "black",
      playerColor: color,
      opponent: {
        username: game[opColor].username,
        elo: game[opColor].elo,
      },
    });
  });
});

// ---------------------------------------------------------------------------
// Health check endpoint
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    games: Object.keys(games).length,
    lobby: lobbyQueue.length,
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Chess server listening on http://localhost:${PORT}`);
});
