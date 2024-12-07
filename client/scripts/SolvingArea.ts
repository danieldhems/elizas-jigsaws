import GroupMovable from "./GroupMovable";
import SingleMovable from "./SingleMovable";
import { ELEMENT_IDS, SHADOW_OFFSET, SHADOW_OFFSET_RATIO } from "./constants";
import { getSvg } from "./svg";
import { JigsawPieceData } from "./types";
import Utils from "./utils";

export default class SolvingArea {
    element: HTMLDivElement;
    playBoundary: HTMLDivElement;
    width: number;
    height: number;
    imagePath: string;
    pieces: JigsawPieceData[] = [];

    constructor(boardWidth: number, boardHeight: number, imagePath: string) {
        this.element = document.querySelector(
            `#${ELEMENT_IDS.SOLVED_PUZZLE_AREA}`
        ) as HTMLDivElement;
        this.playBoundary = document.querySelector(
            `#${ELEMENT_IDS.PLAY_BOUNDARY}`
        ) as HTMLDivElement;

        this.width = boardWidth;
        this.height = boardHeight;
        this.imagePath = imagePath;

        this.init();
    }

    init() {
        this.element.style.width = Utils.getPxString(this.width);
        this.element.style.height = Utils.getPxString(this.height);
        this.element.style.top = Utils.getPxString(
            this.playBoundary.offsetHeight / 2 - this.height / 2
        );
        this.element.style.left = Utils.getPxString(
            this.playBoundary.offsetWidth / 2 - this.width / 2
        );

        this.render()
    }

    addPiece(piece: SingleMovable) {
        this.pieces.push(piece.pieceData);
        piece.destroy();
        this.render();
        window.Puzzly.solvedCount += 1;
    }

    addPieces(pieces: SingleMovable[]) {
        pieces.forEach((piece: SingleMovable) => {
            this.pieces.push(piece.pieceData);
            piece.destroy();
        });
        this.render();
        window.Puzzly.solvedCount += 1;
    }

    addGroup(group: GroupMovable) {
        this.pieces.push(...group.piecesInGroup.map((piece: SingleMovable) => piece.pieceData))
        this.render();
        window.Puzzly.solvedCount += group.piecesInGroup.length;
    }

    render() {
        const svgWidth = this.width + SHADOW_OFFSET;
        const svgHeight = this.height + SHADOW_OFFSET;

        const shadowOffset = this.pieces[0]?.width / 100 * SHADOW_OFFSET_RATIO || 0;

        const svgOptions = {
            svgWidth: svgWidth,
            svgHeight: svgHeight,
            imageWidth: this.width,
            imageHeight: this.height,
            viewbox: `0 0 ${svgWidth} ${svgHeight}`,
            isGroup: true,
            shadowOffset,
        }

        const svgElementTemplate = getSvg(
            `svg-${Date.now()}`,
            this.pieces,
            this.imagePath,
            svgOptions,
        );

        const existingSvgElement = this.element.querySelector(".group-svg-container");
        if (existingSvgElement) {
            existingSvgElement.remove();
        }

        const svgContainer = document.createElement("div");
        svgContainer.classList.add("group-svg-container");
        svgContainer.innerHTML = svgElementTemplate;
        this.element.appendChild(svgContainer)
    }
}