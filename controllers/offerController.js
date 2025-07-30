const Offer = require("../models/Offer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the AI with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getOfferDetailsFromAI(summary) {
  console.log(`\n[AI Parser] Analyzing summary: "${summary}"`);
  try {
    // CORRECTED: Using a stable model name "gemini-2.5-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
      Analyze the following offer summary and extract the specified financial details.
      The summary is: "${summary}"

      Extract the following fields and return them in a clean JSON object:
      1. "flatDiscount": If there is a flat cashback or discount, what is the amount? If not present, use 0.
      2. "percentDiscount": If there is a percentage-based discount, what is the percentage? If not present, use 0.
      3. "maxCap": If there is a maximum cap on the discount (e.g., "up to ₹1000"), what is the maximum amount? If not present, use 0.
      4. "minOrderValue": If a minimum transaction or order value is mentioned, what is that value? If not present, use 0.

      IMPORTANT: Provide only the JSON object in your response, with no extra text, comments, or markdown formatting like \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("[AI Parser] Raw response from AI:", text);

    const jsonString = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedJson = JSON.parse(jsonString);
    console.log("[AI Parser] Successfully parsed JSON:", parsedJson);

    return parsedJson;
  } catch (error) {
    console.error(
      "[AI Parser] ❌ Failed to parse offer with AI. Error:",
      error.message
    );
    console.error(
      "[AI Parser] The function will now return default zero values."
    );

    return {
      flatDiscount: 0,
      percentDiscount: 0,
      maxCap: 0,
      minOrderValue: 0,
    };
  }
}
const saveOffers = async (req, res) => {
  try {
    const flipkartData = req.body.flipkartOfferApiResponse;
    const offers = flipkartData?.offer_sections?.PBO?.offers || [];

    let noOfOffersIdentified = offers.length;
    let noOfNewOffersCreated = 0;

    for (let offer of offers) {
      const exists = await Offer.findOne({ adjustmentId: offer.adjustment_id });
      if (!exists) {
        // Use the new AI parser
        const { flatDiscount, percentDiscount, maxCap, minOrderValue } =
          await getOfferDetailsFromAI(offer.summary);

        await Offer.create({
          adjustmentId: offer.adjustment_id,
          summary: offer.summary,
          banks: offer.contributors?.banks || [],
          paymentInstruments: offer.contributors?.payment_instrument || [],
          image: offer.image || "",
          type: offer.adjustment_type || "",
          flatDiscount,
          percentDiscount,
          maxCap,
          minOrderValue,
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
    const bankName = req.query.bankName?.toUpperCase();
    const instrument = req.query.paymentInstrument?.toUpperCase();

    if (!amount || !bankName) {
      return res
        .status(400)
        .json({ message: "Missing amountToPay or bankName" });
    }

    const offers = await Offer.find({
      banks: bankName,
      paymentInstruments: instrument,
      minOrderValue: { $lte: amount },
    });

    if (!offers.length) {
      return res.status(200).json({ highestDiscountAmount: 0 });
    }

    let highest = 0;

    for (const offer of offers) {
      let currentDiscount = 0;
      if (offer.flatDiscount > 0) {
        currentDiscount = offer.flatDiscount;
      } else if (offer.percentDiscount > 0) {
        const discount = (amount * offer.percentDiscount) / 100;
        // Use maxCap only if it's greater than 0
        currentDiscount =
          offer.maxCap > 0 ? Math.min(discount, offer.maxCap) : discount;
      }
      highest = Math.max(highest, currentDiscount);
    }

    return res.status(200).json({ highestDiscountAmount: Math.round(highest) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  saveOffers,
  getHighestDiscount,
};
