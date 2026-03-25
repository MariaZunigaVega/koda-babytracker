require('dotenv').config();
const mongoose = require('mongoose');

// This variable will be provided by the Cloud, so your team doesn't need to type it.
const dbURI = process.env.MONGO_URI; 

if (!dbURI) {
  console.error("ERROR: MONGO_URI is not defined! Team: check your environment settings.");
  process.exit(1);
}

mongoose.connect(dbURI)
  .then(() => console.log("Connected to Koda Database"))
  .catch(err => console.log(err));