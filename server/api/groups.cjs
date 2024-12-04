var path = require("path");
var router = require("express").Router();

const ObjectID = require("mongodb").ObjectID;
const assert = require("assert");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

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
      db = client.db(dbName);
      const { pieces, groups } = getDatabaseCollections(db, req.body);

      const data = req.body;
      // delete data._id;
      // delete data.puzzleId;
      console.log("attempting to create group", data);

      const pieceUpdateResults = [];

      try {
        const groupSaveResult = await groups.insertOne(data);
        console.log("group creation response", groupSaveResult.ops);

        for (let i = 0, l = data.pieces.length; i < l; i++) {
          pieceUpdateResults.push(
            await pieces.findOneAndUpdate(
              { _id: new ObjectID(data.pieces[i]._id) },
              { $set: { groupId: data._id } }
            )
          );
        }

        const response = {
          status: "success",
          data: {
            pieces: pieceUpdateResults.map((result) => result.value),
            _id: groupSaveResult.ops[0]._id,
          },
        };

        res.status(200).send(response);
      } catch (error) {
        console.error(error);
      }
    });
  },
  read: function (req, res) {
    const puzzleId = req.params.id;

    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);
      const { groups } = getDatabaseCollections(db, req.body);

      const query = { puzzleId };
      // console.log("group read query", query);
      const queryResult = await groups.find(query);

      res.status(200).send(queryResult);
    });
  },
  update: function (req, res) {
    var data = req.body;
    // console.log("update group request", req.body);

    dbClient.connect().then(async (client, err) => {
      const response = {};

      if (!err) {
        db = client.db(dbName);

        const { pieces, groups, puzzles } = getDatabaseCollections(
          db,
          req.body
        );
        let query, update;

        const pieceUpdateResults = [];

        try {
          const groupId = new ObjectID(data._id);
          query = { _id: groupId };
          // console.log("updating group", data);
          update = {
            $set: {
              pieces: data.pieces,
              zIndex: data.zIndex,
              position: data.position,
              isSolved: data.isSolved,
            },
          };

          // console.log("update instruction", update);

          try {
            const result = await groups.findOneAndUpdate(query, update);
            // console.log("group update result", result.ops);

            for (let i = 0, l = data.pieces.length; i < l; i++) {
              pieceUpdateResults.push(
                await pieces.findOneAndUpdate(
                  { _id: new ObjectID(data.pieces[i]._id) },
                  { $set: { groupId: data._id, isSolved: data.isSolved } }
                )
              );
            }
          } catch (error) {
            console.error("Failed to update group:", error);
          }

          const puzzleUpdateQuery = {
            _id: new ObjectID(data.puzzleId),
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
            data: {
              pieces: pieceUpdateResults.map((result) => result.value),
              _id: data._id,
            },
          };

          res.status(200).send(response);
        } catch (e) {
          console.log("group update error", e);
          res.status(500).send(e);
        }
      }
    });
  },
  destroy: function (req, res) {
    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);
      const { groups } = getDatabaseCollections(db, req.body);
      const data = req.body;

      const groupId = new ObjectID(data._id);
      const query = { _id: groupId };

      try {
        const result = await groups.deleteOne(query);
        // console.log("Successfully delete group with ID", groupId);
        console.log(result.ops);

        res.status(200).send({});
      } catch (error) {
        // console.log("Failed to delete group with ID", groupId);
        console.log(error);
      }
    });
  },
};

// Set API CRUD endpoints
router.get("/:puzzleId", api.read);
router.post("/", api.create);
router.put("/", api.update);
router.delete("/", api.destroy);

module.exports.router = router;
