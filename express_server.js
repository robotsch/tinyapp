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

const genStr = function generateRandomString() {
  const rndStr = "0123456789abcdefABCDEF";
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random() * rndStr.length)];
  }
  return result;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  const templateVars = { username: req.cookies["username"] };
  if (templateVars.username) {
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  urlDatabase[genStr()] = req.body.longURL;
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

app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  if (templateVars.username) {
    res.redirect("/urls");
  }
  res.render("user_register", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  };
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
