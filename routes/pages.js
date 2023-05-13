const express = require("express");
const authController = require("../controllers/auth");
const { authPlugins } = require("mysql2");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get(
  "/homepage",
  authController.checkLoggedin,
  authController.showProfile,
  (req, res) => {
    if (req.user) {
      res.render("homepage", { user: req.user, locals: res.locals });
    } else {
      res.redirect("/");
    }
  }
);

router.get("/game", (req, res) => {
  res.render("game");
});

router.post(
  "/game",
  authController.checkLoggedin,
  authController.recordGameResult
);

module.exports = router;
