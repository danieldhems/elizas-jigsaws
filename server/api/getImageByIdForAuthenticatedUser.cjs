var router = require("express").Router();
const { ObjectId } = require("mongodb");
const { dbName } = require("../database.cjs");
const dbClient = require('../database.cjs').default;

async function getImageByIdForAuthenticatedUser(req, res) {
  try {
    if (!req.params.imgId) {
      return res.status(400).send("Expected image ID in query params")
    }

    const db = dbClient.db(dbName);
    const collection = db.collection("images");

    const doc = await collection.findOne({
      _id: new ObjectId(req.params.imgId),
      userId: req.user._id,
    });

    const response = {
      status: "success",
      data: doc
    };

    res.status(200).send(response);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
};

router.get("/:imgId", getImageByIdForAuthenticatedUser);

module.exports.router = router;
