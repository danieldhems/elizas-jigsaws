var router = require("express").Router();

const assert = require("assert");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

async function get(req, res) {
    try {
        dbClient.connect().then(async (client, err) => {
            console.log("conn result", assert.strictEqual(err, undefined))
            if (!err) {
                const db = client.db(dbName);
                const users = db.collection("users");

                const result = await users.find().toArray();
                console.log("users found", result.ops)
                res.status(200).send({ users: result })
            }
        });
    } catch (e) {
        console.log("error", e)
    }
}

router.get("/", get);

module.exports = router;