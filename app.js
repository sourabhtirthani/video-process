const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
require("dotenv").config();
const videoRouters = require("./routes/video");
const port = process.env.PORT; // Change as needed

app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// CORS POLICIES
let corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  exposedHeaders: ["x-auth-token"],
};
app.use(cors(corsOptions));

// Routes
app.use("/", videoRouters);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
