const express = require("express");
const {
  saveOffers,
  getHighestDiscount,
} = require("../controllers/offerController");

const router = express.Router();

router.post("/offers", saveOffers);
router.get("/get-highest-discount", getHighestDiscount);

module.exports = router;
