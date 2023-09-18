const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("C:UserssouraDesktop\video-processing-api\trimedVideo"); // Replace with the actual path to FFmpeg

const { google } = require("googleapis");
const youtube = google.youtube("v3");

// AWS S3 Configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: "6455254d6d7a99da23d80411",
    secretAccessKey: "645525590505d048c8f8d424",
  },
  region: "us-east-1", // Replace with your AWS region (e.g., 'us-east-1')
});

// Google API Client Configuration
const youtubeApiKey = `${process.env.youtubeApiKey}`;

// API endpoint to process the video
exports.processvideo = async (req, res) => {
  try {
    // Retrieve the S3 bucket key from the request (assuming it's passed as a query parameter)
    // const s3ObjectKey =
    //   "6455254d6d7a99da23d80411/645525590505d048c8f8d424/%23Reel+2.mp4";

    // // Step 1: Download the video from AWS S3 using AWS SDK v3
    // const getObjectCommand = new GetObjectCommand({
    //   Bucket: "YOUR_S3_BUCKET_NAME",
    //   Key: s3ObjectKey,
    // });

    // const downloadPath = "../video/"; // Temporary file to store the downloaded video
    // const fileStream = fs.createWriteStream(downloadPath);

    // try {
    //   const response = await s3Client.send(getObjectCommand);
    //   response.Body.pipe(fileStream);
    //   await new Promise((resolve) => fileStream.on("finish", resolve));
    // } catch (err) {
    //   console.error("Error downloading from S3:", err);
    //   throw err;
    // }
    const videoPath = "C:UserssouraDesktop\video-processing-api\video"; // Replace with the actual path

    // Step 2: Trim the video using FFmpeg
    const trimmedPath = "C:UserssouraDesktop\video-processing-api\trimedVideo";

    ffmpeg(videoPath)
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
