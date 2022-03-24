const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const {
  genStr,
  createUser,
  emailCheck,
  authUser,
  urlsForUser,
} = require("./helpers");

// Using methodOverride for put, delete
// Using cooke-session for session management
app.use(
  bodyParser.urlencoded({ extended: true }),
  methodOverride("_method"),
  cookieSession({
    name: "session",
    keys: ["bd31b612d6287c82396692ce1871d096"],
  })
);
app.set("view engine", "ejs");

const urlDatabase = {};
const userDB = {};

// ===================================================
// Middlewares
// ===================================================
// This stuff is magic - thanks Jamal (@Croisade) for showing this to me!
// Middleware to send a bad request error on permission mismatch
const badPermissionCheck = function(req, res, next) {
  if (!(urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    return res.status(400).send("Bad request");
  }
  return next();
};
// Middleware to redirect non-logged in users to login page where applicable
const missingAuthCheck = function(req, res, next) {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  return next();
};

const alreadyAuthedCheck = function(req, res, next) {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  return next();
};

// ===================================================
// TinyApp URL actions
// ===================================================
app.put("/urls", missingAuthCheck, (req, res) => {
  const curDate = new Date();
  urlDatabase[genStr(6)] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    creationDate: curDate.toLocaleString(),
    visits: 0,
  };
  return res.redirect("/login");
});

app.put("/urls/:shortURL/update", badPermissionCheck, (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.delete("/urls/:shortURL/delete", badPermissionCheck, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// ===================================================
// Gets/navigation
// ===================================================
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// URL Index, middleware redirect if not logged in
app.get("/urls", missingAuthCheck, (req, res) => {
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls: userUrls, user: userDB[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// Create New URL page, middleware redirect if not logged in
app.get("/urls/new", missingAuthCheck, (req, res) => {
  const templateVars = { urls: urlDatabase, user: userDB[req.session.user_id] };
  res.render("urls_new", templateVars);
});

// Edit/analytics page for a given shortURL, middleware redirect if not logged in
app.get("/urls/:shortURL", badPermissionCheck, (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: userDB[req.session.user_id],
    creationDate: urlDatabase[req.params.shortURL].creationDate,
    clicks: urlDatabase[req.params.shortURL].visits
  };
  res.render("urls_show", templateVars);
});

// Redirect to shortURL's longURL - no permission check
app.get("/u/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].visits += 1;
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// ===================================================
// Registration/auth
// ===================================================
// Login page, middleware redirect if logged in
app.get("/login", alreadyAuthedCheck, (req, res) => {
  const templateVars = { user: userDB[req.session.user_id] };
  res.render("user_login", templateVars);
});

// Registration page, middleware redirect if logged in
app.get("/register", alreadyAuthedCheck, (req, res) => {
  const templateVars = { user: userDB[req.session.user_id] };
  res.render("user_register", templateVars);
});

// Login request
app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  // Fast fail checks for missing input or nonexistent email
  if (!inputEmail || !inputPassword) return res.status(403).send("Bad request");
  if (!emailCheck(inputEmail, userDB))
    return res.status(403).send("Email or password incorrect");

  // If authUser returns an id, login checks were successful
  const id = authUser(inputEmail, inputPassword, userDB);
  if (id) {
    req.session.user_id = id;
    return res.redirect("/urls");
  }
  // Default to fail
  res.status(403).send("Email or password incorrect");
});

// Registration request
app.post("/register", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  // Fast fail checks for missing input or email in use
  if (!inputEmail || !inputPassword) return res.status(400).send("Bad request");
  if (emailCheck(inputEmail, userDB))
    return res.status(400).send("Email already exists");

  // createUser will return the newly generated id, use that for cookie
  const id = createUser(inputEmail, bcrypt.hashSync(inputPassword, 10), userDB);
  if (id) {
    req.session.user_id = id;
    return res.redirect("/urls");
  }
  // Default
  res.status(403).send("Registration failed");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// ===================================================
// Server startup/listener
// ===================================================

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
