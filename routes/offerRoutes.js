const express = require("express");
const router = express.Router();
const { saveOffers } = require("../controllers/offerController");

router.post("/offer", saveOffers);

module.exports = router;
