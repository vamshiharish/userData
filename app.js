const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");

app.use(express.json());

const userData = path.join(__dirname, "userData.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: userData,
      driver: sqlite3.Database,
    });

    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const requestBody = request.body;
  const { username, name, password, gender, location } = requestBody;
  const hasedPassword = await bcrypt.hash(password, 12);

  const selectBody = `SELECT * FROM user WHERE username = '${username}'`;

  const exportData = await database.get(selectBody);
  switch (true) {
    case exportData === undefined:
      const newBody = `
            INSERT INTO 
                user (username,name,password,gender,location)
            VALUES
                ('${username}','${name}','${hasedPassword}','${gender}','${location}');
        `;
      await database.run(newBody);
      response.status = 200;
      response.send("Successful registration of the registrant");
      break;
    case password.length < 5:
      response.status = 400;
      response.send("Password is too short");
      break;
    default:
      response.status = 400;
      response.send("User already exists");
      break;
  }
});

app.post("/login", async (request, response) => {
  const requestBody = request.body;
  const { username, password } = requestBody;
  const getLogin = `
        SELECT * FROM user WHERE username = '${username}'
    `;
  const selectQuery = await database.get(getLogin);
  const comparedValue = await bcrypt.compare(password, selectQuery.password);
  switch (true) {
    case selectQuery === undefined:
      response.status = 400;
      response.send("Invalid user");
      break;
    case comparedValue === true:
      response.status = 200;
      response.send("Login success!");
    case comparedValue === false:
      response.status = 400;
      response.send("Invalid password");
  }
});

app.put("/change-password", async (request, response) => {
  const requestBody = request.body;
  const { username, oldPassword, newPassword } = requestBody;

  const getResult = `
        SELECT * FROM user WHERE username = '${oldPassword}'
    `;
  const changePassword = await database.run(getResult);
  //response.send(changePassword.password);
  const compareOldNew = await bcrypt.compare(
    oldPassword,
    changePassword.password
  );
  response.send(compareOldNew);
    switch (true) {
      case compareOldNew === undefined:
          response.send("User not found")
          break
      case compareOldNew === true:
        const updateValues = `
                  UPDATE
                      user
                  SET
                      newPassword = '${newPassword}'
                  WHERE
                      username = '${username}'
              `;
        await database.run(updateValues);
        response.send("Password updated");
        break;
      case compareOldNew === false:
        response.send("Invalid current password");
      case newPassword.length < 5:
        response.send("Password is too short");
        break;
    }
});
