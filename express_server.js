const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const genStr = function generateRandomString() {
  const rndStr = '0123456789abcdefABCDEF'
  let result = ''
  for(let i = 0; i < 6; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random()* rndStr.length)]
  }
  return result
}

app.post("/urls", (req, res) => {
  urlDatabase[genStr()] = req.body.longURL
  console.log(urlDatabase)
  res.send("Ok");         
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls");         
});

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/u/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(urlDatabase[req.params.shortURL])
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});