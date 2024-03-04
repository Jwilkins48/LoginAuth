import initializePassport from "./passport-config.js";
import methodOverride from "method-override";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

dotenv.config();

const app = express();
const port = 3000;
const users = [];

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Home page
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

// Login app
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

// Post login
app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Register app
app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

// Gather register info
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch (error) {
    res.redirect("/register");
  }

  console.log(users);
});

// Logout user by changing post method to delete
app.delete("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// Check if user is signed in
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Don't allow logged in users to view login/register page
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return next();
}

app.listen(port, () => console.log(`Server started on port ${port}`));
