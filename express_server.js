const express = require("express");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const getUserByEmail = require("./helpers");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["key1"],
  maxAge: 24 * 60 * 60 * 1000
}));

/* ------------------------ Databases ------------------------*/

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
    password: "$2a$10$bqqGSpmEfzjV6EzZYhUwv.LpJUP1obJUPJVRIBsH88z2oi5BOmxrK"
  },
  "c127w7": {
    id: "c127w7",
    email: "user2@example.com",
    password: "$2a$10$ktWeDf6w4HxGFTnvyuxWye0rABroOcITYoNagsIL6HZaiHXFCCD0y"
  }
};

/* ------------------------ Helper functions ------------------------*/

// generate a random string to be used as shortURL
const generateRandomString = function(length = 6) {
  let randomString = Math.random().toString(36).substr(2, length);
  return randomString;
};

// return urls for given user
const urlsForUser = function(id) {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

/* ------------------------ GET methods ------------------------*/

/* Home page:
user not logged in -> redirect to /login
user logged in -> redirect to /urls
*/
app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.redirect(`/login`);
  }
  return res.redirect(`/urls`);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Register page: form to register email and password
app.get("/register", (req, res) => {
  const user = undefined;
  const templateVars = { user: user };
  res.render("register", templateVars);
});

// Login page: form to login with email and password
app.get("/login", (req, res) => {
  const user = undefined;
  const templateVars = { user: user };
  res.render("login", templateVars);
});

// Displays all the urls that the user created
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    const templateVars = { urls: {}, user: undefined };
    return res.render("urls_index", templateVars);
  }
  
  const templateVars = { urls: urlsForUser(user.id), user: user};
  return res.render("urls_index", templateVars);
});

// Page where user can create new shortURL
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = { user: user };
  return res.render("urls_new", templateVars);
});

// Page where user can edit shortURL
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.send("This page does not exist");
  }

  if (!user) {
    return res.send("You are not logged in");
  } else if (user.id !== urlDatabase[shortURL].userID) {
    return res.send("You are not authorized to view this page");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: user };
  return res.render("urls_show", templateVars);
});

// Redirects user to external web page
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("This page does not exist");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(`${longURL}`);
});

/* ------------------------ POST methods ------------------------*/

/* Returns error message when email or password is missing, or if user already
exists in database
If no error -> creates new user and redirect to /urls
*/
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send("Email or Password cannot be blank");
  }

  const user = getUserByEmail(email, users);

  if (user) {
    return res.status(400).send("User with that email already exists");
  }

  users[id] = {
    id: id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  req.session.user_id = id;
  return res.redirect("/urls");
});


/* Returns error if email and password does not match database
If no error -> redirect to /urls
*/
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let userId in users) {
    if (users[userId].email === email && bcrypt.compareSync(password, users[userId].password)) {
      let id = users[userId].id;
      req.session.user_id = id;
      return res.redirect(`/urls`);
    }
  }
  return res.status(403).send("Email or Password does not match a user");
});

// Adds new url to database, then redirects to the edit page for that url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const user = users[req.session.user_id];

  if (!user) {
    return res.send(`You are not logged in`);
  }

  urlDatabase[shortURL] = { longURL: longURL, userID: user.id };
  return res.redirect(`/urls/${shortURL}`);
});

// Deletes a url from database, then redirects to updated /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    return res.send('You are not logged in');
  }
  delete urlDatabase[req.params.shortURL];
  return res.redirect(`/urls`);
});

// Loads the page to update url
app.post("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    return res.send('You are not logged in');
  }
  return res.redirect(`/urls/${req.params.shortURL}`);
});

// Submits the change to url
app.post("/urls/:shortURL/submit", (req, res) => {
  const longURL = req.body.modifiedLongURL;
  const userID = req.session.user_id;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: userID };
  
  return res.redirect(`/urls`);
});

// Logs user out, deletes cookies
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
