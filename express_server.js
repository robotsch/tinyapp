const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }), cookies());
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const userDB = {
  abcd: {
    id: "abcd",
    email: "test@gmail.com",
    password: "test",
  },
  default2: {
    id: "defaultUser2ID",
    email: "someEmail2@example.edu",
    password: "least-secure-password-ever",
  },
};

const genStr = function generateRandomString(len) {
  const rndStr = "0123456789abcdefABCDEF";
  let result = "";
  for (let i = 0; i < len; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random() * rndStr.length)];
  }
  return result;
};

const createUser = function createNewUserInDatabase(userEmail, userPassword, database) {
  const newId = genStr(32);
  database[newId] = {
    id: newId,
    email: userEmail,
    password: userPassword,
  };
  return newId;
};

const emailCheck = function checkIfEmailExistsInDatabase(userEmail, database) {
  for(const user in database) {
    if(userEmail === database[user].email) return true
  }
}

const passwordCheck = function checkEmailPasswordMatch(userEmail, userPassword, database) {
  
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

// URL actions

app.post("/urls", (req, res) => {
  urlDatabase[genStr(6)] = req.body.longURL;
  res.send("Ok");
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
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
  const userEmail = req.body.email

});

app.post("/register", (req, res) => {
  const inputEmail = req.body.email
  const inputPassword = req.body.password

  if(!inputEmail || !inputPassword) return res.status(400).send("Bad request")
  if(emailCheck(inputEmail, userDB)) return res.status(400).send("Email already exists")
  
  const id = createUser(inputEmail, inputPassword, userDB)
  
  res.cookie("user_id", id)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Get urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: userDB[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, user: userDB[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDB[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: userDB[req.cookies.user_id],
  };
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
