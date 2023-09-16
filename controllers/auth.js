import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  const { username, email, password } = req.body;

  const checkQuery = "SELECT * FROM users WHERE email = ? OR username = ?";
  db.query(checkQuery, [email, username], (err, data) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (data.length > 0) {
      return res.status(409).json("User already exists");
    }

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.log(hashErr);
        return res.status(500).json("Internal Server Error");
      }

      const insertQuery =
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      db.query(insertQuery, [username, email, hashedPassword], (err, data) => {
        if (err) {
          return res.status(500).json(err);
        }
        return res.status(200).json({ message: "User has been created" });
      });
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT * FROM users WHERE username = ? AND email = ? ";

  db.query(q, [req.body.username, req.body.email], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found");

    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!isPasswordCorrect)
      return res.status(404).json("Password or username is wrong");

    const token = jwt.sign({ id: data[0].id }, "jwtkey");
    const { password, ...other } = data[0];

    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(other);
  });
};

export const logout = (req, res) => {
  res
    .clearCookie("access_token", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json("User has been logged out");
};
