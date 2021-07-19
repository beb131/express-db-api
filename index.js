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
          `exec xct_spOCEditsubscription @custID=N'${req.query.custID}',@notificationEmail=N'${req.query.notificationEmail}',@frequencyType=N'${freq}',@user9=0,@user8='1900-01-01 00:00:00',@subscriptionGUID=N'${req.query.subscriptionGUID}',@shipViaID=N'${req.query.shipViaID}',@userID=N'${req.query.userID}',@lastUpdated='${req.query.lastUpdated}',@nextShipDate='${nextShipDate}',@catalogID=N'${req.query.catalogID}',@lastShipDate='${req.query.lastShipDate}',@active=${active},@actionType=N'UPDATE',@paymentMethodGUID=N'${paymentMethodGUID}',@user11=N'',@createdDate='${req.query.createdDate}',@shipToID=N'${address}',@user5=N'',@user7='1900-01-01 00:00:00',@user6=N'',@user10=0,@user4=0,@user3=0,@user2=N'',@user1=N''`
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
        `SELECT paymentMethodGUID, paymentMethodName, paymentMethodDescr, expiration
        FROM xct_tblOCuserPaymentMethod
        WHERE CustId = '${req.query.custID}'`
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
      `SELECT 
            subs.*,
            subsdet.itemID, subsdet.invtID, subsdet.qtyOrd, subsdet.price,
            items.Name, Items.Descr, Items.User1 AS itemURL
        FROM xct_tblOCsubscription subs with(nolock)
        JOIN xct_tblOCsubscriptionDetail subsdet with(nolock) ON subs.subscriptionGUID = subsdet.subscriptionGUID
        JOIN xCTItems items with(nolock) ON subsdet.itemID = items.ItemID
        WHERE subs.subscriptionGUID = '${req.query.subscriptionGUID}'
        ORDER BY subs.catalogID, items.Name ASC`
    );
    res.json({ subscriptionDetails });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-customer-subscriptions", cors(corsOptions), async (req, res) => {
  try {
    const customerSubs = await sql.raw(
      `SELECT 
            subs.CustId, subs.catalogID, subs.subscriptionGUID, subs.active, subs.frequencyType, subs.nextShipDate,
            subsdet.itemID, subsdet.price,
            items.Name, Items.Descr
        FROM xct_tblOCsubscription subs with(nolock)
        JOIN xct_tblOCsubscriptionDetail subsdet with(nolock) ON subs.subscriptionGUID = subsdet.subscriptionGUID
        JOIN xCTItems items with(nolock) ON subsdet.itemID = items.ItemID
        WHERE subs.CustId = '${req.query.custID}'
        ORDER BY subs.catalogID, items.Name ASC`
    );
    res.json({ customerSubs });
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-customer-details", cors(corsOptions), async (req, res) => {
  try {
    const customerDetails = await sql.raw(
      `SELECT DISTINCT
        LTRIM(RTRIM(CustId)) as CustId, LTRIM(RTRIM(users.Name)) AS CustName, LTRIM(RTRIM(users.addr1)) AS addr1, LTRIM(RTRIM(users.Addr2)) AS Addr2, LTRIM(RTRIM(users.City)) AS City, LTRIM(RTRIM(users.State)) AS State, LTRIM(RTRIM(users.Zip)) AS Zip, LTRIM(RTRIM(users.Country)) AS Country, LTRIM(RTRIM(users.EMailAddr)) AS EMailAddr, LTRIM(RTRIM(users.ShipToId)) AS ShipToId
        FROM SOAddress users with(nolock)
        WHERE users.CustId = '${req.query.custID}'
        ORDER BY CustName ASC`
    );
    res.json({ customerDetails });
  } catch (err) {
    console.log(err);
  }
});

// Check if we should not check for active subs.
app.get("/get-active-subscribers", cors(corsOptions), async (req, res) => {
  try {
    const activeSubscribers = await sql.raw(
      `SELECT DISTINCT
          LTRIM(RTRIM(subs.catalogID)) AS CatID, LTRIM(RTRIM(users.CustId)) AS CustID, LTRIM(RTRIM(users.Name)) AS Name
        FROM SOAddress users with(nolock)
        JOIN xct_tblOCsubscription subs with(nolock) ON users.custID = subs.custID
        WHERE subs.active = 1
        ORDER BY Name ASC`
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
