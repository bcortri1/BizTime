/** BizTime express application. */

const express = require("express");
const app = express();
const companyRoutes = require("./routes/companies.js");
const invoiceRoutes = require("./routes/invoices.js");
const ExpressError = require("./expressError.js");

app.use(express.json());
app.use("/companies", companyRoutes);
app.use("/invoices", invoiceRoutes);


/** 404 handler */

app.use(function (req, res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    let status = err.status || 500;
    let message = err.message;

    return res.json({
        error: { message, status }
    });
});


module.exports = app;
