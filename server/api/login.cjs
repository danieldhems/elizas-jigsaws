var router = require("express").Router();

const assert = require("assert");
const { randomUUID } = require('crypto');
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

let db, collection;

function login(req, res) {
  if(req.cookies.sessionId) return res.redirect("/");

  dbClient.connect().then(async (client, err) => {
    try {
      if(assert.strictEqual(err, undefined)) return cb(err);
 
      const { email, password } = req.body;
      console.log("user credentials to verify", email, password)
  
      const db = client.db(dbName);
      const users = db.collection("users");
      const userResult = await users.findOne({ email });
  
      const match = await bcrypt.compare(password, userResult.password);
  
      if(match) {
        req.session.isAuth = true;
        const id = randomUUID();
        db.collection("ssessions").insertOne({
          id,
          email,
        });
        res.cookie("sessionId", id);
        res.redirect("/");
      } else {
        req.session.isAuth = false;
        res.redirect("/login");
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }).catch(err => {
    res.status(500).send(err);
  })
}

router.post("/", login);

module.exports = router;