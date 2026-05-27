import { MoveClassification } from "@/store/gameStore";

export function getFallbackExplanation(
  moveSan: string,
  classification: MoveClassification,
  _evalScore: number
): string {
  // Friendly, child-friendly strategic explanations (no chess jargon)
  let themeDescription = "";
  
  if (moveSan.startsWith("O-O")) {
    themeDescription = "Wow, you just tucked your King away into a safe little castle, and activated your Rook to join the game! Keeping your King safe early on is one of the best secrets to winning in chess.";
  } else if (moveSan.includes("+")) {
    themeDescription = "Great check! You put the opponent's King under fire, forcing them to stop whatever they were planning and defend their King. This gives you a great chance to take control of the board!";
  } else if (moveSan.includes("x")) {
    const pieceCode = moveSan[0];
    let capturedName = "a piece";
    if (pieceCode === "N") capturedName = "a Knight";
    else if (pieceCode === "B") capturedName = "a Bishop";
    else if (pieceCode === "R") capturedName = "a Rook";
    else if (pieceCode === "Q") capturedName = "the Queen";
    
    themeDescription = `Yum! You captured ${capturedName} and won some material. Remember, every piece you capture weakens the opponent's army and makes your own team stronger!`;
  } else if (moveSan.startsWith("N")) {
    themeDescription = "Your Knight hops forward into the battle! Knights love to control the middle of the board and can jump over other pieces to surprise your opponent.";
  } else if (moveSan.startsWith("B")) {
    themeDescription = "Your Bishop shoots down a long, open diagonal! Bishops are like long-range archers in chess, attacking from far away to pressure the opponent's pieces.";
  } else if (moveSan.startsWith("R")) {
    themeDescription = "Beep beep! Your Rook takes over an open lane. Rooks love wide open lines where they can speed up and down to attack the opponent's back line.";
  } else if (moveSan.startsWith("Q")) {
    themeDescription = "The powerful Queen steps into the action! She is the strongest player on your team, so be careful to keep her guarded while she launches her attack.";
  } else if (moveSan.startsWith("K")) {
    themeDescription = "Your King takes a careful step to escape danger. In chess, keeping your King safe is always your number one priority!";
  } else if (/^[a-h][1-8]/.test(moveSan) || /^[a-h]x/.test(moveSan)) {
    if (moveSan.startsWith("e4") || moveSan.startsWith("d4") || moveSan.startsWith("c4") || moveSan.startsWith("e5") || moveSan.startsWith("d5")) {
      themeDescription = "Excellent center push! Controlling the middle of the board is like owning the playground—it gives your pieces more room to play and restricts the opponent.";
    } else {
      themeDescription = "Nice pawn play! You are moving your pawns forward to build a strong wall that the opponent's pieces cannot break through.";
    }
  } else {
    themeDescription = "A solid, standard move! You are slowly developing your pieces and getting ready to launch a big attack. Good, steady play!";
  }

  // Combine classification title with teacher-style paragraphs
  switch (classification) {
    case "brilliant":
      return `${themeDescription} This was a brilliant, amazing move that sets up a huge winning opportunity for your team!`;
    
    case "great":
      return `${themeDescription} This was an excellent choice that improves your position and puts pressure on your opponent!`;
    
    case "good":
      return `${themeDescription} This is a good, solid move that keeps your play steady and coordinates your pieces nicely.`;
    
    case "inaccuracy":
      return `${themeDescription} Hmm, this move is okay, but it is slightly weak and gives up a little bit of your control on the board.`;
    
    case "mistake":
      return `${themeDescription} Oh! This move leaves an opening or leaves a piece unsafe. Try to scan the board first and ensure your pieces are guarding each other like a team!`;
    
    case "blunder":
      return `${themeDescription} Oops! You accidentally left a piece hanging or walked into a trap. Don't worry, even grandmasters make mistakes! Just take a deep breath and keep your eyes peeled for threats.`;
    
    default:
      return `${themeDescription} Steady, standard play!`;
  }
}

export function getFallbackSummary(
  moveSan: string,
  classification: MoveClassification
): string {
  if (moveSan.startsWith("O-O")) {
    return "Protects your king and gets your rook ready.";
  }
  if (moveSan.includes("+")) {
    return "Attacks the opponent king to force a response.";
  }
  if (moveSan.includes("x")) {
    return "Takes an opponent piece to win material.";
  }
  if (moveSan.startsWith("N")) {
    return "Brings your knight out to control the center.";
  }
  if (moveSan.startsWith("B")) {
    return "Positions your bishop to control long diagonals.";
  }
  if (moveSan.startsWith("R")) {
    return "Moves your rook to control an open file.";
  }
  if (moveSan.startsWith("Q")) {
    return "Brings your queen out to attack active targets.";
  }
  if (moveSan.startsWith("K")) {
    return "Moves your king away from active threats.";
  }
  if (/^[a-h]/.test(moveSan)) {
    return "Pushes a pawn forward to control space and protect lines.";
  }
  return "Makes a solid positional move to coordinate your play.";
}
