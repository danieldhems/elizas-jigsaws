var router = require("express").Router();
const assert = require("assert");
const {
  PUZZLES_PROD_COLLECTION,
  PUZZLES_INTEGRATION_COLLECTION,
  IMAGES_INTEGRATION_COLLECTION,
  IMAGES_PROD_COLLECTION,
} = require("../constants.cjs");
const ObjectId = require("mongodb").ObjectId;
const dbClient = require('../database.cjs').default;

const dbName = "puzzly";

const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;

let db;

async function getImages(req, res) {
  try {
    // console.log("createPieces -> pieces", req.body.pieces.toString());
    console.log("getting images for user", req.user);

    // const dbConnection = await dbClient.connect();
    const db = dbClient.db("puzzly");
    const collection = db.collection("images");


    // console.log("query images for user id", req.user._id);

    const whereClause = { "userId": req.user._id };
    // const queryResult = await collection.findOne(whereClause);
    const docs = await collection.find(whereClause).toArray();
    // for await (const doc of docs) {
    //   console.log(doc)
    // }

    console.log("image query result", docs)

    const response = {
      status: "success",
      data: docs
    };

    res.status(200).send(response);
  } catch (err) {
    console.log(err);
  }
};

router.get("/", getImages);

module.exports.router = router;
