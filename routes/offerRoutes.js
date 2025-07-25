const express = require("express");
const router = express.Router();
const {
  saveOffers,
  getHighestDiscount,
} = require("../controllers/offerController");

router.post("/offer", saveOffers);
router.get("/highest-discount", getHighestDiscount);

module.exports = router;
