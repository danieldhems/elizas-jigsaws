var router = require("express").Router();
const assert = require("assert");
const {
  UPLOADS_DIR_INTEGRATION,
  UPLOADS_DIR_PROD,
  PUZZLES_PROD_COLLECTION,
  PUZZLES_INTEGRATION_COLLECTION,
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
  console.log('createPuzzle', req.body)
  try {
    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

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
    res.status(500).send(e);
  }
}

async function createPieces(req, res) {
  try {
    // console.log("createPieces -> pieces", req.body.pieces.toString());
    console.log("createPieces -> puzzleId", req.body.puzzleId);

    const { pieces, puzzleId, integration } = req.body;

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const puzzleUpdateResult = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          pieces: pieces,
          lastSaveDate: new Date(),
        },
      }
    );

    console.log("CreatePieces -> success", puzzleUpdateResult)

    const response = {
      status: "success",
      data: {}
    };

    res.status(200).send(response);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
};

async function updatePiece(req, res) {
  try {
    const { piece, zIndex, integration, options } = req.body;
    console.log('updatePiece -> piece', piece)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const result = await puzzlesCollection.updateOne(
      { id: piece.puzzleId, "pieces.id": piece.id },
      {
        $set: {
          "pieces.$[piece].pageX": piece.pageX,
          "pieces.$[piece].pageY": piece.pageY,
          lastSaveDate: lastSaveDate,
          complete: options?.isComplete,
          zIndex: zIndex,
        },
      },
      {
        arrayFilters: [{ "piece.id": piece.id }],
      }
    );

    console.log("UpdatePiece -> result", result.result)

    const response = {
      status: "success",
      data: {
        lastSaveDate,
        piece,
      }
    };

    res.status(200).send(response);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
}

async function createGroup(req, res) {
  try {
    const { group, zIndex, integration } = req.body;
    console.log('createGroup', group)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const result = await puzzlesCollection.updateOne(
      { id: group.puzzleId },
      {
        $set: {
          lastSaveDate: lastSaveDate,
          zIndex: zIndex,
        },
        $push: {
          groups: group,
        }
      },
    );

    console.log("createGroup result", result.result)

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      },
    };

    res.status(200).send(response);
  } catch (error) {
    console.error(error);
  }
}

async function updateGroup(req, res) {
  var data = req.body.payload;
  console.log("update group request", req.body);

  dbClient.connect().then(async (client, err) => {
    if (!err) {
      db = client.db(dbName);

      const { pieces, groups, puzzles } = getDatabaseCollections(
        db,
        req.body
      );
      let query, update;

      try {
        query = { id: data.id };
        // console.log("updating group", data);
        update = {
          $set: {
            pieces: data.pieces,
            puzzleId: data.puzzleId,
            zIndex: data.zIndex,
            position: data.position,
            isSolved: data.isSolved,
          },
        };

        // console.log("update instruction", update);

        const groupResult = await groups.findOneAndUpdate(query, update, { upsert: true });
        console.log("groupResult", groupResult)

        for (let i = 0, l = data.pieces.length; i < l; i++) {
          await pieces.findOneAndUpdate(
            { id: data.pieces[i].id },
            { $set: { groupId: data.id, isSolved: data.isSolved } }
          )
        }

        const puzzleUpdateQuery = {
          id: data.puzzleId,
        };

        const lastSaveDate = Date.now();

        const puzzleUpdateOp = {
          $set: {
            lastSaveDate,
            complete: data.isPuzzleComplete,
            zIndex: data.zIndex,
          },
        };

        // console.log("Groups: Updating puzzle with query", puzzleUpdateOp);

        await puzzles.updateOne(puzzleUpdateQuery, puzzleUpdateOp);

        const response = {
          status: "success",
          data: { lastSaveDate },
        };

        res.status(200).send(response);
      } catch (e) {
        console.log("group update error", e);
        res.status(500).send(e);
      }
    }
  });
}

async function getPuzzle(req, res) {
  try {
    console.log('getPuzzle', req.body)
    const { puzzleId, integration } = req.body;

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const puzzle = await puzzlesCollection.findOne({ id: puzzleId });

    res.status(200).send(puzzle);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
}


async function getPuzzles(req, res) {
  try {
    console.log("getPuzzles");

    const db = dbClient.db(dbName);

    const { puzzles } = getDatabaseCollections(db, req.body);

    let puzzleList = await puzzles.find().toArray();
    console.log("puzzles", puzzleList);

    res.status(200).send(puzzleList)
  } catch (e) {
    res.status(500).send(e);
  };
};





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
router.post("/getPuzzles", getPuzzles);
router.post("/getPuzzle", getPuzzle);
router.put("/updateTimePlayed/", updateTimePlayed);
router.post("/createPieces", createPieces);
router.post("/createGroup", createGroup);
router.put("/updatePiece", updatePiece);

module.exports.router = router;
