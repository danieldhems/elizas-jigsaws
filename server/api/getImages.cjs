var router = require("express").Router();
const assert = require("assert");
const {
  PUZZLES_PROD_COLLECTION,
  PUZZLES_INTEGRATION_COLLECTION,
  IMAGES_INTEGRATION_COLLECTION,
  IMAGES_PROD_COLLECTION,
} = require("../constants.cjs");
const { ObjectId } = require("mongodb");
const dbClient = require('../database.cjs').default;

const dbName = "puzzly";

const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;

let db;

async function getImages(req, res) {
  try {
    // console.log("createPieces -> pieces", req.body.pieces.toString());
    console.log("getting images for user", req.user);

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const collection = db.collection(IMAGES_PROD_COLLECTION);

    const queryResult = await collection.find(
      { userId: req.user._id },
    ).toArray();

    console.log("get images -> success", queryResult)

    const response = {
      status: "success",
      data: queryResult
    };

    res.status(200).send(response);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
};

router.get("/", getImages);

module.exports.router = router;
