var router = require("express").Router();

const assert = require("assert");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

function login(req, res) {
    try {
        if (req.session.loggedIn)

            dbClient.connect().then(async (client, err) => {
                console.log("conn result", assert.strictEqual(err, undefined))
                if (!err) {
                    const { email, password } = req.body;
                    console.log("form data", email, password)

                    const db = client.db(dbName);
                    const users = db.collection("users");

                    const result = await users.findOne({ email, password });
                    console.log("user search result", result)
                    // res.status(200).send({
                    //     message: "ok"
                    // })

                    if (result.email && result.password) {
                        req.session.username = email;
                        req.session.loggedIn = true;
                        res.redirect("/");
                    } else {
                        req.session.username = null;
                        req.session.loggedIn = false;
                    }
                }
            });
    } catch (e) {
        console.log("error", e)
    }
}

router.post("/", login);

module.exports = router;