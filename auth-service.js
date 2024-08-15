// auth-service.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

module.exports.initialize = function() {
  return new Promise(function(resolve, reject) {
    let db = mongoose.createConnection("connectionString");

    db.on('error', (err) => {
      reject(err);
    });
    db.once('open', () => {
      let User = db.model("users", userSchema);
      resolve(User);
    });
  });
};

module.exports.registerUser = function(User, userData) {
  return new Promise(function(resolve, reject) {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      let newUser = new User(userData);
      newUser.save()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err);
          }
        });
    }
  });
};

module.exports.checkUser = function(User, userData) {
  return new Promise(function(resolve, reject) {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          if (users[0].password !== userData.password) {
            reject("Incorrect Password for user: " + userData.userName);
          } else {
            users[0].loginHistory.push({
              dateTime: (new Date()).toString(),
              userAgent: userData.userAgent
            });
            User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
              .then(() => {
                resolve(users[0]);
              })
              .catch((err) => {
                reject("There was an error verifying the user: " + err);
              });
          }
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};