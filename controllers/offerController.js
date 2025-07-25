const Offer = require("../models/Offer");

const saveOffers = async (req, res) => {
  try {
    const flipkartData = req.body.flipkartOfferApiResponse;
    const offers = flipkartData?.offer_sections?.PBO?.offers || [];

    let noOfOffersIdentified = offers.length;
    let noOfNewOffersCreated = 0;

    for (let offer of offers) {
      const exists = await Offer.findOne({ adjustmentId: offer.adjustment_id });
      if (!exists) {
        await Offer.create({
          adjustmentId: offer.adjustment_id,
          summary: offer.summary,
          banks: offer.contributors?.banks || [],
          paymentInstruments: offer.contributors?.payment_instrument || [],
          image: offer.image || "",
          type: offer.adjustment_type || "",
        });
        noOfNewOffersCreated++;
      }
    }

    res.status(200).json({
      noOfOffersIdentified,
      noOfNewOffersCreated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
const getHighestDiscount = async (req, res) => {
  try {
    const amount = parseFloat(req.query.amountToPay);
    const bankName = req.query.bankName;
    const instrument = req.query.paymentInstrument?.toUpperCase();

    if (!amount || !bankName) {
      return res
        .status(400)
        .json({ message: "Missing amountToPay or bankName" });
    }

    // Base query
    const query = {
      banks: bankName.toUpperCase(),
    };

    if (instrument) {
      query.paymentInstruments = instrument;
    }

    const offers = await Offer.find(query);

    if (!offers.length) {
      return res.status(404).json({ highestDiscountAmount: 0 });
    }

    let highestDiscountAmount = 0;

    for (const offer of offers) {
      const match = offer.summary.match(/(\d+)%/);
      if (match) {
        const percentage = parseFloat(match[1]);
        const discount = (percentage / 100) * amount;
        highestDiscountAmount = Math.max(highestDiscountAmount, discount);
      }

      const flatMatch = offer.summary.match(/₹\s?(\d+)/);
      if (flatMatch) {
        const flatDiscount = parseFloat(flatMatch[1]);
        highestDiscountAmount = Math.max(highestDiscountAmount, flatDiscount);
      }
    }

    res
      .status(200)
      .json({ highestDiscountAmount: Math.round(highestDiscountAmount) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  saveOffers,
  getHighestDiscount,
};
