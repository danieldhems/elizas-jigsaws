const {
  UPLOADS_DIR_INTEGRATION,
  UPLOADS_DIR_PROD,
} = require("../constants.cjs");

var router = require("express").Router();
var fileUpload = require("express-fileupload");
var Sharp = require("sharp");

router.use(
  fileUpload({
    createParentPath: true,
    debug: true,
  })
);

async function upload(req, res) {
  if (!req.files) {
    res.send({
      status: false,
      message: "No file uploaded",
    });
  } else {
    //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
    let image = req.files["files[]"];
    let vWidth = req.body.viewportWidth ? parseInt(req.body.viewportWidth) : null;
    let vHeight = req.body.viewportHeight ? parseInt(req.body.viewportHeight) : null;

    // The client is sending the request body as FormData
    // so expect boolean values to be sent as strings
    const isIntegration = req.body.integration === 'true';

    const uploadDir = isIntegration
      ? UPLOADS_DIR_INTEGRATION
      : UPLOADS_DIR_PROD;

    //Use the mv() method to place the file in upload directory (i.e. "uploads")
    const creatorPath = uploadDir + `creator_${req.user._id}_${image.name}`;
    const sourcePath = uploadDir + `source_${req.user._id}_${image.name}`;
    const puzzlePath = uploadDir + `puzzle_${req.user._id}_${image.name}`;
    image.mv(sourcePath);

    const imgInstance = Sharp(image.data);

    const { width: actualW, height: actualH } = await imgInstance.metadata();

    const imgW = parseInt(req.body.previewWidth);
    const imgH = parseInt(req.body.previewHeight);

    await imgInstance
      .resize(imgW, imgH, { fit: 'inside' })
      .toFile(puzzlePath);

    if (vWidth && vHeight) {
      let targetWidth = null, targetHeight = null;

      if (vWidth < vHeight) {
        targetWidth = Math.floor(vWidth / 2);
      } else if (vHeight < vWidth) {
        targetHeight = Math.floor(vHeight / 2);
      } else if (vWidth === vHeight) {
        targetHeight = Math.floor(vHeight / 2);
      }

      await imgInstance.resize(targetWidth, targetHeight).toFile(creatorPath);
    }

    res.status(200).send({
      status: true,
      message: "File is uploaded",
      data: {
        creatorPath,
        sourcePath,
        galleryPath,
        puzzlePath,
        filename: image.name,
        mimetype: image.mimetype,
        width: actualW,
        height: actualH,
      },
    });
  }
}

router.post("/", upload);

module.exports = router;
