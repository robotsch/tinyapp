const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");
const bcrypt = require("bcryptjs");
const {
  genStr,
  createUser,
  emailCheck,
  authUser,
  urlsForUser,
} = require("./helpers");

// app.use(bodyParser.urlencoded({ extended: true }), cookies( {
//   name: 'session',
//   keys: ['bd31b612d6287c82396692ce1871d096']
// }));

app.use(bodyParser.urlencoded({ extended: true }), cookies());
app.set("view engine", "ejs");

const urlDatabase = {};
const userDB = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// URL actions
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  urlDatabase[genStr(6)] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id,
  };
  return res.redirect("/login");
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (!(urlDatabase[req.params.shortURL].userID === req.cookies.user_id)) {
    return res.status(400).send("Bad request");
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!(urlDatabase[req.params.shortURL].userID === req.cookies.user_id)) {
    return res.status(400).send("Bad request");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Get urls
app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const userUrls = urlsForUser(req.cookies.user_id, urlDatabase);
  const templateVars = { urls: userUrls, user: userDB[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// Change this to disallow non-logged in users
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  const templateVars = { urls: urlDatabase, user: userDB[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!(urlDatabase[req.params.shortURL].userID === req.cookies.user_id)) {
    return res.status(400).send("Bad request");
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: userDB[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// Registration/auth
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect("/urls");
  }
  const templateVars = { user: userDB[req.cookies.user_id] };
  res.render("user_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: userDB[req.cookies.user_id] };
  if (templateVars.user) {
    res.redirect("/urls");
  }
  res.render("user_register", templateVars);
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  // Fast fail checks for missing input or nonexistent email
  // TODO: Can I make this status code stuff DRY?
  if (!inputEmail || !inputPassword) return res.status(403).send("Bad request");
  if (!emailCheck(inputEmail, userDB))
    return res.status(403).send("Email or password incorrect");

  // If authUser returns an id, login checks were successful
  const id = authUser(inputEmail, inputPassword, userDB);
  if (id) {
    res.cookie("user_id", id);
    return res.redirect("/urls");
  }
  res.status(403).send("Email or password incorrect");
});

app.post("/register", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;

  // Fast fail checks for missing input or email in use
  if (!inputEmail || !inputPassword) return res.status(400).send("Bad request");
  if (emailCheck(inputEmail, userDB))
    return res.status(400).send("Email already exists");

  // createUser will return the newly generated id, use that for cookie
  const id = createUser(inputEmail, bcrypt.hashSync(inputPassword, 10), userDB);

  res.cookie("user_id", id);
  // req.session.user_id = id
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// const userId = req.cookies.userId
// const userId = req.session.userId

// req.session.user_id
// res.cookie('user_id', user_id)
// req.session = null
