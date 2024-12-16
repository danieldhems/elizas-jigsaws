var router = require("express").Router();
const assert = require("assert");
const {
  UPLOADS_DIR_INTEGRATION,
  UPLOADS_DIR_PROD,
  PUZZLES_PROD_COLLECTION,
  PIECES_PROD_COLLECTION,
} = require("../constants.cjs");
const dbClient = require('../database.cjs').default;

const dbName = "puzzly";

const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;

let db;

module.exports.clean = function () {
  dbClient.connect().then((client, err) => {
    const db = client.db(dbName);

    assert.strictEqual(err, undefined);
    const collection = db.collection(collectionName);

    collection.remove({}, function (err, result) {
      if (err) throw new Error(err);
      console.log("DB cleaned");
    });
  });
};

async function createPuzzle(req, res) {
  try {
    const dbClient = await dbClient.connect();
    db = dbClient.db(dbName);

    const data = req.body;
    console.log("Puzzles->Create", req.body)

    const { puzzles } = getDatabaseCollections(db, data);

    // console.log("create puzzle with data", data);
    data.numberOfSolvedPieces = 0;
    data.dateCreated = new Date();
    data.elapsedTime = 0;

    const puzzleDBResponse = await puzzles.insertOne(data);
    // console.log("puzzleDBResponse", puzzleDBResponse.ops[0]);
    // console.log("piecesDBResponse", piecesDBResponse.ops);

    res.status(200).send({
      ...puzzleDBResponse.ops[0],
      ...data,
    });
  } catch (e) {

  }
}

async function getPuzzle(req, res) {
  try {
    const puzzleId = req.body.id;

    const client = await dbClient.connect();
    const db = client.db(dbName);

    const { puzzles } = getDatabaseCollections(db, req.body);

    const puzzleQuery = { id: puzzleId };
    const piecesQuery = { puzzleId: puzzleId };
    const groupsQuery = { puzzleId: puzzleId, isSolved: false };

    // console.log("puzzle query", puzzleQuery);
    console.log("Puzzle->Read: pieces query", piecesQuery);
    // console.log("groups query", groupsQuery);

    const puzzle = await puzzles.findOne(puzzleQuery);
    const piecesResult = await pieces.find(piecesQuery).toArray();
    const groupsResult = await groups.find(groupsQuery).toArray();
    // console.log("puzzle found", puzzle);
    // console.log("pieces found for puzzle", puzzleId, piecesResult);
    console.log("Puzzle->Read: Groups found for puzzle", puzzleId, groupsResult);

    const result = {
      ...puzzle,
      pieces: piecesResult,
    };

    if (groupsResult.length) {
      result.groups = groupsResult;
    }

    res.status(200).send(result);
  } catch (e) {

  }
}


async function getPuzzles(req, res) {
  dbClient
    .connect()
    .then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);

      const { puzzles } = getDatabaseCollections(db, req.body);

      let puzzleList = await puzzles.find().toArray();
      console.log("puzzles", puzzleList);


    })
    .catch((err) => {
      throw new Error(err);
    });
};

async function createPieces(req, res) {
  try {

    const { pieces, puzzleId } = req.body;

    const dbConnection = await dbClient.connect();

    if (assert.strictEqual(dbConnection.error)) throw new Error(dbConnection.error);

    const puzzlesCollection = data.integration
      ? dbConnection.collection(PUZZLES_INTEGRATION_COLLECTION)
      : dbConnection.collection(PUZZLES_PROD_COLLECTION);

    console.log("createPieces", pieces);

    const lastSaveDate = Date.now();

    console.log("Pieces->Create: Updating puzzle", puzzleUpdateOp);

    const puzzleUpdateResult = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          pieces: pieces,
          lastSaveDate: lastSaveDate,
        },
      }
    );

    console.log("Pieces->Create: puzzle update result", puzzleUpdateResult.ops)

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      }
    };

    res.status(200).send(response);
  } catch (e) {
    throw new Error(e);
  }
};

async function updatePiece(req, res) {
  try {
    const { piece, puzzleId } = req.body;

    const dbConnection = await dbClient.connect();

    if (assert.strictEqual(dbConnection.error)) throw new Error(dbConnection.error);

    const puzzlesCollection = data.integration
      ? dbConnection.collection(PUZZLES_INTEGRATION_COLLECTION)
      : dbConnection.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = Date.now();

    const result = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          pieces: "pieces.[id]",
          lastSaveDate: lastSaveDate,
          complete: data.options?.isComplete,
          zIndex,
        },
      }
    );

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      }
    };

    res.status(200).send(response);

  } catch (e) {
    res.status(500).send(e);
  }
}

async function updateTimePlayed(req, res) {
  dbClient.connect().then(async (client, err) => {
    assert.strictEqual(err, undefined);
    db = client.db(dbName);

    const { puzzles } = getDatabaseCollections(db, req.body);

    const { puzzleId, timePlayed } = req.body;

    const query = { id: puzzleId };
    const update = { $inc: { elapsedTime: timePlayed } };

    const result = await puzzles.updateOne(query, update);
    res.status(200).send("ok");
  });
};

// Set API CRUD endpoints
router.post("/createPuzzle", createPuzzle);
router.get("/getPuzzles", getPuzzles);
router.get("/getPuzzle", getPuzzle);
router.put("/updateTimePlayed/", updateTimePlayed);
router.post("/createPieces", createPieces);
router.put("/updatePiece", updatePiece);

module.exports.router = router;
