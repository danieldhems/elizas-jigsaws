var path = require("path");
var router = require("express").Router();

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const assert = require("assert");
const dbClient = require('../database.cjs').default;
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;

// Database Name
const dbName = "puzzly";

let db, collection;

module.exports.clean = function () {
  dbClient.connect().then((client, err) => {
    assert.strictEqual(err, undefined);
    db = client.db(dbName);
    collection = db.collection(collectionName);

    collection.remove({}, function (err, result) {
      if (err) throw new Error(err);
      console.log("DB cleaned");
    });
  });
};

var api = {
  create: function (req, res) {
    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);

      try {

        db = client.db(dbName);

        const { pieces, puzzles } = getDatabaseCollections(db, req.body);

        const data = req.body.payload;
        const puzzleId = data[0].puzzleId;
        console.log("Pieces->Create: Attempting to save pieces for first time", data);

        const pieceCreationResponse = await pieces.insertMany(data);
        const lastSaveDate = Date.now();

        const puzzleUpdateQuery = {
          _id: new ObjectID(puzzleId),
        };

        const puzzleUpdateOp = {
          $set: {
            lastSaveDate: lastSaveDate,
          },
        };

        console.log("Pieces->Create: Updating puzzle", puzzleUpdateOp);

        const puzzleUpdateResult = await puzzles.updateOne(
          puzzleUpdateQuery,
          puzzleUpdateOp
        );
        console.log("Pieces->Create: puzzle update result", puzzleUpdateResult.ops)

        const response = {
          status: "success",
          data: {
            pieces: pieceCreationResponse.ops,
            lastSaveDate,
          }
        };

        res.status(200).send(response);
      } catch (e) {
        throw new Error(e);
      }
    });
  },
  read: function (req, res) {
    const puzzleId = req.params.id;

    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);
      const puzzles = db.collection(puzzlesCollection);
      const pieces = db.collection(piecesCollection);

      const puzzleQuery = { _id: new ObjectID(puzzleId) };
      const piecesQuery = { puzzleId: new ObjectID(puzzleId) };

      const puzzle = await puzzles.findOne(puzzleQuery);
      const piecesResult = await pieces.find().toArray();

      res.status(200).send(result);
    });
  },
  update: function (req, res) {
    var data = req.body;
    // console.log("Pieces: update request", req.body);

    dbClient.connect().then(async (client, err) => {
      if (!err) {
        db = client.db(dbName);

        const { pieces, puzzles } = getDatabaseCollections(db, req.body);
        let query, update;

        const response = {};

        const lastSaveDate = Date.now();

        let puzzleId;
        let queryObject = {};

        try {
          if (Array.isArray(data.payload)) {
            puzzleId = data.payload[0].puzzleId;
            // console.log("Attempting to update collection of pieces", data);

            response.pieces = [];

            for (let i = 0, l = data.length; i < l; i++) {
              const currentPiece = data[i];
              const { _id, puzzleId, index } = currentPiece;

              // Dynamically setting the query to be either an internal id or a
              // numeric-index-and-puzzleId combination should allow us to reliably create 
              // (upsert) the pieces upon puzzle creation.
              if (_id) {
                queryObject._id = new ObjectID(_id);
              } else {
                queryObject.index = index;
                queryObject.puzzleId = puzzleId;
              }

              // Remove the '_id' field so the piece can be updated
              delete currentPiece._id;

              const pieceUpdate = await pieces.updateOne(
                queryObject,
                {
                  $set: {
                    dateCreated: Date.now(),
                    ...currentPiece,
                  },
                },
                { upsert: true }
              );

              console.log("Piece update result", pieceUpdate.result)

              if (pieceUpdate.upsertedId) {
                currentPiece._id = pieceUpdate.upsertedId._id;
              }

              response.pieces[i] = currentPiece;
            }
          } else {
            const piece = data.payload;
            puzzleId = piece.puzzle;

            queryObject._id = new ObjectID(piece._id);
            // console.log("Single piece update requested with data", data);

            delete piece._id;
            update = {
              $set: {
                ...piece,
              },
            };

            // console.log("Single piece update instruction", update);
            const result = await pieces.updateOne(queryObject, update);
            // console.log("Single piece update result", result.result);
          }

          const puzzleUpdateQuery = {
            _id: new ObjectID(puzzleId),
          };

          const zIndex = Array.isArray(data.payload) ? data.payload[0].zIndex : data.payload.zIndex;

          const puzzleUpdateOp = {
            $set: {
              lastSaveDate: lastSaveDate,
              complete: data.options?.isComplete,
              zIndex,
            },
          };

          // console.log("Pieces: Updating puzzle with instruction", puzzleUpdateOp);

          const result = await puzzles.updateOne(
            puzzleUpdateQuery,
            puzzleUpdateOp
          );
          // console.log("Pieces->Update: puzzle update result", result.modifiedCount)

          response.lastSaveDate = lastSaveDate;

          res.status(200).send(response);
        } catch (e) {
          console.log("e", e);
          res.status(500).send(e);
        }
      }
    });
  },
  destroy: function (req, res) {
    var id = req.params.id;
    db.query("DROP * FROM `agents` WHERE `id` = ?", [id], function (err, rows) {
      if (err) throw new Error(err);
      console.log(rows);
    });
  },
};

api.unsolvePiece = function (req, res) {
  dbClient.connect().then(async (client, err) => {
    assert.strictEqual(err, undefined);
    db = client.db(dbName);
    const id = req.params.id;

    let pieces = db.collection(piecesCollection);
    console.log("attempt unsolve piece", id);

    pieces.findOne({ _id: new ObjectID(id) }, function (err, result, a) {
      if (err) throw new Error(err);
      console.log("found piece", err, result);
      res.status(200).send("ok");
    });
  });
};

// Set API CRUD endpoints
router.get("/:puzzleId", api.read);
router.post("/", api.create);
router.put("/", api.update);

module.exports.router = router;
