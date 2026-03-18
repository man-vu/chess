# CLAUDE.md — Chess in C++

## Project Overview

A console-based chess game written in C++ (originally April 2017, first-year student project). Two human players take turns entering moves in algebraic notation (e.g. `e2e4`). There is no AI/engine — this is purely a two-player game.

## Repository Structure

```
chess-in-C-plus-plus/
├── Chess.exe              # Pre-built Windows executable (PE32)
├── README.md
├── CLAUDE.md              # This file
└── src/
    ├── Chess.sln          # Visual Studio 2015 solution
    ├── MAIN.cpp           # Entry point
    ├── Game.h/.cpp        # Game loop controller (turn management, move history)
    ├── ChessBoard.h/.cpp  # Board state (8x8 array), piece initialization, ASCII display
    ├── Move.h/.cpp        # Move parsing, validation, and execution
    ├── Position.h/.cpp    # Board coordinates (x,y) with algebraic notation decoding
    ├── Piece.h/.cpp       # Abstract base class for all chess pieces
    ├── ENUM.h             # Enumerations (PieceType, PieceColor, GameStatus, GameResult)
    ├── King.h/.cpp        # King movement (check detection started but incomplete)
    ├── Queen.h/.cpp       # Queen movement (8-direction path checking)
    ├── Rook.h/.cpp        # Rook movement (horizontal/vertical path checking)
    ├── Bishop.h/.cpp      # Bishop movement (diagonal path checking)
    ├── Knight.h/.cpp      # Knight movement (L-shape)
    ├── Pawn.h/.cpp        # Pawn movement (forward, first-move double, diagonal capture)
    └── PiecesSet.h/.cpp   # Unused/commented out — can be ignored
```

## Build System

- **Visual Studio 2015** solution (`src/Chess.sln`). No CMake or Makefile.
- Configurations: Debug/Release × Win32/x64
- To build on Linux with g++:
  ```
  cd src && g++ -std=c++11 -o chess MAIN.cpp Game.cpp ChessBoard.cpp Move.cpp Position.cpp Piece.cpp King.cpp Queen.cpp Rook.cpp Bishop.cpp Knight.cpp Pawn.cpp
  ```
- No external dependencies — uses only the C++ Standard Library.

## Architecture

### Class Hierarchy

```
Piece (abstract base)
├── Pawn
├── Knight
├── Bishop
├── Rook
├── Queen
└── King
```

Standalone classes: `Position`, `Move`, `ChessBoard`, `Game`

### Board Representation

- `ChessBoard::SquaresList[8][8]` — static 2D int array indexed as `[Y][X]`
- Encoding: `PieceColor + PieceType` (e.g. White=8, king=6 → White King=14; Empty=7)
- Piece lists: `whiteList` and `blackList` — vectors of 16 `Piece*` each

### Game Flow

1. `main()` → creates `Game` → calls `Game::AddMove()`
2. `AddMove()` creates `ChessBoard`, initializes pieces, enters game loop
3. Loop: display board → prompt current player → read move → validate → update board → switch turn
4. Move input: 4-char string like `e2e4` decoded to (fromX, fromY, toX, toY)

### Move Validation

- `Move::MovePiece()` parses input, checks basic rules (not empty, correct color, not friendly fire)
- Delegates to each piece's `isValidMove()` for piece-specific movement rules
- Long-range pieces (Bishop, Rook, Queen) include path-obstruction checks
- Uses exception-based control flow with `goto` for retries on invalid moves

## Code Conventions

| Element | Style | Examples |
|---------|-------|---------|
| Classes | PascalCase | `ChessBoard`, `Pawn` |
| Member variables | UPPERCASE | `COLOR`, `TYPE`, `POSITION` |
| Functions | camelCase | `isValidMove()`, `getPosition()` |
| Enums/values | camelCase | `PieceType`, `pawn`, `Empty` |
| Header guards | `_FILENAME_H_` | `#ifndef _PIECE_H_` |
| Braces | K&R (opening on same line) | |
| Indentation | Tabs | |
| Namespaces | `using namespace std;` used throughout | |

## Known Limitations / Incomplete Features

- **No check/checkmate detection** — `King::isChecked()` is a stub
- **No game termination** — the loop never ends (`Game::result` is never updated)
- **No castling, en passant, or pawn promotion** (promotion field exists but unused)
- **No AI/search/evaluation** — human vs human only
- **No tests or CI/CD pipeline**
- **Memory management** — raw `new`/`delete`, no smart pointers or RAII
- **Exception abuse** — throws `int`, `char`, `double`, `float` for control flow
- **Circular includes** — `Move.h` ↔ `Game.h` dependency cycle

## Working with This Codebase

- All source files are in `src/`. The root only has the README, CLAUDE.md, and pre-built exe.
- `PiecesSet.h/.cpp` are dead code — safe to ignore or remove.
- The `Move` class is a `friend` of both `ChessBoard` and `Game`, giving it direct access to their internals.
- `ChessBoard` uses static members extensively as a quasi-singleton pattern.
- When adding features, follow the existing pattern: new piece behaviors go in the respective piece's `isValidMove()`, board-level logic goes in `ChessBoard`, and game-level logic goes in `Game`.
