/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();
const path = require('path');

module.exports = (db) => {
  router.get("/", (req, res) => {
    res.sendFile("index.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/register", (req, res) => {
    res.sendFile("register.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/login", (req, res) => {
    res.sendFile("login.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/user", (req, res) => {
    if (req.session.user_id) {
      res.sendFile("userProfile.html", {
        root: path.join(__dirname, "../public")
      });
    } else {
      res.redirect("/login")
    }
  });

  router.get("/user/pins", (req, res) => {
    if (req.session.user_id) {
      res.sendFile("userPins.html", {
        root: path.join(__dirname, "../public")
      });
    } else {
      res.redirect("/login")
    }
  });

  router.get("/user/settings", (req, res) => {
    if (!req.session.user_id) {
      res.redirect("/login")
    }
    res.sendFile("userSettings.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/pins/new", (req, res) => {
    if (req.session.user_id) {
      res.sendFile("newPin.html", {
        root: path.join(__dirname, "../public")
      });
    } else {
      res.redirect("/login")
    }
  });

  router.get("/pins/:id", (req, res) => {
    res.sendFile("viewPin.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/boards/:id", (req, res) => {
    res.sendFile("viewBoard.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/search", (req, res) => {
    res.sendFile("search.html", {
      root: path.join(__dirname, "../public")
    });
  });

  router.get("/*", (req, res) => {
    res.redirect("https://http.cat/404")
  });


  return router;
};
