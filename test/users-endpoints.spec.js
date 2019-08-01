/* global supertest */
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Users Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();

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
        .expect(400, { error: 'Password must not start with a space'});
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
        .expect(400, { error: 'Password must not end with a space'});
    });
  });
});