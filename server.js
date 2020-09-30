const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
const fetch = require("node-fetch");
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const host = "https://api.github.com";
const token = "42de1fb0e4adc020ae9d8aaf4267ac47901c0725";
const org = "dsc-lasu";

// this is to prevent CORS errors
app.use(function (req, res, next) {
  /*var err = new Error('Not Found');
   err.status = 404;
   next(err);*/

  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization"
  );

  //  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Pass to next layer of middleware
  next();
});

app.post("/", async (req, res) => {
  try {
    // check if github account exists with the given username, if no return that the username is invalid
    const user = await fetch(
      `${host}/users/${req.body.username}`
    ).then((response) => response.json());

    if (!user.id)
      return res.status(401).json({
        status: false,
        message: "Invalid Username",
        body: `GitHub user with username: ${req.body.username} not found. Please check username's spelling or create GitHub account with that username. Thank you.`,
      });

    // ensure that GitHub organization exists else return
    const organization = await fetch(
      `${host}/orgs/${org}`
    ).then((response) => response.json());

    if (!organization.id)
      return res.status(401).json({
        status: false,
        message: "Server Error",
        body: `GitHub organization with name: ${org} not found. Please correct name in org.js file.`,
      });

    // invite user
    fetch(`${host}/orgs/${org}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token ${token}`,
      },
      body: `{"invitee_id":${user.id}}`,
    }).then((response) => {
      // respond apprioprately
      if (response.status == 201) {
        res.status(201).json({
          status: true,
          message: "Successfully Invited",
          body: `Dear ${req.body.username},<br>Kindly check your inbox and accept the invitation that has been sent to you.<br>Thank you!`,
        });
      } else {
        response.json().then((data) => {
          let messages = [data.message];
          if (data.errors) {
            for (let error of data.errors) {
              messages.push(error.message);
            }
          }
          res.status(401).json({
            status: false,
            message: response.statusText,
            body: messages.join("<br>"),
          });
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An Error Occured",
      body: error.toString(),
    });
  }
});

// Server
app.listen(PORT, () => {
  console.log("Connected Successfully");
});
