import { MovableElement, PieceSectors } from "./types";
import Utils from "./utils";

export default function randomisePiecePositions(pieceSectors: PieceSectors) {
  const sectors = Utils.getSequentialArray(
    0,
    this.selectedNumPieces,
    true
  ) as number[];
  const pieces = Utils.shuffleArray(Utils.getIndividualPiecesOnCanvas());

  let i = 0;
  while (i < pieces.length - 1) {
    const el = pieces[i] as MovableElement;
    const box = Utils.getStyleBoundingBox(el);
    const sector = pieceSectors[sectors[i]];
    const pos = {
      x: Utils.getRandomInt(
        sector.left,
        box.right - sector.left
      ),
      y: Utils.getRandomInt(
        sector.top,
        box.bottom - sector.top
      ),
    };
    window.move(el).x(pos.x).y(pos.y).duration(this.animationDuration).end();
    i++;
  }
}
