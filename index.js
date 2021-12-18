const path = require("path");
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const sql = require("./db-config");
const port = parseInt(process.env.PORT, 10) || 3001;
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

require("dotenv").config();

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `${process.env.AUTH0_ISSUER_BASE_URL}/`,
  algorithms: ["RS256"],
});

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors()); // https://expressjs.com/en/resources/middleware/cors.html
app.use(checkJwt);

const staticPath = path.join(__dirname, "../static");
app.use(
  "/static",
  express.static(staticPath, {
    maxAge: "30d",
    immutable: true,
  })
);

var corsOptions = {
  origin: process.env.baseURL,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.post(
  "/update-subscription-details",
  cors(corsOptions),
  async (req, res) => {
    const freq = req.query.newFreq;
    const active = req.query.newActive || req.query.active;
    const nextShipDate = req.query.newNextShipDate;
    const paymentMethodGUID = req.query.newpaymentMethodGUID;
    const address = req.query.newAddress;

    try {
      await sql
        .raw(
          `REDACTED FOR SECURITY`
        )
        .then((res) => console.log(res));
      res.end("Successfully Updated Subscription");
    } catch (err) {
      console.log(err);
    }
  }
);

app.get(
  "/get-customer-payment-methods",
  cors(corsOptions),
  async (req, res) => {
    try {
      const paymentMethods = await sql.raw(
        `REDACTED FOR SECURITY`
      );
      res.json({ paymentMethods });
    } catch (err) {
      console.log(err);
    }
  }
);

app.get("/get-subscription-details", cors(corsOptions), async (req, res) => {
  try {
    const subscriptionDetails = await sql.raw(
      `REDACTED FOR SECURITY`
    );
    res.json({ subscriptionDetails });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-customer-subscriptions", cors(corsOptions), async (req, res) => {
  try {
    const customerSubs = await sql.raw(
      `REDACTED FOR SECURITY`
    );
    res.json({ customerSubs });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-customer-details", cors(corsOptions), async (req, res) => {
  try {
    const customerDetails = await sql.raw(
      `REDACTED FOR SECURITY`
    );
    res.json({ customerDetails });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-active-subscribers", cors(corsOptions), async (req, res) => {
  try {
    const activeSubscribers = await sql.raw(
      `REDACTED FOR SECURITY`
    );
    res.json({ activeSubscribers });
  } catch (err) {
    console.log(err);
  }
});

app.all("*", (req, res) => {
  return "404";
});

startServer();

function startServer() {
  app.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`);
  });
}
