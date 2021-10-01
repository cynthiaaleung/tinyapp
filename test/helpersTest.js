const assert = require('chai').assert;

const getUserByEmail = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('#getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.deepEqual(user.id, expectedOutput);
  });

  it('should return undefined if email is not in database', () => {
    const user = getUserByEmail("user127@example.com", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(user, expectedOutput);
  });

});