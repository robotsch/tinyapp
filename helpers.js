const genStr = function(len) {
  const rndStr = "0123456789abcdefABCDEF";
  let result = "";
  for (let i = 0; i < len; i += 1) {
    // Thank you once again, StackOverflow
    result += rndStr[Math.floor(Math.random() * rndStr.length)];
  }
  return result;
};

const createUser = function(userEmail, userPassword, database) {
  const newId = genStr(32);
  database[newId] = {
    id: newId,
    email: userEmail,
    password: userPassword,
  };
  return newId;
};

const emailCheck = function(userEmail, database) {
  for (const user in database) {
    if (userEmail === database[user].email) return true;
  }
};

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

const urlsForUser = function(userID, database) {
  const userUrls = {}
  for(const entry in database) {
    if(userID === database[entry].userID) {
      userUrls[entry] = { longURL: database[entry].longURL }
    }
  }
  return userUrls
}

module.exports = {
  genStr,
  createUser,
  emailCheck,
  authUser,
  urlsForUser
}