const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError")

//Get All Invoices
router.get("/", async function (req, res, next) {
    try {
        const result = await db.query("SELECT * FROM invoices")
        return res.json({ invoices: result.rows });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Get specified Invoice
router.get("/:invoiceId", async function (req, res, next) {
    try {
        const result = await db.query("SELECT * FROM invoices WHERE id=$1", [req.params.invoiceId])
        const invoice = result.rows[0]
        if (invoice) {
            return res.json({ invoice });
        }
        else {
            let error = new ExpressError("Invoice not found", 404)
            throw error
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Create an Invoice
router.post("/", async function (req, res, next) {
    try {
        const result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *", [req.body.comp_code, req.body.amt])
        const invoice = result.rows[0]
        if (invoice) {
            return res.json({ invoice });
        }
        else {
            let error = new ExpressError("Invoice not found", 404)
            return next(error)
        }
    } catch (err) {
        let error = new ExpressError("Invalid Company Code", err.status || 500)
        return next(error)
    }
});

//Update an Invoice
router.put("/:invoiceId", async function (req, res, next) {
    try {
        const result = await db.query("UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *", [req.body.amt, req.params.invoiceId])
        const invoice = result.rows[0]
        if (invoice) {
            return res.json({ invoice });
        }
        else {
            let error = new ExpressError("Invoice not found", 404)
            throw error
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Delete an Invoice
router.delete("/:invoiceId", async function (req, res, next) {
    try {
        const result = await db.query("DELETE FROM invoices WHERE id=$1", [req.params.invoiceId])
        if (result.rowCount === 1) {
            return res.json({ status: "deleted" })
        }
        else {
            let error = new ExpressError("Invoice not found", 404)
            throw error
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Get a Company and its Invoices
router.get("/companies/:code", async function (req, res, next) {
    try {
        const result1 = await db.query("SELECT code, name, description FROM companies WHERE code=$1", [req.params.code])
        const company = result1.rows[0]
        if(company){
            const result2 = await db.query("SELECT * FROM invoices WHERE comp_code=$1", [req.params.code])
            const invoices = result2.rows
            return res.json({ company: { ...company , invoices} });
        }
        else{
            let error = new ExpressError("Company not found", 404)
            return next(error)
        }

    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});


module.exports = router;