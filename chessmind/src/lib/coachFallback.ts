import { MoveClassification } from "@/store/gameStore";

export function getFallbackExplanation(
  moveSan: string,
  classification: MoveClassification,
  _evalScore: number
): string {
  // Simple, beginner-friendly descriptors (no chess jargon)
  let themeBullets = "";
  
  if (moveSan.startsWith("O-O")) {
    themeBullets = "• Keeps King safe\n• Activates the Rook";
  } else if (moveSan.includes("+")) {
    themeBullets = "• Checks the opponent King\n• Forces a response";
  } else if (moveSan.includes("x")) {
    const pieceCode = moveSan[0];
    let captured = "a piece";
    if (pieceCode === "N") captured = "a Knight";
    else if (pieceCode === "B") captured = "a Bishop";
    else if (pieceCode === "R") captured = "a Rook";
    else if (pieceCode === "Q") captured = "the Queen";
    else if (pieceCode === "K") captured = "a piece with King";
    
    themeBullets = `• Captures ${captured}\n• Wins material`;
  } else if (moveSan.startsWith("N")) {
    themeBullets = "• Moves Knight forward\n• Controls center squares";
  } else if (moveSan.startsWith("B")) {
    themeBullets = "• Activates Bishop\n• Controls long diagonal path";
  } else if (moveSan.startsWith("R")) {
    themeBullets = "• Moves Rook to open line\n• Controls the lane";
  } else if (moveSan.startsWith("Q")) {
    themeBullets = "• Activates powerful Queen\n• Attacks multiple targets";
  } else if (moveSan.startsWith("K")) {
    themeBullets = "• Safely shifts King\n• Escapes danger";
  } else if (/^[a-h][1-8]/.test(moveSan) || /^[a-h]x/.test(moveSan)) {
    if (moveSan.startsWith("e4") || moveSan.startsWith("d4") || moveSan.startsWith("c4") || moveSan.startsWith("e5") || moveSan.startsWith("d5")) {
      themeBullets = "• Pushes center Pawn\n• Opens up space for pieces";
    } else {
      themeBullets = "• Moves Pawn to defend\n• Solidifies position";
    }
  } else {
    themeBullets = "• Standard developmental move\n• Safe play";
  }

  // Combine classification title with beginner-friendly bullets
  switch (classification) {
    case "brilliant":
      return `✦ AMAZING MOVE\n${themeBullets}\n• Sets up a huge win`;
    
    case "great":
      return `✓ EXCELLENT CHOICE\n${themeBullets}\n• Improves your position`;
    
    case "good":
      return `✓ GOOD MOVE\n${themeBullets}\n• Solid play`;
    
    case "inaccuracy":
      return `?! SLIGHTLY WEAK MOVE\n${themeBullets}\n• Gives up a little control`;
    
    case "mistake":
      return `? MISTAKE\n${themeBullets}\n• Leaves an opening\n• Watch out for counterattacks`;
    
    case "blunder":
      return `?? CRITICAL BLUNDER\n${themeBullets}\n• Hangs a free piece\n• Unsafe position`;
    
    default:
      return `♟ NORMAL MOVE\n${themeBullets}`;
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
    return "Attacks the opponent king to force a defensive move.";
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
