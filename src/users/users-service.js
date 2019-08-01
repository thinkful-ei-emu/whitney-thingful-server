const UsersService = {
  validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be longer than 8 characters';
    }
    if (password.length > 72) {
      return 'Password must not be longer than 72 characters';
    }
    if (password.startsWith(' ')) {
      return 'Password must not start with a space';
    }
    if(password.endsWith(' ')) {
      return 'Password must not end with a space';
    }
  },
};

module.exports = UsersService;