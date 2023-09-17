const { json } = require("body-parser");
const AWS = require("aws-sdk");
const ffmpeg = require("fluent-ffmpeg");
const { google } = require("googleapis");
const youtube = google.youtube("v3");

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: `${process.env.accessKeyId}`,
  secretAccessKey: `${process.env.secretAccessKey}`,
});

// Google API Client Configuration
const youtubeApiKey = `${process.env.youtubeApiKey}`;
const oauth2Client = new google.auth.OAuth2();
oauth2Client.setCredentials({
  access_token: `${process.env.access_token}`,
  refresh_token: `${process.env.refresh_token}`,
});
google.options({ auth: oauth2Client });

// API endpoint to process the video
exports.processvideo= async (req, res) => {
  try {
    // Retrieve the S3 bucket key from the request (assuming it's passed as a query parameter)
    const s3ObjectKey = req.query.key;

    // Step 1: Download the video from AWS S3
    const downloadParams = {
      Bucket: "YOUR_S3_BUCKET_NAME",
      Key: s3ObjectKey,
    };

    const downloadPath =
      "https://qr-s3-file-upload.s3.ap-south-1.amazonaws.com/6455254d6d7a99da23d80411/645525590505d048c8f8d424/%23Reel+2.mp4"; // Temporary file to store the downloaded video

    const downloadStream = s3.getObject(downloadParams).createReadStream();
    const writeStream = require("fs").createWriteStream(downloadPath);

    downloadStream.pipe(writeStream);
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Step 2: Trim the video using FFmpeg
    const trimmedPath = '../trimedVideo';

    ffmpeg(downloadPath)
      .setStartTime("00:00:00")
      .setDuration("50%") // Trims to half its length
      .output(trimmedPath)
      .on("end", () => {
        // Step 3: Upload the trimmed video to YouTube
        const youtubeUploadParams = {
          auth: youtubeApiKey,
          part: "snippet,status",
          resource: {
            snippet: {
              title: "Trimmed Video Title",
              description: "Trimmed video description",
            },
            status: {
              privacyStatus: "private", // or 'public', 'unlisted'
            },
          },
          media: {
            body: {
              filePath: trimmedPath,
            },
          },
        };

        youtube.videos.insert(youtubeUploadParams, (err, data) => {
          if (err) {
            console.error("Error uploading to YouTube:", err);
            res.status(500).json({ error: "Video upload failed" });
          } else {
            console.log("Video uploaded to YouTube:", data.data);
            res
              .status(200)
              .json({ message: "Video processed and uploaded to YouTube" });
          }
        });
      })
      .on("error", (err) => {
        console.error("Error trimming video:", err);
        res.status(500).json({ error: "Video processing failed" });
      })
      .run();
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Video processing failed" });
  }
};

