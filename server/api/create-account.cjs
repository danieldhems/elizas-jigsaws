var router = require("express").Router();
var bcrypt = require("bcrypt");

const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

async function createAccount(req, res) {
    try {
        dbClient.connect().then(async (client, err) => {
            if (!err) {
                const { username, password, isAdmin } = req.body;
                console.log("form data", username, password, isAdmin)

                var salt = await bcrypt.genSalt();
                var hashedPassword = await bcrypt.hash(password, salt);

                const db = client.db(dbName);
                const users = db.collection("users");

                const result = await users.insertOne({ 
                    username, 
                    password: hashedPassword,
                    isAdmin,
                 });
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