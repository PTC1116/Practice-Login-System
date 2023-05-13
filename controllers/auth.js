const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

// Connection to the database
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

exports.register = (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;
  // Check if every field is filled
  if (!username || !email || !password || !passwordConfirm) {
    return res.status(400).render("register", {
      message: "Please fill in all fields",
    });
  }
  db.query(
    // Go to the email column in the database
    "SELECT email FROM userAccount WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log(err);
      }
      if (results.length > 0) {
        return res.render("register", {
          message: "That email is already in use",
        });
      } else if (password !== passwordConfirm) {
        return res.render("register", { message: "Passwords do not match" });
      }
      // Hash the password
      let hashedPassword = await bcrypt.hash(password, 8);
      // Store the user email into another "userProfile" table
      db.query(
        "INSERT INTO userProfile SET ?",
        { email: email },
        (err, results) => {
          if (err) {
            console.log(err);
          }
        }
      );
      // Store the hashed password information into the database
      db.query(
        "INSERT INTO userAccount SET ?",
        { username: username, email: email, password: hashedPassword },
        (err, results) => {
          if (err) {
            console.log(err);
          } else {
            return res.status(200).render("registerSuccess");
          }
        }
      );
    }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("login", {
        message: "Please provide an email and password",
      });
    }
    db.query(
      "SELECT * FROM userAccount WHERE email = ?",
      [email],
      async (err, results) => {
        if (
          !results ||
          !(await bcrypt.compare(password, results[0].password))
        ) {
          res.status(401).render("login", {
            message: "Email or Password is incorrect",
          });
        } else {
          const id = results[0].id;
          // Create Token
          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });
          // Set Cookies
          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("jwt", token, cookieOptions);
          res.status(200).redirect("/homepage");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
};

exports.checkLoggedin = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // Check if the user exists in the database
      db.query(
        "SELECT * FROM userAccount WHERE id = ?",
        [decoded.id],
        (error, result) => {
          if (!result) {
            return next();
          }
          req.user = result[0];
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.logout = async (req, res) => {
  // Expire the token
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};

// Show user's homepage profile
exports.showProfile = async (req, res, next) => {
  const email = req.user.email;
  db.query(
    "SELECT * FROM userProfile WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log(err);
        return next();
      } else {
        res.locals.exp = results[0].exp;
        res.locals.bar = results[0].exp / 2.5;
        // Decide rank
        if (results[0].exp <= 100) {
          res.locals.rank = "Novice";
        } else if (results[0].exp <= 250) {
          res.locals.rank = "Adventurer";
        } else {
          res.locals.rank = "Hero";
        }
        return next();
      }
    }
  );
};

// Update user's exp after each round
exports.recordGameResult = async (req, res, next) => {
  const { score: exp } = req.body;
  const email = req.user.email;
  db.query(
    "SELECT * FROM userProfile WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log(err);
        return next();
      } else {
        db.query(
          "UPDATE userprofile SET exp = exp + ?",
          [exp],
          (err, results) => {
            if (err) {
              console.log(err);
              return next();
            } else {
              return next();
            }
          }
        );
      }
    }
  );
};
