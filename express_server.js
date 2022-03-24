const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }), cookies());
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: 1234 },
  "9sm5xK": { longURL: "http://www.google.com", userID: 1234 },
};

const userDB = {
  abcd: {
    id: "1234",
    email: "test@gmail.com",
    password: "test",
  },
  default2: {
    id: "defaultUser2ID",
    email: "someEmail2@example.edu",
    password: "least-secure-password-ever",
  },
};

const genStr = function(len) {
  const rndStr = "0123456789abcdefABCDEF";
  let result = "";
  for (let i = 0; i < len; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random() * rndStr.length)];
  }
  return result;
};

const createUser = function(userEmail, userPassword, database) {
  const newId = genStr(32);
  database[newId] = {
    id: newId,
    email: userEmail,
    password: userPassword,
  };
  return newId;
};

const emailCheck = function(userEmail, database) {
  for (const user in database) {
    if (userEmail === database[user].email) return true;
  }
};

const authUser = function(userEmail, userPassword, database) {
  for (const user in database) {
    if (
      userEmail === database[user].email &&
      userPassword === database[user].password
    ) {
      return database[user].id;
    }
  }
};

const genUrlList = function(userID, database) {
  console.log(userID, database)
  
}

app.get("/", (req, res) => {
  res.redirect("/urls")
});

// URL actions
app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    urlDatabase[genStr(6)] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id,
    };
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Get urls
app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  genUrlList(req.cookies.user_id, userDB)
  const templateVars = { urls: urlDatabase, user: userDB[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, user: userDB[req.cookies.user_id] };
  if (!req.cookies.user_id) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
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
  const templateVars = { user: userDB[req.cookies.user_id] };
  if (templateVars.user) {
    res.redirect("/urls");
  }
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
  const id = createUser(inputEmail, inputPassword, userDB);

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
