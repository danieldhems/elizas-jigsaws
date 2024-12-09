import { SVG_NAMESPACE } from "./constants";
import jigsawPath from "./jigsawPath";
import { JigsawPieceData, SkeletonPiece } from "./types";

export function getSvg(
    id: string,
    pieces: JigsawPieceData[],
    imagePath: string,
    options: {
        svgWidth: number,
        svgHeight: number,
        imageWidth: number;
        imageHeight: number;
        svgPosition?: {
            x: number;
            y: number;
        },
        shadowOffset: number;
        isGroup?: boolean;
        viewbox: string,
        imagePosition?: {
            x: number;
            y: number;
        },
    }
): string {
    if (pieces.length < 1) return "";

    const {
        svgWidth,
        svgHeight,
        imageWidth,
        imageHeight,
        viewbox,
        imagePosition,
        shadowOffset,
    } = options;

    const imgPosition = {
        x: imagePosition?.x || 0,
        y: imagePosition?.y || 0,
    };

    // TODO Bad name
    const pieceInfo = pieces.map(piece => getAttributesForPiece(piece));

    const clipId = `clip-${id}`;

    let pathElementsForDefs: string = "";
    let useElementsForClip: string = "";
    let useElementsForShadow: string = "";
    let useElementsForStroke: string = "";

    pieceInfo.map((info) => {
        const xPosition = options.isGroup ? info.puzzleX : 0;
        const yPosition = options.isGroup ? info.puzzleY : 0;

        pathElementsForDefs += `<path id="path-${info.shapeId}" d="${info.pathString}"></path>`;
        useElementsForClip += `<use href="#path-${info.shapeId}" x="${xPosition}" y="${yPosition}"></use>`;
        useElementsForShadow += `<use href="#path-${info.shapeId}" x="${xPosition + shadowOffset}" y="${yPosition + shadowOffset}"></use>`
        useElementsForStroke += `<use id="path-${info.shapeId}" href="#path-${info.shapeId}" fill="none" stroke="black" stroke-width="1" x="${xPosition}" y="${yPosition}" pointer-events="visibleFill" data-piece-index="${info.index}"></use>`

    }).join("");

    return `
      <svg xmlns="${SVG_NAMESPACE}" width="${svgWidth}" height="${svgHeight}" viewBox="${viewbox}" class="puzzle-piece-group-svg">
        <defs>
            ${pathElementsForDefs}
        </defs>
        <clipPath id="${clipId}">
            ${useElementsForClip}
        </clipPath>
        ${useElementsForShadow}
        <image 
            class="svg-image" 
            clip-path="url(#${clipId})" 
            href="${imagePath}" 
            width="${imageWidth}" 
            height="${imageHeight}"
            x="-${imgPosition?.x}"
            y="-${imgPosition?.y}"
        />
        ${useElementsForStroke}
      </svg>
    `;
}

export function getAttributesForPiece(
    piece: JigsawPieceData,
    isGroup?: boolean,
) {
    const { index, puzzleX, puzzleY, width, height } = piece;

    const pathStartPosition = {
        x: isGroup ? piece.puzzleX : 0,
        y: isGroup ? piece.puzzleY : 0,
    };

    return {
        index,
        shapeId: `shape-${index}`,
        pathString: getJigsawShapeSvgString(piece, pathStartPosition),
        puzzleX,
        puzzleY,
        width,
        height,
    };
}

/**
 * 
 * @param piece 
 * @param startingPosition 
 * @returns 
 */
export const getJigsawShapeSvgString = (
    piece: SkeletonPiece | JigsawPieceData,
    startingPosition?: {
        x: number;
        y: number;
    }
) => {
    let svgString = "";

    let x = startingPosition?.x || 0;
    let y = startingPosition?.y || 0;

    // TODO: Assuming all pieces are square - might not work for irregular shapes / sizes
    const pieceSize = piece.basePieceSize as number;

    const { connectorSize, connectorDistanceFromCorner } = piece;
    const hasTopPlug = piece.type[0] === 1;
    const hasLeftPlug = piece.type[3] === 1;

    let topBoundary = hasTopPlug ? y + connectorSize : y;
    let leftBoundary = hasLeftPlug ? x + connectorSize : x;

    let topConnector = null,
        rightConnector = null,
        bottomConnector = null,
        leftConnector = null;

    const jigsawShapes = new jigsawPath(pieceSize as number, connectorSize);

    const getRotatedConnector = jigsawShapes.getRotatedConnector;

    svgString += `M ${leftBoundary} ${topBoundary} `;

    if (piece.type[0] === 1) {
        topConnector = getRotatedConnector(jigsawShapes.getPlug(), 0);
    } else if (piece.type[0] === -1) {
        topConnector = getRotatedConnector(jigsawShapes.getSocket(), 0);
    }

    if (topConnector) {
        // left boundary = connector size
        // + connector distance from corner
        svgString += `h ${connectorDistanceFromCorner} `;
        // + connector size
        svgString += `c ${topConnector.cp1.x} ${topConnector.cp1.y}, ${topConnector.cp2.x} ${topConnector.cp2.y}, ${topConnector.dest.x} ${topConnector.dest.y} `;
        // should go to piece size - connector size
        svgString += `h ${connectorDistanceFromCorner} `;
    } else {
        svgString += `h ${pieceSize} `;
    }

    if (piece.type[1] === 1) {
        rightConnector = getRotatedConnector(jigsawShapes.getPlug(), 90);
    } else if (piece.type[1] === -1) {
        rightConnector = getRotatedConnector(jigsawShapes.getSocket(), 90);
    }

    if (rightConnector !== null) {
        svgString += `v ${connectorDistanceFromCorner} `;
        svgString += `c ${rightConnector.cp1.x} ${rightConnector.cp1.y}, ${rightConnector.cp2.x} ${rightConnector.cp2.y}, ${rightConnector.dest.x} ${rightConnector.dest.y} `;
        svgString += `v ${connectorDistanceFromCorner} `;
    } else {
        svgString += `v ${pieceSize} `;
    }

    if (piece.type[2] === 1) {
        bottomConnector = getRotatedConnector(jigsawShapes.getPlug(), 180);
    } else if (piece.type[2] === -1) {
        bottomConnector = getRotatedConnector(jigsawShapes.getSocket(), 180);
    }

    if (bottomConnector) {
        svgString += `h -${connectorDistanceFromCorner} `;
        svgString += `c ${bottomConnector.cp1.x} ${bottomConnector.cp1.y}, ${bottomConnector.cp2.x} ${bottomConnector.cp2.y}, ${bottomConnector.dest.x} ${bottomConnector.dest.y} `;
        svgString += `h -${connectorDistanceFromCorner}`;
    } else {
        svgString += `h -${pieceSize}`;
    }

    if (piece.type[3] === 1) {
        leftConnector = getRotatedConnector(jigsawShapes.getPlug(), 270);
    } else if (piece.type[3] === -1) {
        leftConnector = getRotatedConnector(jigsawShapes.getSocket(), 270);
    }

    if (leftConnector !== null) {
        svgString += `v -${connectorDistanceFromCorner} `;
        svgString += `c ${leftConnector.cp1.x} ${leftConnector.cp1.y}, ${leftConnector.cp2.x} ${leftConnector.cp2.y}, ${leftConnector.dest.x} ${leftConnector.dest.y} `;
    }

    svgString += "z";

    return svgString;
};

// export const getShapeForGroupPerimeter = (pieces: SingleMovable[]): string => {
//     let pathString: string;

//     const lowestIndex = Math.min(...pieces.map(piece => piece.pieceData.index));
//     const firstPiece = pieces.find(piece => piece.pieceData.index === lowestIndex) as SingleMovable;

//     const firstPiecePosition = {
//         y: firstPiece?.pieceData.puzzleY,
//         x: firstPiece?.pieceData.puzzleX,
//     };

//     const firstPieceType = firstPiece.pieceData.type;
//     const firstPieceConnectorSize = firstPiece.pieceData.connectorSize;

//     const startPosition = {
//         y: firstPieceType[0] === 1 ? firstPiecePosition.y : firstPiecePosition.y + firstPieceConnectorSize,
//         x: firstPieceType[3] === 1 ? firstPiecePosition.x : firstPiecePosition.x + firstPieceConnectorSize,
//     };

//     pathString = `M ${startPosition.x} ${startPosition.y}`;

//     pieces.forEach(piece => {
//         const pieceData = piece.pieceData;
//         if (pieceData.type[0] === 1) {

//         }
//     });

//     return pathString;
// }
