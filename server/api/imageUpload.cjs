const {
  UPLOADS_DIR_INTEGRATION,
  UPLOADS_DIR_PROD,
} = require("../constants.cjs");

var router = require("express").Router();
const { ObjectId } = require("mongodb");
var fileUpload = require("express-fileupload");
var Sharp = require("sharp");
const { dbName } = require("../database.cjs");
const dbClient = require('../database.cjs').default;

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
    try {
      // const conn = await dbClient.connect();
      const db = dbClient.db(dbName);
      const collection = db.collection("images");

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
      const sourcePath = uploadDir + "source_" + req.user._id + "_" + image.name;
      const galleryPath = uploadDir + "gallery_" + req.user._id + "_" + image.name;
      const creatorPath = uploadDir + "creator_" + req.user._id + "_" + image.name;
      image.mv(sourcePath);

      const imgInstance = Sharp(image.data);

      const { width, height } = await imgInstance.metadata();

      // TODO: Image size should be a constant
      await imgInstance
        .resize(200)
        .toFile(galleryPath);

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

      const insertResult = await collection.insertOne({
        userId: req.user._id,
        filename: image.name,
        mimetype: image.mimetype,
        width,
        height,
        sourcePath,
        galleryPath,
        creatorPath,
        createdOn: Date.now(),
      });

      res.send({
        status: true,
        message: "Success",
        data: {
          sourcePath,
          galleryPath,
          creatorPath,
          filename: image.name,
          mimetype: image.mimetype,
          imageId: insertResult.insertedId,
          width,
          height,
        },
      });
    } catch (err) {
      console.log("error", err)
      res.status(500).send(err);
    }
  }
}

router.post("/", upload);

module.exports = router;
