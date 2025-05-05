var router = require("express").Router();

const assert = require("assert");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

function createAccount(req, res) {
    try {
        dbClient.connect().then(async (client, err) => {
            console.log("conn result", assert.strictEqual(err, undefined))
            if (!err) {
                const { email, password } = req.body;
                console.log("form data", email, password)

                const db = client.db(dbName);
                const users = db.collection("users");

                const result = await users.insertOne({ email, password });
                console.log("user result", result)
            }
        });
    } catch (e) {
        console.log("error", e)
    }
}

router.post("/", createAccount);

module.exports = router;