const bcrypt = require("bcryptjs");

/**
 * @returns a random alphanumeric string of len length
 */
const genStr = function(len) {
  const rndStr = "0123456789abcdefABCDEF";
  let result = "";
  for (let i = 0; i < len; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random() * rndStr.length)];
  }
  return result;
};

/**
 * Creates and inserts a new user to a given database.
 * id is a 32 character long alphanumeric string.
 * database[newUser] = {
 *  id: id,
 *  email: email,
 *  password: password
 * }
 * @returns newly generated 32 character long alphanumeric stinrg
 */
const createUser = function(userEmail, userPassword, database) {
  const newId = genStr(32);
  database[newId] = {
    id: newId,
    email: userEmail,
    password: userPassword,
  };
  return newId;
};

/**
 * Checks if a given email is found inside any 1-layer deep property of a given database.
 * @returns true if found
 */
const emailCheck = function(userEmail, database) {
  for (const user in database) {
    if (userEmail === database[user].email) return true;
  }
};

/**
 * Email/encrypted password check against a given database.
 * @returns the user's ID if check passes
 */

const authUser = function(userEmail, userPassword, database) {
  for (const user in database) {
    if (
      userEmail === database[user].email &&
      bcrypt.compareSync(userPassword, database[user].password)
    ) {
      return database[user].id;
    }
  }
};

/**
 * @returns filtered list of URLs belonging to given userID, based on given database
 */
const urlsForUser = function(userID, database) {
  const userUrls = {};
  for (const entry in database) {
    if (userID === database[entry].userID) {
      userUrls[entry] = { longURL: database[entry].longURL };
    }
  }
  return userUrls;
};

module.exports = {
  genStr,
  createUser,
  emailCheck,
  authUser,
  urlsForUser
};