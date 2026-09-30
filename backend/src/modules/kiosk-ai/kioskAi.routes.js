const express =
  require(
    "express"
  );

const controller =
  require(
    "./kioskAi.controller"
  );

const authenticateKioskDevice =
  require(
    "../../middleware/authenticateKioskDevice"
  );

const liveController =
  require(
    "./kioskAi.live"
  );

const webrtcController =
  require(
    "./kioskAi.webrtc"
  );


const router =
  express.Router();


router.post(
  "/ai/webrtc",
  express.text({
    type: [
      "application/sdp",
      "text/plain",
    ],

    limit:
      "256kb",
  }),
  authenticateKioskDevice,
  webrtcController.connect
);


router.post(
  "/ai/live-session",
  authenticateKioskDevice,
  liveController.createLiveSession
);


router.post(
  "/ai/conversation",
  authenticateKioskDevice,
  controller.conversation
);


router.post(
  "/ai/tool",
  express.json({
    limit:
      "64kb",
  }),
  authenticateKioskDevice,
  controller.executeRealtimeTool
);


router.post(
  "/ai/reset",
  authenticateKioskDevice,
  controller.resetSession
);


module.exports =
  router;
