var router = require("express").Router();
const { dbName } = require("../database.cjs");
const dbClient = require('../database.cjs').default;

async function getImagesForAuthenticatedUser(req, res) {
  try {
    const db = dbClient(dbName);
    const collection = db.collection("images");

    const docs = await collection.find({ "userId": req.user._id }).toArray();

    const response = {
      status: "success",
      data: docs
    };

    res.status(200).send(response);
  } catch (err) {
    console.log(err);
  }
};

router.get("/", getImagesForAuthenticatedUser);

module.exports.router = router;
