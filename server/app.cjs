var path = require("path");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var puzzleApi = require("./api/puzzle.cjs");
var upload = require("./api/upload.cjs");
var createAccount = require("./api/create-account.cjs");
var users = require("./api/users.cjs");
var login = require("./api/login.cjs");
var uploadPuzzleSprite = require("./api/uploadPuzzleSprite.cjs");
var makePuzzleImage = require("./api/makePuzzleImage.cjs");
var generatorTest = require("./api/generator-test.cjs");
const { connUrl, dbName } = require("./database.cjs");
var app = express();
var MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
  uri: connUrl,
  databaseName: dbName,
  collection: "sessions"
});

app.use(session({
  secret: 'elizas secret',
  resave: false,
  saveUninitialized: false,
  store,
}));

app.use("/uploads", express.static("./uploads"));
app.use("/uploads_integration", express.static("./uploads_integration"));
app.use("/common", express.static("./common"));

app.use(
  bodyParser.urlencoded({
    uploadDir: path.join(__dirname, "uploads"),
    keepExtensions: true,
    extended: true,
    limit: "50mb",
  })
);

app.use(bodyParser.json({ limit: "50mb" }));

// Configure API endpoints
app.use("/api/puzzle", puzzleApi.router);
app.use("/api/upload", upload);
app.use("/api/users", users);
app.use("/api/create-account", createAccount);
app.use("/api/login", login);
app.use("/api/uploadPuzzleSprite", uploadPuzzleSprite);
app.use("/api/makePuzzleImage", makePuzzleImage);
app.use("/api/generator-test", generatorTest);
app.use("/api/toggleVisibility", require("./api/pieceFiltering.cjs"));

// Configure base URL for home page
app.get("/", function (req, res) {
  console.info("Client request: '/'");
  if (req.session) {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  } else {
    res.sendFile(path.join(__dirname, "../client/routes/login/login.html"));
  }
});

app.get("/create-account", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/routes/create-account/create-account.html"));
});

app.get("/login", function (req, res) {
  console.info("Client request: '/login'");
  console.log("session data", req.session);
  if (req.session) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "../client/routes/login/login.html"));
  }
});

app.get("/logout", function (req, res) {
  console.info("Client request: '/logout'");
  req.session.destroy(function (err) {
    if (err) {
      console.log("Failed to log out", e);
    } else {
      res.redirect("/login");
    }
  });
})

app.get("/logout", function (req, res) {
  console.log("logout requested")
  req.session.destroy(() => {
    res.redirect("/login");
  })
});

app.get("/gallery", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/puzzleGallery.html"));
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

app.get("/new", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/new.html"));
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

// app.use(
//   "/",
//   express.static(process?.ENV?.mode === "production" ? "./dist" : "./client")
// );

module.exports = app;
