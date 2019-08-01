/* global supertest expect */
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Users Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/users', () => {
    context('User Validation', () => {
      beforeEach('insert users', () => {
        return helpers.seedUsers(
          db,
          testUsers,
        );
      });

      const requiredFields = ['user_name', 'password', 'full_name'];

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: 'test user_name',
          password: 'test password',
          full_name: 'test full_name',
          nickname: 'test nickname',
        };

        it(`responds with 400 required error when ${field} is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, { error: `Missing ${field} in request body` });
        });
      });
    });

    it('responds 400 "Password must be longer than 8 characters" when password is between 1-7 characters', () => {
      const shortPassword = {
        user_name: 'test user_name',
        password: '1234567',
        full_name: 'test full_name'
      };

      return supertest(app)
        .post('/api/users')
        .send(shortPassword)
        .expect(400, { error: 'Password must be longer than 8 characters'});
    });

    it('responds 400 "Password must be no longer than 72 characters" when password is more than 72 characters', () => {
      const longPassword = {
        user_name: 'test user_name',
        password: '*'.repeat(73),
        full_name: 'test full_name'
      };

      return supertest(app)
        .post('/api/users')
        .send(longPassword)
        .expect(400, { error: 'Password must not be longer than 72 characters'});
    });

    it('responds 400 "Password must not start with a space" when password starts with a space', () => {
      const spacePassword = {
        user_name: 'test user_name',
        password: ' spacepassword',
        full_name: 'test full_name'
      };

      return supertest(app)
        .post('/api/users')
        .send(spacePassword)
        .expect(400, { error: 'Password must not start or end with a space'});
    });

    it('responds 400 "Password mut not end with a space" when password ends with a space', () => {
      const spacePassword = {
        user_name: 'test user_name',
        password: 'spacepassword ',
        full_name: 'test full_name'
      };

      return supertest(app)
        .post('/api/users')
        .send(spacePassword)
        .expect(400, { error: 'Password must not start or end with a space'});
    });

    context('Password complexity check', () => {
      const passwordCheck = ['noupperc4se!', 'NOLOWERC4SE!', 'NoNumber!', 'NoSp3CiaL'];

      passwordCheck.forEach(password => {
        const simplePassword = {
          user_name: 'test user_name',
          password: password,
          full_name: 'test full_name'
        };

        it('responds 400 "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character" when password does not contain those requirements', () => {
          return supertest(app)
            .post('/api/users')
            .send(simplePassword)
            .expect(400, {error: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'});
        });

        context('Inserting users', () => {
          before('insert users', () => {
            return helpers.seedUsers(
              db,
              testUsers,
            );
          });

          it('responds 400 "Username has already been taken" if the username already exists', () => {
            const alreadyExists = {
              user_name: testUser.user_name,
              password: '11AAaa!!',
              full_name: 'test full_name',
            };
      
            return supertest(app)
              .post('/api/users')
              .send(alreadyExists)
              .expect(400, {error: 'Username has already been taken'});
          });
        });

        context('Happy path', () => {
          it('responds 201, serialized user, storing bcrypted password', () => {
            const newUser = {
              user_name: 'test user_name',
              password: '11AAaa!!',
              full_name: 'test full_name',
              nickname: ''
            };

            return supertest(app)
              .post('/api/users')
              .send(newUser)
              .expect(201)
              .expect(res => {
                expect(res.body).to.have.property('id');
                expect(res.body.user_name).to.eql(newUser.user_name);
                expect(res.body.full_name).to.eql(newUser.full_name);
                expect(res.body.nickname).to.eql(newUser.nickname);
                expect(res.body).to.not.have.property('password');
                expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
                const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC'});
                const actualDate = new Date(res.body.date_created).toLocaleString();
                expect(actualDate).to.eql(expectedDate);
              })
              .expect(res => {
                return db('thingful_users')
                  .select('*')
                  .where({ id: res.body.id })
                  .first()
                  .then(row => {
                    expect(row.user_name).to.eql(newUser.user_name);
                    expect(row.full_name).to.eql(newUser.full_name);
                    expect(row.nickname).to.eql(newUser.nickname);
                    const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' });
                    const actualDate = new Date(row.date_created).toLocaleString();
                    expect(actualDate).to.eql(expectedDate);
                  });
              });
          });
        });
      });
    }); 
  });
});