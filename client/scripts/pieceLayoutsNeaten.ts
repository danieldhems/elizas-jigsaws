import SingleMovable from "./SingleMovable";
import { EVENT_TYPES, LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE } from "./constants";
import { MovableElement, SideNames } from "./types";
import Utils from "./utils";

// Determine when to start placing pieces on next side
function shouldProceedToNextSide(
  currentSide: SideNames,
  element: MovableElement,
  firstPieceOnNextSide: MovableElement
) {
  // console.log("shouldProceedToNextSide()", currentSide, element, firstPieceOnNextSide)
  let targetBox;

  targetBox = firstPieceOnNextSide
    ? Utils.getStyleBoundingBox(firstPieceOnNextSide)
    : Utils.getStyleBoundingBox(window.Puzzly.SolvingArea.element);

  const box = Utils.getStyleBoundingBox(element);

  switch (currentSide) {
    case SideNames.Top:
      return (
        box.left > targetBox.right ||
        box.right - 20 > targetBox.right
      );
    case SideNames.Right:
      return (
        box.top > targetBox.bottom ||
        box.bottom - 20 > targetBox.bottom
      );
    case SideNames.Bottom:
      return (
        box.right < targetBox.left ||
        box.left + 20 < targetBox.left
      );
    case SideNames.Left:
      return (
        box.bottom < targetBox.top - 50 ||
        box.top + 20 < targetBox.top
      );
  }
}

// Each time we start the next side, determine where the first piece should go
function getPositionForFirstPieceOnNextSide(
  element: MovableElement,
  nextElement: MovableElement | null,
  currentSide: SideNames,
  firstPieceOnNextSideFromPreviousIteration: MovableElement,
) {
  const targetBox = firstPieceOnNextSideFromPreviousIteration
    ? Utils.getStyleBoundingBox(firstPieceOnNextSideFromPreviousIteration)
    : Utils.getStyleBoundingBox(window.Puzzly.SolvingArea.element);

  const box = Utils.getStyleBoundingBox(element);
  const nextElementBox = nextElement
    ? Utils.getStyleBoundingBox(nextElement)
    : null;

  let nextElementWidth = 0;
  let nextElementHeight = 0;
  if (nextElementBox) {
    nextElementWidth = 50;
    nextElementHeight = 50;
  }

  switch (currentSide) {
    case SideNames.Top:
      return {
        x: targetBox.right + 5,
        y: box.bottom + 5,
      };
    case SideNames.Right:
      return {
        x: box.left - nextElementWidth - 5,
        y: targetBox.bottom + 5,
      };
    case SideNames.Bottom:
      return {
        x: targetBox.left - 50 - 5,
        y: box.top - nextElementHeight - 5,
      };
    case SideNames.Left:
      return {
        x: box.right + 5,
        y: targetBox.top - 50 - 5,
      };
  }
}

export default async function arrangePiecesAroundEdge() {
  const sides = [
    SideNames.Top,
    SideNames.Right,
    SideNames.Bottom,
    SideNames.Left,
  ];

  let i = 0;
  let sideIndex = 0;

  let currentSide = sides[sideIndex];

  const firstPiecesOnEachSide = {
    top: null,
    right: null,
    bottom: null,
    left: null,
  } as Record<string, MovableElement | null>;

  const spacing = (50 / 100) * 5;

  const piecesInPlay = Utils.shuffleArray(Utils.getIndividualPiecesOnCanvas());

  let currentX: number = window.Puzzly.SolvingArea.element.offsetLeft;
  let currentY: number = window.Puzzly.SolvingArea.element.offsetTop - 50;
  let verticalSpace = currentY;

  while (i < piecesInPlay.length) {
    const currentPiece = piecesInPlay[i] as MovableElement;
    const pieceData = Utils.getPieceFromElement(currentPiece);

    if (currentSide === "top" && pieceData.type[0] !== 1) {
      // currentY += 20;
    }

    const nextPiece = piecesInPlay[i + 1];

    window
      .move(currentPiece)
      .x(currentX)
      .y(currentY)
      .duration(200)
      .end();

    const pieceInstance = window.Puzzly.getSingleInstanceByIndex(i);
    pieceInstance.setLastPosition();

    if (i === 0) {
      firstPiecesOnEachSide[currentSide] = currentPiece;
    }

    const nextSide = sideIndex < 3 ? sideIndex + 1 : 0;
    const isLastPiece = i === piecesInPlay.length - 1;

    if (
      shouldProceedToNextSide.call(this, currentSide,
        currentPiece,
        firstPiecesOnEachSide[sides[nextSide]] as HTMLDivElement)
    ) {
      // console.log("proceeding to next side", i)
      if (currentSide === SideNames.Bottom) {
        verticalSpace += 50 + spacing;
      }

      const nextPos = getPositionForFirstPieceOnNextSide(
        currentPiece,
        !isLastPiece ? (nextPiece as HTMLDivElement) : null,
        currentSide,
        firstPiecesOnEachSide[sides[nextSide]] as HTMLDivElement,
      );

      sideIndex = nextSide;
      currentSide = sides[nextSide];

      firstPiecesOnEachSide[currentSide] = nextPiece as HTMLDivElement;

      if (nextPos) {
        currentX = nextPos.x;
        currentY = nextPos.y;
      }
    } else {
      const currentPieceBoundingBox = Utils.getStyleBoundingBox(currentPiece);
      const nextPieceBoundingBox = nextPiece
        ? Utils.getStyleBoundingBox(nextPiece as HTMLDivElement)
        : null;

      if (currentSide === SideNames.Top) {
        currentX += currentPieceBoundingBox.right - currentPieceBoundingBox.left;
      } else if (currentSide === SideNames.Right) {
        currentY += currentPieceBoundingBox.bottom - currentPieceBoundingBox.top;
      } else if (currentSide === SideNames.Bottom) {
        if (!isLastPiece && nextPieceBoundingBox) {
          currentX -= currentPieceBoundingBox.right - currentPieceBoundingBox.left;
        }
      } else if (currentSide === SideNames.Left) {
        if (!isLastPiece && nextPieceBoundingBox) {
          currentY -= currentPieceBoundingBox.bottom - currentPieceBoundingBox.top;
        }
      }
    }

    i++;

  }

}
