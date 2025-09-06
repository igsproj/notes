require("dotenv").config();

const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { checkSchema } = require("express-validator");

const { validation, notesGet } = require("./modules/validation.js");

const {
  errorHandler,
  checkAuth,
  onLogin,
  onSignup,
  onLogout,
  onVisitRoot,
  onVisitDashboard,
  onGetNotes,
  onNewNote,
  onUpdateNote,
  onDeleteNote,
} = require("./modules/routes.js");

const app = express();

app.set("view engine", "njk");

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 3000;

process.on("uncaughtException", (err) => {
  console.log("***** uncaughtException *****");
  console.log(err);
});

process.on("unhandledRejection", (reason, p) => {
  console.log("***** unhandledRejection *****");
  console.log(reason);
});

//TODO process.on SIGINT, SIGTERM

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

/***************************************
get
***************************************/
app.get("/", checkAuth, onVisitRoot, errorHandler);

app.get("/dashboard", checkAuth, onVisitDashboard, errorHandler);

app.get("/logout", checkAuth, onLogout, errorHandler);

app.get("/notes", checkAuth, checkSchema(notesGet), validation, onGetNotes, errorHandler);

/***************************************
post
***************************************/
app.post("/notes", checkAuth, onNewNote, errorHandler);

app.post("/login", bodyParser.urlencoded({ extended: false }), onLogin);

app.post("/signup", bodyParser.urlencoded({ extended: false }), onSignup);

/***************************************
put
***************************************/
app.put("/notes", checkAuth, onUpdateNote, errorHandler);

/***************************************
patch
***************************************/
app.patch("/notes", checkAuth, onUpdateNote, errorHandler);

/***************************************
delete
***************************************/
app.delete("/notes", checkAuth, onDeleteNote, errorHandler);

/***************************************
404
***************************************/
app.all("*", (req, res) => {
  res.status(404).send("<h1>404! Page not found</h1>");
});
