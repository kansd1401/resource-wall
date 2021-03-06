/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

module.exports = db => {
  router.get("/pins", (req, res) => {
    let query = `
    SELECT p.*,c.name as category_name
    FROM pins p
    JOIN categories c
    ON p.category_id = c.id
    `;
    db.query(query).then(data => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        if (!obj[pin.category_name]) {
          obj[pin.category_name] = {};
        }
        obj[pin.category_name][pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/user", (req, res) => {
    let query = `
    SELECT u.id, u.name,u.name,u.profile_picture
    FROM users u
    WHERE u.id = $1
    `;
    const id = req.session.user_id;
    db.query(query, [id]).then(data => {
      const user = data.rows;
      let obj = {};
      obj["id"] = user[0];
      res.json(obj);
    });
  });

  router.get("/categories", (req, res) => {
    let query = `
    SELECT *
    FROM categories
    `;
    db.query(query).then(data => {
      const categories = data.rows;
      let obj = {};
      for (const category of categories) {
        obj[category.id] = category;
      }
      res.json(obj);
    });
  });

  router.get("/user/boards", (req, res) => {
    let query = `
    SELECT b.*
    FROM users u
    JOIN boards b ON b.owner_id = u.id
    WHERE u.id = $1
    `;
    const arg = [req.session.user_id];
    db.query(query, arg).then(data => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/user/pins", (req, res) => {
    let query = `
    SELECT u.name, u.profile_picture, p.*
    FROM users u
    JOIN pins p ON u.id = p.owner_id
    WHERE u.id = $1
    `;
    const arg = [req.session.user_id];
    db.query(query, arg).then(data => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/pins/:pin_id", (req, res) => {
    let query = `
    SELECT * FROM pins WHERE id = $1
    `;
    const arg = [req.params.pin_id];
    db.query(query, arg).then(data => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/boards/:board_id", (req, res) => {
    let query = `
    SELECT *
    FROM boards
    WHERE boards.id = $1
    `;
    const arg = [req.params.board_id];
    db.query(query, arg).then(data => {
      let pins = data.rows;
      let obj = {};
      for (let pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/boards/pins/:board_id", (req, res) => {
    let query = `
    SELECT *
    FROM boards
    JOIN boards_pins ON board_id = boards.id
    JOIN pins ON pin_id = pins.id
    WHERE boards.id = $1
    `;
    const arg = [req.params.board_id];
    db.query(query, arg).then(data => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });
  router.get("/pins/:pin_id/comments", (req, res) => {
    let query = `
    SELECT c.*,u.name,u.profile_picture as image
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE pin_id = $1
    `;
    db.query(query, [req.params.pin_id]).then(data => {
      const comments = data.rows;
      let obj = {};
      for (const comment of comments) {
        obj[comment.id] = comment;
      }
      res.json(obj);
    });
  });

  router.get("/pins/:pin_id/rating", (req, res) => {
    let query = `
    SELECT AVG(value) avg_rating
    FROM ratings
    WHERE pin_id = $1
    GROUP BY pin_id
    `;
    db.query(query, [req.params.pin_id]).then(data => {
      let obj = {};
      obj["rating"] = data.rows[0];
      res.json(obj);
    });
  });

  router.get("/pins/:pin_id/rating/userRating", (req, res) => {
    let query = `
    SELECT value
    FROM ratings
    WHERE pin_id = $1 AND user_id = $2
    `;
    db.query(query, [req.params.pin_id, req.session.user_id]).then(data => {
      let obj = {};
      if (data.rows.length) {
        obj["rating"] = data.rows[0].value;
        res.json(obj);
      } else {
        res.send(false);
      }
      console.log(obj["rating"]);
    });
  });

  router.get("/:user_id/settings", (req, res) => {
    let query = `
    SELECT *
    FROM users
    WHERE id = $1
    `;
    db.query(query, [req.session.user_id]).then(data => {
      res.send(data.rows[0]);
    });
  });

  router.post("/search", (req, res) => {
    let query = `
    SELECT p.*
    FROM pins p
    FULL JOIN categories c ON p.category_id = c.id
    WHERE p.title LIKE $1
    OR p.description LIKE $1
    OR c.name = $2
    `;
    const keyword = "%" + req.body.keyword + "%";
    db.query(query, [keyword, req.body.keyword])
      .then(data => {
        const pins = data.rows;
        let obj = {};
        for (const pin of pins) {
          obj[pin.id] = pin;
        }
        res.json(obj);
      })
      .catch(err => {
        console.log(err);
      });
  });

  router.post("/register", (req, res) => {
    if (req.body.password !== req.body["password-confirm"]) {
      // ERROR MESSAGE
    }
    let query = `
    SELECT *
    FROM users
    WHERE email = $1
    `;
    db.query(query, [req.body.email]).then(user => {
      if (user.rows.length) {
        // ERROR: USER ALREADY EXISTS
      } else {
        bcrypt.hash(req.body.password, SALT_ROUNDS, (err, hash) => {
          let query = `
          INSERT INTO users (name, email, password)
          VALUES ($1, $2, $3)
          RETURNING id
          `;
          db.query(query, [req.body.name, req.body.email, hash]).then(data => {
            req.session.user_id = data.rows[0].id;
            res.redirect("/");
          });
        });
      }
    });
  });

  router.post("/login", (req, res) => {
    let query = `
    SELECT *
    FROM users
    WHERE email = $1
    `;
    db.query(query, [req.body.email]).then(user => {
      if (user.rows.length) {
        bcrypt.compare(
          req.body.password,
          user.rows[0].password,
          (err, success) => {
            if (success) {
              req.session.user_id = user.rows[0].id;
              res.redirect("/");
            } else {
              res.redirect("https://http.cat/404");
            }
          }
        );
      } else {
        res.redirect("https://http.cat/404");
      }
    });
  });

  router.post("/user/id", (req, res) => {
    if (req.session.user_id) {
      let query = `
      SELECT name,id
      FROM users
      WHERE id = $1
      `;
      const id = req.session.user_id;
      db.query(query, [id]).then(data => {
        let obj = {};
        obj["user"] = data.rows[0];
        res.json(obj);
      });
    } else {
      res.send(false);
    }
  });
  router.post("/categories/new", (req, res) => {
    let query = `
    INSERT INTO categories (name) VALUES ($1)
    RETURNING *
    `;
    db.query(query, [req.body.category_name]).then(() => {
      const pins = data.rows;
      let obj = {};
      for (const pin of pins) {
        obj[pin.id] = pin;
      }
      res.json(obj);
    });
  });

  router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
  });

  router.post("/pins/new", (req, res) => {
    query_cat = `SELECT id from categories WHERE name = $1`;
    db.query(query_cat, [req.body.dropCategories]).then(result => {
      let query;
      let data = [];
      let category_id = result.rows[0].id;
      let pin_id;
      const id = req.session.user_id;
      if (req.body.image) {
        query = `
          INSERT INTO pins
          (owner_id, image, title, description, url,category_id)
          VALUES ($1, $2, $3, $4, $5,$6)
          RETURNING *;
          `;
        data.push(
          id,
          req.body.image,
          req.body.title,
          req.body.description,
          req.body.url,
          category_id
        );
      } else {
        query = `
          INSERT INTO pins
          (owner_id, title, description, url,category_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
          `;
        data.push(
          id,
          req.body.title,
          req.body.description,
          req.body.url,
          category_id
        );
      }
      db.query(query, data).then(() => {
        res.redirect(`/user/pins`);
      });
    });
  });

  router.post("/boards/new", (req, res) => {
    let query;
    let data = [];
    const id = req.session.user_id;
    if (req.body.image) {
      query = `
      INSERT INTO boards
      (owner_id, image, title, description)
      VALUES ($1, $2, $3, $4)
      `;
      data.push(id, req.body.image, req.body.title, req.body.description);
    } else {
      query = `
      INSERT INTO boards
      (owner_id, title, description)
      VALUES ($1, $2, $3)
      `;
      data.push(id, req.body.title, req.body.description);
    }
    db.query(query, data).then(() => {
      res.redirect(`/user`);
    });
  });

  router.post("/boards/addPin", (req, res) => {
    let query;
    let data = [];
    query = `INSERT INTO boards_pins (board_id,pin_id) VALUES ($1,$2);
    `;
    data.push(req.body.board_id, req.body.pin_id);
    db.query(query, data).then(() => {
      console.log("added");
      res.send();
    });
  });

  router.post("/pins/delete", (req, res) => {
    let query;
    let data = [];
    console.log(req.body.pin_id+"yooo")
    query = `
    DELETE FROM pins WHERE id = $1
    `;
    data.push(req.body.pin_id);
    db.query(query, data).then(() => {
      res.redirect("/");
    });
  });

  router.post("/boards/delete/:board_id", (req, res) => {
    let query;
    let data = [];
    query = `
    DELETE FROM boards WHERE id = $1
    `;
    data.push(req.params.board_id);
    db.query(query, data).then(() => {
      res.redirect("/user");
    });
  });

  router.post("/pins/:pin_id/addComment", (req, res) => {
    let query = `
    INSERT INTO comments (user_id, pin_id, text) VALUES
    ($1, $2, $3)
    `;
    const id = req.session.user_id;
    db.query(query, [id, req.body.pin_id, req.body.comment]).then(() => {
      console.log("Inserted comment into db");
      res.status(204);
      res.send();
    });
  });

  router.post("/pins/:pin_id/rating", (req, res) => {
    let query = `
    INSERT INTO ratings (pin_id, user_id, value) VALUES
    ($1, $2, $3)
    `;
    const id = req.session.user_id;
    db.query(query, [req.params.pin_id, id, req.body.rating]).then(() => {
      console.log("Inserted rating into db");
      res.status(204);
      res.send();
    });
  });

  router.post("/update-email", (req, res) => {
    let query = `
    UPDATE users
    SET email = $1
    WHERE id = $2
    `;
    console.log(req.body.email);
    db.query(query, [req.body.email, req.session.user_id]).then(() => {
      console.log("Updated email");
      res.send();
    });
  });

  router.post("/update-name", (req, res) => {
    let query = `
    UPDATE users
    SET name = $1
    WHERE id = $2
    `;

    console.log(req.body);
    db.query(query, [req.body.name, req.session.user_id]).then(() => {
      console.log("Updated name");
      res.send();
    });
  });

  router.post("/update-password", (req, res) => {
    const password = req.body.password;
    bcrypt.hash(req.body.password, SALT_ROUNDS, (err, hash) => {
      let query = `
      UPDATE users
      SET password = $1
      WHERE id = $2
      `;
      db.query(query, [hash, req.session.user_id]).then(() => {
        console.log("Updated password");
        res.send();
      });
    });
  });

  router.post("/update-picture", (req, res) => {
    let query = `
    UPDATE users
    SET profile_picture = $1
    WHERE id = $2
    `;
    db.query(query, [req.body.picture, req.session.user_id]).then(() => {
      console.log("Updated profile picture");
      res.send();
    });
  });

  return router;
};
