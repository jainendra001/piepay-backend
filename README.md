# PiePay Backend Assignment

This repository contains the backend implementation for the PiePay take-home assignment. The system ingests payment offers from Flipkart’s API, stores them in a MongoDB database, and exposes APIs to determine the best applicable discount based on transaction parameters.

---

## Features

- `POST /offer`: Ingests and stores Flipkart-style offers.
- `GET /highest-discount`: Computes the best discount for a transaction based on amount, bank name, and optionally, payment instrument.
- Bonus: Filtering and matching support for `paymentInstrument` like `CREDIT`, `EMI_OPTIONS`, etc.

---

## Prerequisites

- Node.js (v16 or higher)
- npm
- MongoDB instance (Atlas or local)

---

## Setup Instructions

```bash
# Clone the repository
git clone https://github.com/jainendra001/piepay-backend.git
cd piepay-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Sample `.env` File

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/piepay?retryWrites=true&w=majority
PORT=3000
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server runs at `http://localhost:3000`

---

## Step 1: Understanding Flipkart’s Offer API & Data Source

To simulate real-world offers, Flipkart's payment API was analyzed using browser Developer Tools.

### Flipkart’s Offer API Flow

1. **Request Token URL**:
   - `GET https://1.rome.api.flipkart.com/api/3/checkout/paymentToken`
   - This generates a temporary payment session token.

2. **Offers API Endpoint**:
   - `POST https://1.payments.flipkart.com/fkpay/api/v3/payments/options?token=<token>`
   - The response includes detailed offer data under `offer_sections.PBO.offers`.

### Sample Offer Response
```json
"offer_sections": {
  "PBO": {
    "offers": [
      {
        "adjustment_id": "FPO250619134128USHPF",
        "summary": "5% cashback on Flipkart Axis Bank Credit Card upto ₹4,000 per statement quarter",
        "contributors": {
          "payment_instrument": ["CREDIT"],
          "banks": ["FLIPKARTAXISBANK"]
        }
      },
      ...
    ]
  }
}
```

### Why the API Can’t Be Called Directly
Flipkart's endpoints are protected with **reCAPTCHA** and session validation. Direct access via tools like Postman/cURL fails with HTML responses asking for CAPTCHA verification.

✅ **Solution:**
- Extract the full API JSON response manually via browser DevTools.
- Save the JSON response locally as `flipkartOfferResponse.json` for testing.
- Treat this as a static mock response throughout development.

---

## API Documentation

### `POST /offer`
Ingests new offers into the database.

**Request Body:**
```json
{
  "flipkartOfferApiResponse": {
    "offer_sections": {
      "PBO": {
        "offers": [ ... ]
      }
    }
  }
}
```

**Sample Response:**
```json
{
  "noOfOffersIdentified": 3,
  "noOfNewOffersCreated": 2
}
```

---

### `GET /highest-discount`
Computes the maximum discount applicable.

**Query Parameters:**
- `amountToPay` (required)
- `bankName` (required)
- `paymentInstrument` (optional)

**Example:**
```
GET /highest-discount?amountToPay=10000&bankName=FLIPKARTAXISBANK&paymentInstrument=CREDIT
```

**Response:**
```json
{
  "highestDiscountAmount": 500
}
```

---

## Assumptions

- Offers are uniquely identified by `adjustment_id`.
- Discount is extracted using regex on the `summary` field.
- Bank names and instruments are aligned with Flipkart’s response schema.
- EMI and card network filters are not applied.

---

## System Design

### High-Level Design (HLD)
This diagram outlines the interaction between major components including client apps, server-side modules, and MongoDB.

![High-Level Design](https://drive.google.com/uc?export=view&id=1-VlgE4n3YrdhjWoNfPj697Zy3sjo4V4A)

- Clients (e.g., Postman, web apps) send HTTP requests.
- The Express.js server handles routing and delegates logic to controllers.
- Controllers use Mongoose models to read/write from MongoDB.

---

### Low-Level Design (LLD)
This sequence diagram illustrates the flow of requests and internal processing for both core APIs.

![Low-Level Design](https://drive.google.com/uc?export=view&id=1BqMAdr2iokX9y01r4d6ug9EMhEdSUq0t)

**POST /offer Flow:**
- Receives Flipkart-style offer JSON.
- Iterates through offers, checks uniqueness, stores new entries.
- Returns total identified and newly created offers.

**GET /highest-discount Flow:**
- Accepts transaction parameters.
- Queries offers matching bank and payment method.
- Calculates applicable discounts (percentage or flat).
- Returns the maximum discount.

---

## Scalability Strategy

To support high traffic (~1000 RPS) on `/highest-discount`:

- Use compound indexes on `banks` and `paymentInstruments`.
- Cache frequent queries in Redis.
- Precompute discount values on offer ingestion.
- Apply request throttling using middleware.
- Deploy using horizontal scaling (e.g., Docker, ECS, Kubernetes).

---

## Future Enhancements

- Add unit/integration tests using Jest and Supertest.
- Introduce complex discount logic parsing.
- Implement authentication and role-based access.
- Enable paginated offer retrieval.
- Set up CI/CD pipeline and deploy to a production environment.

---

## Sample Data

Sample Flipkart-style offer response:
```
sample-data/flipkartOfferResponse.json
```

---

## Proof of Concept

Please refer this DOC : [Proof of Concept Document](https://docs.google.com/document/d/14om0f4TTxCzdxSFOs1Rz27jK7e6IZV6uHK_zyFC-Xfw/edit?usp=sharing)


---

## Author

**Jainendra Tripathy**  
GitHub: [@jainendra001](https://github.com/jainendra001)

---
