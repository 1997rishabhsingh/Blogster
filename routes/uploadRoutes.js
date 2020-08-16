const AWS = require("aws-sdk");
const { v1 } = require("uuid");

const requireLogin = require("../middlewares/requireLogin");
const { accessKeyId, secretAccessKey } = require("../config/keys");

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey
});

module.exports = (app) => {
  app.get("/api/upload", requireLogin, async (req, res) => {
    s3.getSignedUrl(
      "putObject",
      {
        Bucket: "my-bucket-name",
        ContentType: "image/jpeg",
        // Key -> filename
        Key: `${req.user.id}/${v1()}.jpeg`
      },
      (err, url) => res.send({ url })
    );
  });
};
