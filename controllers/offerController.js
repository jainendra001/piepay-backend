const Offer = require("../models/Offer");

exports.saveOffers = async (req, res) => {
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
