var router = require("express").Router();
var bcrypt = require("bcrypt");
const assert = require("assert");
const { randomUUID } = require("crypto");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

function login(req, res) {
    try {
        console.log("attempting to log in")
        console.log(req.session)
        // How should I create session?
        if (!req.session.isLoggedIn) {
            console.log("attempt to connect to DB")
            dbClient.connect().then(async (client, err) => {
                console.log("conn result", assert.strictEqual(err, undefined))
                if (!err) {
                    const { email, password } = req.body;
                    console.log("form data", email, password)

                    const db = client.db(dbName);
                    const users = db.collection("users");

                    const result = await users.findOne({ email });
                    console.log("user search result", result)

                    if (result.email) {
                        const passwordResult = await bcrypt.compare(password, result.password);
                        console.log("password match", passwordResult);
                        req.session.isLoggedIn = true;
                        res.redirect("/");
                    } else {
                        req.session.isLoggedIn = false;
                        req.session.destroy(() => {
                            res.redirect('/login')
                        })
                    }
                }
            });
        } else {
            console.log("session already established, redirecting")
            res.redirect('/')
        }
    } catch (e) {
        console.log("error", e)
    }
}

router.post("/", login);

module.exports = router;