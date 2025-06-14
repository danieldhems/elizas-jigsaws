const shapeId = `shape-${index}`;
const clipId = `clip-${index}`;

const viewBox = Math.max(width, height);

const svgElementTemplate = `
  <svg xmlns="" width="${viewBox}" height="${viewBox}" viewBox="0 0 ${viewBox} ${viewBox}" class="puzzle-piece-svg">
    <defs>
      <path id="${shapeId}" d="${pathString}"></path>
    </defs>
    <clipPath id="${clipId}">
        <use href="#${shapeId}"></use>
    </clipPath>
    <use href="#${shapeId}" fill="none" stroke="black" stroke-width="1"></use>
    <image class="svg-image" clip-path="url(#${clipId})" href="${puzzleImagePath}" width="${boardWidth}" height="${boardHeight}" x="-${puzzleX}" y="-${puzzleY}" />
  </svg>
`;