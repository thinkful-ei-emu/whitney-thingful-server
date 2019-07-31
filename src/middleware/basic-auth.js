const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
  
  const authToken = req.get('Authorization') || '';

  let basicToken;

  if(!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUsername, tokenPassword] = AuthService.parseBasicToken(basicToken);
  console.log('We will search for: ', tokenUsername, 'and password: ', tokenPassword);

  if (!tokenUsername || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  AuthService.getUserWithUserName(
    req.app.get('db'),
    tokenUsername
  )
    .then(user => {
      console.log('DB found: ' + user);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' });
      }
      
      return AuthService.comparePasswords(tokenPassword, user.password)
        .then(passwordsMatch => {
          if(!passwordsMatch) {
            return res.status(401).json({ error: 'Unauthorized request' });
          }
          res.send('ok');
        });
    })
    .catch(next);
}

module.exports= {
  requireAuth,
};