/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express     = require('express');
const router      = express.Router();
const path        = require('path');
const bcrypt      = require('bcrypt');
const SALT_ROUNDS = 12;

module.exports = (db) => {
  router.get("/pins", (req, res) => {
    let query = `
    SELECT *
    FROM pins;
    `
    db.query(query)
      .then(data => {
        let pins = data.rows
        let obj = {}
        for(let pin of pins){
          obj[pin.id] = pin
        }
        res.json(obj);
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

  router.get("/users/:id", (req, res) => {
    let query = `
    SELECT u.name, u.profile_picture, b.*
    FROM users u
    JOIN boards b on b.owner_id = u.id
    WHERE u.id = $1;
    `
    db.query(query, [req.params.id])
      .then(data => {
        res.json(data.rows);
      });
  });

  router.get("/users/:id/pins", (req, res) => {
    let query = `
    SELECT u.name, u.profile_picture, p.*
    FROM users u
    JOIN pins p ON u.id = p.owner_id
    WHERE u.id = $1;
    `
    db.query(query, [req.params.id])
      .then(data => {
        res.json(data.rows);
      })
  });

  router.get("/pins/new", (req, res) => {
    res.json('Add pin here')
  });

  router.get("/pins/:pin_id", (req, res) => {
    let query = `
    SELECT * FROM pins WHERE id = $1;
    `
    db.query(query, [req.params.pin_id])
      .then(data => {
        res.json(data.rows);
      })
  });

  router.get("/boards/:board_id", (req, res) => {
    let query = `
    SELECT *
    FROM boards
    JOIN boards_pins ON board_id = boards.id
    JOIN pins ON pin_id = pins.id
    WHERE boards.id = $1;
    `
    db.query(query, [req.params.board_id])
      .then(data => {
        res.json(data.rows);
      })
  });

  router.post("/register", (req, res) => {
    if (req.body.password !== req.body['password-confirm']) {
      // ERROR MESSAGE
    }
    // db.users.findOne({
    //   where: {
    //     email: req.body.email
    //   }
    // })
    let query = `
    SELECT *
    FROM users
    WHERE email = $1;
    `
    db.query(query, [req.body.email])
      .then((user) => {
        if (user.rows.length) {
          // ERROR: USER ALREADY EXISTS
        } else {
          // let hashedPassword;
          // bcrypt.hash(req.body.password, SALT_ROUNDS, (err, hash) => {
          //   hashedPassword = hash;
          // })
          let query = `
          INSERT INTO users (name, email, password)
          VALUES ($1, $2, $3);
          `
          db.query(query, [req.body.name, req.body.email, req.body.password])
            .then(() => {
              console.log("USER ADDED TO DATABASE");
              res.redirect("/");
            })
        }
      })
  });

  router.post("/login", (req, res) => {
    let query = `
    SELECT *
    FROM users
    WHERE email = $1 AND password = $2;
    `
    // Figure out how to do this with bcrypt.compare
    db.query(query, [req.body.email, req.body.password])
      .then(() => {
        if (users.rows.length) {
          // Set a cookie
          res.redirect("/");
        } else {
          // ERROR: Invalid username/password
        }
      })
  });

  // router.post("/pin/new", (req, res) => {
  //   let query = `
  //   INSERT INTO pins
  //   (owner_id,image,title,description,url)
  //   VALUES ()
  //   `
  // })

  return router;
};