const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");


//Get all Industries and associated Company Codes todo
router.get("/", async function (req, res, next) {
    try {
        const result = await db.query(`SELECT i.code, i.name, ARRAY_AGG(ci.comp_code) as companies FROM industries as i
        LEFT JOIN companies_industries as ci ON i.code = ci.industry_code GROUP BY i.code`)
        return res.json({ industries: result.rows });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});


//Add an Industry
router.post("/", async function (req, res, next) {
    try {
        if (req.body.code === undefined || req.body.name === undefined) {
            let error = new ExpressError("Require code, and name", 404)
            return next(error)
        }
        const result = await db.query("INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING code, name", [req.body.code, req.body.name])
        const industry = result.rows[0]
        return res.json({ industry });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});


//Associate an Industry with a Company
router.post("/company/:code", async function (req, res, next) {
    try {
        if (req.body.code === undefined) {
            let error = new ExpressError("Require industry code", 404)
            return next(error)
        }

        const result = await db.query("INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code", [req.params.code, req.body.code])
        const association = result.rows[0]
        return res.json({ association });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});


module.exports = router;