const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  wscl99: {
    longURL: "https://www.google.ca",
    userID: "c127w7"
  }
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "123"
  },
  "c127w7": {
    id: "c127w7",
    email: "user2@example.com",
    password: "abc"
  }
};

const generateRandomString = function(length = 6) {
  let randomString = Math.random().toString(36).substr(2, length);
  return randomString;
};

const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(id) {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

app.get('/register', (req, res) => {
  const user = undefined;
  const templateVars = { user: user };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send(`Email or Password cannot be blank`);
  }

  const user = findUserByEmail(email);

  if (user) {
    return res.status(400).send(`User with that email already exists`);
  }

  users[id] = {
    id: id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  const user = undefined;
  const templateVars = { user: user };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let userId in users) {

    if (users[userId].email === email && bcrypt.compareSync(password, users[userId].password)) {
      let id = users[userId].id;
      res.cookie("user_id", id);
      return res.redirect(`/urls`);
    }
  }
  return res.status(403).send(`Error 403`);
});


app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlsForUser(user), user: user};
  res.render("urls_index", templateVars);
  
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.redirect("/login");
  }
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const user = users[req.cookies["user_id"]];

  urlDatabase[shortURL] = { longURL: longURL, userID: user };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.send('You are not logged in');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.send('You are not logged in');
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.id]) {
    res.send("Id does not exist");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(`${longURL}`);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.send('You are not logged in');
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/submit", (req, res) => {
  const longURL = req.body.modifiedLongURL;
  urlDatabase[req.params.shortURL].longURL = longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});