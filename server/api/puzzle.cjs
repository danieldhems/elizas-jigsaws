var router = require("express").Router();
const assert = require("assert");
const { ObjectId } = require("mongodb");
const {
  PUZZLES_PROD_COLLECTION,
  PUZZLES_INTEGRATION_COLLECTION,
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
    const data = req.body;
    const db = dbClient.db(dbName);
    const collection = db.collection("puzzles_dev");

    data.numberOfSolvedPieces = 0;
    data.dateCreated = new Date();
    data.elapsedTime = 0;

    const response = await collection.insertOne({
      userId: req.user._id,
      ...data
    });

    res.status(200).send({
      ...data,
      _id: response.insertedId,
    });
  } catch (e) {
    console.error("createPuzzle error", e)
    res.status(500).send(e);
  }
}

async function createPieces(req, res) {
  try {
    console.log("createPieces -> pieces", req.body.pieces.toString());
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
      { id: piece.puzzleId },
      {
        $set: {
          "pieces.$[elem].pageX": piece.pageX,
          "pieces.$[elem].pageY": piece.pageY,
          "pieces.$[elem].pocketId": piece.pocketId,
          lastSaveDate: lastSaveDate,
          zIndex: zIndex,
        },
      },
      {
        arrayFilters: [{ "elem.id": piece.id }],
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

async function updatePieces(req, res) {
  try {
    const { pieces, puzzleId, zIndex, integration } = req.body;
    console.log('updatePieces -> puzzleId', puzzleId)
    console.log('updatePieces -> pieces', pieces)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const updateResults = pieces.map((piece) => {
      return puzzlesCollection.updateOne(
        { id: puzzleId, "pieces.id": piece.id },
        {
          $set: {
            "pieces.$.pageX": piece.pageX,
            "pieces.$.pageY": piece.pageY,
            "pieces.$.pocketId": piece.pocketId,
          },
        },
      );
    });

    const result = await Promise.all(updateResults);
    console.log("update result", result.result)

    await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          lastSaveDate: lastSaveDate,
          zIndex,
        },
      },
    );

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      }
    };

    res.status(200).send(response);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
}

async function solvePiece(req, res) {
  try {
    const { pieceId, puzzleId, isComplete, integration } = req.body;
    console.log('solvePiece')

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const result = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          "pieces.$[elem].isSolved": true,
          lastSaveDate: lastSaveDate,
          complete: isComplete,
        },
      },
      {
        arrayFilters: [{ "elem.id": pieceId }],
      }
    );

    console.log("solvePiece -> result", result.result)

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      }
    };

    res.status(200).send(response);
  } catch (e) {
    console.log(e)
    res.status(500).send(e);
  }
}

async function solveGroup(req, res) {
  try {
    const { group, puzzleId, isComplete, integration } = req.body;
    console.log('solveGroup -> group', group)
    console.log('solveGroup -> puzzleId', puzzleId)

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
          // Update pieces in group, marking them as solved
          "pieces.$[piece].isSolved": true,
          lastSaveDate: lastSaveDate,
          complete: isComplete,
        },
        $pull: {
          groups: {
            id: group.id,
          },
        }
      },
      {
        arrayFilters: [
          { "piece.id": { "$in": group.pieces.map((piece) => piece.id) } },
        ],
      },
    );

    console.log("solveGroup -> result", result.result)

    const response = {
      status: "success",
      data: {
        lastSaveDate,
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
          // Set group ID for the effected pieces
          "pieces.$[elem].groupId": group.id,
          lastSaveDate: lastSaveDate,
          zIndex: zIndex,
        },
        $push: {
          groups: group,
        }
      },
      {
        arrayFilters: [{ "elem.id": { "$in": group.pieces.map((piece) => piece.id) } }],
      }
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
  try {
    const { group, integration } = req.body;
    console.log('updateGroup', group)

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
          // Set group ID for the effected pieces
          "pieces.$[piece].groupId": group.id,
          "groups.$[group]": group,
          lastSaveDate: lastSaveDate,
          zIndex: group.zIndex,
        },
      },
      {
        arrayFilters: [
          { "piece.id": { "$in": group.pieces.map((piece) => piece.id) } },
          { "group.id": group.id }
        ],
      }
    );

    console.log("updateGroup result", result.result);

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

async function mergeGroups(req, res) {
  try {
    const { sourceGroup, targetGroup, integration } = req.body;
    console.log('mergeGroups', sourceGroup, targetGroup)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const deleteResult = await puzzlesCollection.updateOne(
      { id: sourceGroup.puzzleId },
      {
        $pull: {
          groups: {
            id: sourceGroup.id,
          },
        }
      },
    );

    console.log("deleteGroup result", deleteResult.result);

    const updateResult = await puzzlesCollection.updateOne(
      { id: sourceGroup.puzzleId },
      {
        $push: {
          "groups.$[targetGroup].pieces": {
            $each: sourceGroup.pieces,
          }
        },
      },
      {
        arrayFilters: [
          { "targetGroup.id": targetGroup.id }
        ],
      }
    );

    console.log("updateGroup result", updateResult.result);

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

async function deleteGroup(req, res) {
  try {
    const { groupId, puzzleId, integration } = req.body;
    console.log('deleteGroup', groupId, puzzleId)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const result = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          lastSaveDate: lastSaveDate,
        },
        $pull: {
          groups: {
            id: groupId,
          },
        }
      },
    );

    console.log("deleteGroup result", result.result);

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

async function getPuzzle(req, res) {
  try {
    const { puzzleId } = req.params;

    const db = dbClient.db(dbName);
    const puzzlesCollection = db.collection("puzzles_dev");
    const puzzle = await puzzlesCollection.findOne({
      _id: new ObjectId(puzzleId),
      userId: req.user._id,
    });

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
  try {
    const { timePlayed, puzzleId, integration } = req.body;
    console.log('updateTimePlayed', timePlayed, puzzleId)

    const dbConnection = await dbClient.connect();
    const db = dbConnection.db(dbName);

    const puzzlesCollection = integration
      ? db.collection(PUZZLES_INTEGRATION_COLLECTION)
      : db.collection(PUZZLES_PROD_COLLECTION);

    const lastSaveDate = new Date();

    const result = await puzzlesCollection.updateOne(
      { id: puzzleId },
      {
        $set: {
          elapsedTime: {
            $inc: { timePlayed },
          },
          lastSaveDate: lastSaveDate,
        },
      },
    );

    console.log("updateTimePlayed result", result.result);

    const response = {
      status: "success",
      data: {
        lastSaveDate,
      },
    };

    res.status(200).send(response);
  } catch (e) {
    res.status(500).send(e);
  };
}

// Set API CRUD endpoints
router.post("/createPuzzle", createPuzzle);
router.post("/getPuzzles", getPuzzles);
router.get("/:puzzleId", getPuzzle);
router.post("/createPieces", createPieces);
router.put("/updatePiece", updatePiece);
router.put("/updatePieces", updatePieces);
router.post("/createGroup", createGroup);
router.put("/updateGroup", updateGroup);
router.put("/mergeGroups", mergeGroups);
router.delete("/deleteGroup", deleteGroup);
router.put('/solvePiece', solvePiece);
router.put('/solveGroup', solveGroup);
router.put("/updateTimePlayed", updateTimePlayed);

module.exports.router = router;
