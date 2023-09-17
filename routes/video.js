const router = require("express").Router();
const processingVideo = require("../controllers/processingvideo");

router.post("/process-video", processingVideo.processvideo);

module.exports = router;
