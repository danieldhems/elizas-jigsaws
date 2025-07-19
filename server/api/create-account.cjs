var router = require("express").Router();
var bcrypt = require("bcrypt");

const assert = require("assert");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

async function createAccount(req, res) {
    try {
        dbClient.connect().then(async (client, err) => {
            console.log("conn result", assert.strictEqual(err, undefined))
            if (!err) {
                const { username, password } = req.body;
                console.log("form data", username, password)

                var salt = await bcrypt.genSalt();
                var hashedPassword = await bcrypt.hash(password, salt);
                console.log("secure password", hashedPassword)

                const db = client.db(dbName);
                const users = db.collection("users");

                const result = await users.insertOne({ username, password: hashedPassword });
                console.log("user result", result)
                res.status(200).send({
                    message: "ok"
                })
            }
        });
    } catch (e) {
        console.log("error", e)
    }
}

router.post("/", createAccount);

module.exports = router;