var Sharp = require("sharp");
var router = require("express").Router();

async function makeImage(req) {
  const { body: data, user } = req;
  console.log("makeImage", data);

  // Location of existing fulllsize image
  const sourceImagePath = `./uploads/source_${user._id}_${data.filename}`;

  // Intended location for resized image once we've generated it
  const resizedImagePath = `./uploads/puzzle_${user._id}_${data.filename}`;

  img = Sharp(sourceImagePath);

  const { width: origW, height: origH } = data;

  const extractionLeftOffset = Math.ceil((origW / 100) * data.leftOffsetPercentage);
  const extractionTopOffset = Math.ceil((origH / 100) * data.topOffsetPercentage);
  const extractionWidth = data.widthPercentage === 100 ? origW : Math.ceil((origW / 100) * data.widthPercentage);
  const extractionHeight = data.heightPercentage === 100 ? origH : Math.ceil((origH / 100) * data.heightPercentage);

  const opts = {
    left: extractionLeftOffset,
    top: extractionTopOffset,
    width: extractionWidth,
    height: extractionHeight,
  };

  img.extract(opts);

  // Resize the image according to the dimensions requested by the Frontend
  const { resizeWidth, resizeHeight } = data;
  img.resize(resizeWidth, resizeHeight);

  await img.toFile(resizedImagePath + '');
  return resizedImagePath;
}

async function main(req, res) {
  const puzzleImagePath = await makeImage(req);

  res.status(200).send({ puzzleImagePath });
}

router.post("/", main);

module.exports = router;
