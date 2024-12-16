var router = require("express").Router();

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

    collection.remove({}, function (err) {
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
      const { pieces, groups, puzzles } = getDatabaseCollections(db, req.body.payload);

      const data = req.body.payload;
      console.log("attempting to create group", data);

      try {
        const groupSaveResult = await groups.insertOne(data, { upsert: true });
        console.log("group creation response", groupSaveResult.ops);

        for (let i = 0, l = data.pieces.length; i < l; i++) {
          await pieces.findOneAndUpdate(
            { id: data.pieces[i].id },
            { $set: { groupId: data.id } }
          )
        }

        const lastSaveDate = Date.now();

        const puzzleUpdateQuery = {
          id: data.puzzleId,
        };

        const puzzleUpdateOp = {
          $set: {
            lastSaveDate: lastSaveDate,
          },
        };

        console.log("Groups->Create: Updating puzzle", puzzleUpdateOp);

        await puzzles.updateOne(
          puzzleUpdateQuery,
          puzzleUpdateOp
        );
        // console.log("Groups->Create: Puzzle update result", puzzleUpdateResult.modifiedCount)

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
    });
  },
  update: function (req, res) {
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
  },
  destroy: function (req, res) {
    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);
      const { groups } = getDatabaseCollections(db, req.body);
      const data = req.body;

      const query = { id: data.id };

      try {
        const result = await groups.deleteOne(query);
        // console.log("Successfully delete group with ID", groupId);
        console.log(result.ops);

        const response = {
          status: "success",
        };

        res.status(200).send(response);
      } catch (error) {
        // console.log("Failed to delete group with ID", groupId);
        console.log(error);
      }
    });
  },
};

// Set API CRUD endpoints
router.post("/", api.create);
router.put("/", api.update);
router.delete("/", api.destroy);

module.exports.router = router;
