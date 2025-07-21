const {
  UPLOADS_DIR_INTEGRATION,
  UPLOADS_DIR_PROD,
} = require("../constants.cjs");

var router = require("express").Router();
var fileUpload = require("express-fileupload");
var Sharp = require("sharp");
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
      const conn = await dbClient.connect();
      const db = conn.db("puzzly");
      const collection = db.collection("images");

      // console.log("upload: req object", req.body);
      //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      let image = req.files["files[]"];

      // The client is sending the request body as FormData
      // so expect boolean values to be sent as strings
      const isIntegration = req.body.integration === 'true';

      const uploadDir = isIntegration
        ? UPLOADS_DIR_INTEGRATION
        : UPLOADS_DIR_PROD;

      //Use the mv() method to place the file in upload directory (i.e. "uploads")
      const savedPath = uploadDir + "source_" + req.user._id + "_" + image.name;
      image.mv(savedPath);

      const img = Sharp(image.data);

      const { width, height } = await img.metadata();

      const insertResult = await collection.insertOne({
        userId: req.user._id,
        path: savedPath,
        createdOn: Date.now(),
      });

      res.send({
        status: true,
        message: "Success",
        data: {
          savedPath,
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
