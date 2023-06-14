require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connectBD = require("./models/config");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const userModal = require("./models/userModel");
const bcrypt = require("bcryptjs");
const auth = require("./middleware/auth");
const path = require("path");

const port = process.env.PORT || 1000;

connectBD();

const staticPath = path.join(__dirname, "./public");

app.use(cookieParser());
app.use(express.static(staticPath));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.get("/", (req, res) => {
  res.render("Login", { message: req.session.logMsg });
});

app.get("/signup", (req, res) => {
  res.render("SignUp", { message: req.session.sigMessage });
});

app.get("/registration", async (req, res) => {
  res.render("registration_form");
});

app.post("/signup", async (req, res) => {
  const newUsername = req.body.username;
  const newPassword = req.body.password;

  const newUser = new userModal({
    username: newUsername,
    password: newPassword,
  });

  try {
    const foundUser = await userModal.find({ username: newUsername });

    if (foundUser.length === 0) {
      const token = await newUser.generateAuthToken();

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000),
        httpOnly: true,
      }); // 60sec

      await newUser
        .save()
        .then(() => {
          // console.log("Successfully added........");
          req.session.sigMessage = "Successfully Signup please login!";
          res.redirect("/signup");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/signup");
        });
    } else {
      req.session.sigMessage = "User Already Exist!";
      res.redirect("/signup");
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

app.listen(port, () => {
  console.log(`we are listening at port number ${port}`);
});
