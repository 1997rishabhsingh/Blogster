// In case default 5000ms isn't enough for a test case
// jest.setTimeout(30000);

const mongoose = require("mongoose");

require("../models/User");
const { mongoURI } = require("../config/keys");

mongoose.connect(mongoURI, { useMongoClient: true });
