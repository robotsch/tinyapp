const { assert } = require('chai');

const { emailCheck } = require('../helpers.js');

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

describe('emailCheck', function() {
  it('should return true if the email is found', function() {
    const userExists = emailCheck("user@example.com", testUsers)
    assert.isTrue(userExists)
  });

  it('should return undefined when given an invalid email', function() {
    const user = emailCheck('idontexist', testUsers)
    assert.isUndefined(user)
  })
});