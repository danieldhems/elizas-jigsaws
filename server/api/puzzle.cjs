var router = require("express").Router();
const ObjectID = require("mongodb").ObjectID;
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

var api = {
  create: function (req, res) {
    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);

      const data = req.body;
      console.log("Puzzles: Create", req.body)

      let isIntegration = false;

      const { puzzles, pieces } = getDatabaseCollections(db, data);

      // console.log("create puzzle with data", data);
      data.numberOfSolvedPieces = 0;
      data.dateCreated = new Date();
      data.elapsedTime = 0;

      const timeStamp = new Date().getMilliseconds();
      const imageNameWithoutExt = data.imageName.split(".")[0];

      const uploadDir = isIntegration
        ? UPLOADS_DIR_INTEGRATION
        : UPLOADS_DIR_PROD;

      // Is the 'data too large' problem here?
      // This will add all the pieces to a single document in the 'puzzles' collection
      const puzzleDBResponse = await puzzles.insertOne(data);
      // console.log("puzzleDBResponse", puzzleDBResponse.ops[0]);
      // console.log("piecesDBResponse", piecesDBResponse.ops);

      res.status(200).send({
        ...puzzleDBResponse.ops[0],
        ...data,
      });
    });
  },
  read: function (req, res) {
    const puzzleId = req.params.id;

    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);

      const { puzzles, pieces, groups } = getDatabaseCollections(db, req.body);

      const puzzleQuery = { _id: new ObjectID(puzzleId) };
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
    });
  },
  update: function (req, res) { },
  destroy: async function (req, res) {
    const args = req.params || req;

    // console.log("Puzzle destroy() called with arg", args.id);
    dbClient.connect().then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);

      const { puzzles, pieces, groups } = getDatabaseCollections(db, args);

      try {
        const { deletedCount: puzzleDeletedCount } = await puzzles.deleteOne({
          _id: new ObjectID(args.id),
        });
        console.log(
          "API: Puzzle -> destroy() Puzzle deletion result",
          puzzleDeletedCount
        );
        const { deletedCount: piecesDeletedCount } = await pieces.deleteMany({
          puzzleId: new ObjectID(args.id),
        });
        console.log(
          "API: Puzzle -> destroy() Pieces deletion result",
          piecesDeletedCount
        );
        const { deletedCount: groupsDeletedCount } = await groups.deleteMany({
          puzzleId: args.id,
        });
        console.log(
          "API: Puzzle -> destroy() Groups deletion result",
          groupsDeletedCount
        );
      } catch (e) {
        console.error("Database cleanup failed", e);
      }
    });
  },
};

api.fetchAll = function (req, res) {
  dbClient
    .connect()
    .then(async (client, err) => {
      assert.strictEqual(err, undefined);
      db = client.db(dbName);

      const { puzzles, pieces } = getDatabaseCollections(db, req.body);

      let puzzleList = await puzzles.find().toArray();
      console.log("puzzles", puzzleList);

      const puzzlesToReturn = [];

      const query = puzzleList.map(async (p) => {
        const piecesResult = await pieces
          .find({ puzzleId: new ObjectID(p._id) })
          .toArray();
        console.log(
          `number of pieces found for puzzle ${p._id}: ${piecesResult.length}`
        );
        const puzzle = {
          ...p,
          pieces: piecesResult,
          percentSolved:
            (piecesResult.filter((piece) => piece.isSolved).length /
              p.selectedNumPieces) *
            100,
        };
        puzzlesToReturn.push(puzzle);
      });

      Promise.all(query).then(() => {
        console.log("collated", puzzlesToReturn);
        res.send(puzzlesToReturn);
      });
    })
    .catch((err) => {
      throw new Error(err);
    });
};

api.removeAll = function (req, res) {
  dbClient.connect().then(async (client, err) => {
    assert.strictEqual(err, undefined);
    db = client.db(dbName);
    let coll;
    if (req.params.coll === "puzzles") {
      coll = db.collection(PUZZLES_PROD_COLLECTION);
    } else if (req.params.coll === "pieces") {
      coll = db.collection(PIECES_PROD_COLLECTION);
    }

    console.info("Deleting all from collection", coll);
    coll.deleteMany({}, function (err, result) {
      if (err) throw new Error(err);
      console.log(result);
      res.status(200).send("ok");
    });
  });
};

api.updateTime = function (req, res) {
  dbClient.connect().then(async (client, err) => {
    assert.strictEqual(err, undefined);
    db = client.db(dbName);

    const { puzzles } = getDatabaseCollections(db, req.body);

    const query = { _id: new ObjectID(req.params.id) };

    const { time, isComplete } = req.body;

    const update = { $inc: { elapsedTime: time } };
    if (isComplete) {
      update["$set"] = { isComplete };
    }

    puzzles.updateOne(query, update, function (err, result) {
      if (err) throw new Error(err);
      res.status(200).send("ok");
    });
  });
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

    // pieces.updateOne({_id: id}, {"$set": {isSolved: false}}, function(err, result){
    // 	if(err) throw new Error(err);
    // 	console.log('Unsolved piece', result)
    // 	res.status(200).send("ok")
    // })
  });
};

module.exports.api = api;

// Set API CRUD endpoints
router.get("/", api.read);
router.get("/fetchAll", api.fetchAll);
router.delete("/removeAll/:coll", api.removeAll);
router.put("/updateTime/:id", api.updateTime);
router.put("/unsolvePiece/:id", api.unsolvePiece);
router.get("/:id", api.read);
router.post("/", api.create);
router.put("/:id", api.update);
router.delete("/:id", api.destroy);

module.exports.router = router;
