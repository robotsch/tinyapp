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

/* eslint-disable camelcase */
// Disabling camelcase check specifically for user_id
// If Compass wants it set to user_id, so it shall be.

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
  // Edge case check handling for url hacking to nonexistent URL
  if (!urlDatabase[req.params.shortURL]) return res.status(404).send("<h1>URL not found</h1>");
  if (!(urlDatabase[req.params.shortURL].userID === req.session.user_id)) {
    return res.status(403).send("<h1>You do not have permission to view this page.<h1>");
  }
  return next();
};

// Middleware to redirect non-logged in users to login page where applicable
const authCheckError = function(req, res, next) {
  if (!req.session.user_id) {
    return res.status(403).send("<h1>You must be logged in to view this page.<h1>");
  }
  return next();
};
// Middleware to redirect non-logged in users to login page where applicable
const authCheckRedirect = function(req, res, next) {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  return next();
};

// Middleware to redirect already logged in users away from registration and login pages
const alreadyAuthedCheck = function(req, res, next) {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  return next();
};

// ===================================================
// TinyApp URL actions
// ===================================================
// Create new URL and redirect after creation
app.put("/urls", authCheckError, (req, res) => {
  const curDate = new Date();
  const newId = genStr(6);
  // url bug fix, thanks Alex Reyne!
  let safeURL = req.body.longURL;
  if (!safeURL.slice(0, 5).includes('http')) {
    safeURL = `https://${req.body.longURL}`;
  }
  
  urlDatabase[newId] = {
    longURL: safeURL,
    userID: req.session.user_id,
    creationDate: curDate.toLocaleString(),
    visits: 0,
  };
  return res.redirect("/urls/" + newId);
});

// Update URL
app.put("/urls/:shortURL/update", badPermissionCheck, (req, res) => {
  // url bug fix, thanks Alex Reyne!
  let safeURL = req.body.longURL;
  if (!safeURL.slice(0, 5).includes('http')) {
    safeURL = `https://${req.body.longURL}`;
  }
  urlDatabase[req.params.shortURL].longURL = safeURL;
  res.redirect("/urls");
});

// Delete URL
app.delete("/urls/:shortURL/delete", badPermissionCheck, (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// ===================================================
// Gets/navigation
// ===================================================
// Redirect to appropriate destination
app.get("/", (req, res) => {
  if (req.session.user_id) return res.redirect("/urls");
  if (!req.session.user_id) return res.redirect("/login");
});

// URL Index, middleware error msg if not logged in
app.get("/urls", authCheckError, (req, res) => {
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls: userUrls, user: userDB[req.session.user_id] };
  res.render("urls_index", templateVars);
});

// Create New URL page, middleware redirect if not logged in
app.get("/urls/new", authCheckRedirect, (req, res) => {
  const templateVars = { urls: urlDatabase, user: userDB[req.session.user_id] };
  res.render("urls_new", templateVars);
});

// Edit/analytics page for a given shortURL, middleware redirect if not logged in
app.get("/urls/:shortURL", authCheckError, badPermissionCheck, (req, res) => {
  if (!urlDatabase[req.params.shortURL]) return res.status(404).send("<h1>The specified URL does not exist.</h1>");
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
  if (!urlDatabase[req.params.shortURL]) return res.status(404).send("<h1>The specified URL does not exist.</h1>");
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
  if (!inputEmail || !inputPassword) return res.status(403).send("<h1>Bad request</h1>");
  if (!emailCheck(inputEmail, userDB))
    return res.status(403).send("<h1>Email or password incorrect</h1>");

  // If authUser returns an id, login checks were successful
  const id = authUser(inputEmail, inputPassword, userDB);
  if (id) {
    req.session.user_id = id;
    return res.redirect("/urls");
  }
  // Default to fail
  res.status(403).send("<h1>Email or password incorrect</h1>");
});

// Registration request
app.post("/register", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  // Fast fail checks for missing input or email in use
  if (!inputEmail || !inputPassword) return res.status(400).send("<h1>Bad request</h1>");
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

// Nullify login session
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
