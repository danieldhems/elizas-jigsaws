var path = require("path");
var express = require("express");
var session = require("express-session");
var passport = require("passport");
var expressLayouts = require("express-ejs-layouts");
var LocalStrategy = require("passport-local");
var bcrypt = require("bcrypt");
var methodOverride = require("method-override");
var bodyParser = require("body-parser");
var puzzleApi = require("./api/puzzle.cjs");
var puzzleCreatorUpload = require("./api/puzzleCreatorImageUpload.cjs");
var imageUpload = require("./api/imageUpload.cjs");
var createAccount = require("./api/create-account.cjs");
var users = require("./api/users.cjs");
var getImagesForAuthenticatedUser = require("./api/getImagesForAuthenticatedUser.cjs");
var getImageByIdForAuthenticatedUser = require("./api/getImageByIdForAuthenticatedUser.cjs");
var sessionController = require("./api/session.cjs");
var uploadPuzzleSprite = require("./api/uploadPuzzleSprite.cjs");
var makePuzzleImage = require("./api/makePuzzleImage.cjs");
var generatorTest = require("./api/generator-test.cjs");
const MongoDBStore = require("connect-mongodb-session")(session);
const { connUrl } = require("./database.cjs");
const { ObjectId } = require("mongodb");
const dbClient = require('./database.cjs').default;

var app = express();

require("dotenv").config();

app.set("view engine", "ejs");
app.use(expressLayouts);

app.use(
  bodyParser.urlencoded({
    uploadDir: path.join(__dirname, "uploads"),
    keepExtensions: true,
    extended: true,
    limit: "50mb",
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(methodOverride("_method"))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoDBStore({
    uri: connUrl,
    databaseName: "puzzly",
    collection: "sessions",
  }),
  cookie: {},
}));

passport.serializeUser((user, done) => {
  return done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = dbClient.db("puzzly");
    const collection = db.collection("users");

    const user = await collection.findOne({ _id: id });

    if (user) {
      return done(null, user);
    }

    return done(null, false)
  } catch (err) {
    return done(err);
  }
});

app.use(passport.session());

passport.use(new LocalStrategy(async function verify(username, password, next) {
  try {
    const conn = await dbClient.connect();
    const db = conn.db("puzzly");
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        return next(null, user);
      }
    }

    return next(null, false);
  } catch (err) {
    return next(err);
  }
}));

app.use("/uploads", express.static("./uploads"));
app.use("/uploads_integration", express.static("./uploads_integration"));
app.use("/common", express.static("./common"));

// Configure API endpoints
app.use("/api/puzzle", puzzleApi.router);
app.use("/api/upload", puzzleCreatorUpload);
app.use("/api/image-upload", imageUpload);
app.use("/api/users", users);
app.use("/api/getImagesForAuthenticatedUser", getImagesForAuthenticatedUser.router);
app.use("/api/getImageByIdForAuthenticatedUser", getImageByIdForAuthenticatedUser.router);
app.use("/api/create-account", createAccount);
app.use("/api/session", sessionController);
app.use("/api/uploadPuzzleSprite", uploadPuzzleSprite);
app.use("/api/makePuzzleImage", makePuzzleImage);
app.use("/api/generator-test", generatorTest);
app.use("/api/toggleVisibility", require("./api/pieceFiltering.cjs"));

app.post('/login',
  function (req, res, next) {
    passport.authenticate('local', {
      successRedirect: "/",
      failureRedirect: "/login",
      failureMessage: true
    })(req, res, next)
  });

app.delete("/logout", function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }

    res.redirect("/login");
  });
});

function checkAuthorised(req, res, next) {
  if (req.user) {
    next(null, req.user);
  } else {
    res.redirect("/login");
  }
}

app.get("/create-account", function (req, res) {
  res.render("unauth/create-account");
});

app.get("/login", function (req, res) {
  res.render("unauth/login");
});

app.get("/new-image", checkAuthorised, function (req, res) {
  res.render("auth/new-image", { user: req.user });
});

app.get("/new-puzzle", checkAuthorised, async function (req, res) {
  res.render("auth/new-puzzle", { user: req.user });
});

app.get("/puzzle", checkAuthorised, async function (req, res) {
  res.render("auth/puzzle", { user: req.user });
});

app.get("/exp", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/experiment.html"));
});

app.get("/removeAll", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/removeAll.html"));
});

app.get("/unsolvePiece", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/unsolvePiece.html"));
});

app.get("/puzzle-piece", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/puzzle-piece.html"));
});

app.get("/generator", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/generator-test.html"));
});

app.get("/test", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/path-test.html"));
});

app.get("/", checkAuthorised, async function (req, res) {
  const db = dbClient.db("puzzly");
  const collection = db.collection("images");
  const images = await collection.find({ userId: req.user._id }).toArray();
  res.render("auth/home", { user: req.user, images });
});

app.use(
  express.static(process?.ENV?.mode === "production" ? "./dist" : "./client")
);

module.exports = app;
