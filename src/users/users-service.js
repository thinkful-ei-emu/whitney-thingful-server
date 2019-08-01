/* eslint no-useless-escape: 0 */
const xss = require('xss');
const bcrypt = require('bcryptjs');

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be longer than 8 characters';
    }
    if (password.length > 72) {
      return 'Password must not be longer than 72 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with a space';
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character';
    }

  },
  hasUserWithUserName(db, user_name) {
    return db('thingful_users')
      .where({ user_name })
      .first()
      .then(user => !!user);
  },
  insertUser(db, newUser) {
    return db('thingful_users')
      .insert(newUser)
      .returning('*')
      .then(([user]) => user);
  },
  serializeUser(user) {
    return {
      id: user.id,
      full_name: xss(user.full_name),
      user_name: xss(user.user_name),
      nickname: xss(user.nickname),
      date_created: new Date(user.date_created),
    };
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  }
};

module.exports = UsersService;