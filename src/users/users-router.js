const express = require('express');

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter
  .post('/', jsonBodyParser, (req, res) => {
    const { password } = req.body;

    for (const field of ['full_name', 'user_name', 'password']) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing ${field} in request body` });
      }
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be longer than 8 characters'});
    }
    if (password.length > 72) {
      return res.status(400).json({ error: 'Password must not be longer than 72 characters'});
    }

    res.send('ok');
  });
  

module.exports = usersRouter;