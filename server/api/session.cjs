var router = require("express").Router();
var bcrypt = require("bcrypt");
const getDatabaseCollections = require("./getDatabaseCollections.cjs").default;
const dbClient = require('../database.cjs').default;

// Database Name
const dbName = "puzzly";

async function login(req, res) {
  try {
    console.log("attempting to log in")
    console.log(req.session)
    // How should I create session?
    console.log("attempt to connect to DB")
    const dbConnection = await dbClient.connect();

    if (!req.session) {
      const { email, password } = req.body;

      const db = dbConnection.db(dbName);
      const users = db.collection("users");

      const result = await users.findOne({ email });
      // console.log("user search result", result)

      if (result.email) {
        const passwordMatch = await bcrypt.compare(password, result.password);
        console.log("password comparison", passwordMatch);

        if (passwordMatch) {
          console.log("login successful, redirecting");
          res.redirect('/');
        } else {
          console.log("login failure: bad credentials");
          res.status(401).send();
        }
      }
    } else {
      console.log("session already established, redirecting")
      res.redirect('/');
    }
  } catch (e) {
    console.log("error", e)
  }
}

function logout(req, res) {
  console.info("Client request: '/logout'");
  req.session.destroy(function (err) {
    if (err) {
      console.log("Failed to log out", e);
    } else {
      res.redirect("/login");
    }
  });
};

router.post("/login", login);
router.get("/logout", logout);

module.exports = router;