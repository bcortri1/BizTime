const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//Get All Companies
router.get("/", async function (req, res, next) {
    try {
        const result = await db.query("SELECT code, name, description FROM companies")
        return res.json({ companies: result.rows });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Get Specified Company and Industries
router.get("/:code", async function (req, res, next) {
    try {
        const result = await db.query(`SELECT c.code, c.name, c.description, i.name AS indus FROM companies as c 
        LEFT JOIN companies_industries AS ci ON c.code = ci.comp_code
        LEFT JOIN industries AS i ON i.code = ci.industry_code 
        WHERE c.code=$1`, [req.params.code])
        if (!result.rows[0]){
            let error = new ExpressError("Company not found", 404)
            return next(error)
        }
        else{
            const {code, name, description} = result.rows[0]
            const industries = result.rows.map(r => r.indus || null);
            return res.json({company: {code, name, description, industries} });
        }

    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Add a Company, returns new company
router.post("/", async function (req, res, next) {
    try {
        if (req.body.name === undefined || req.body.description === undefined) {
            let error = new ExpressError("Require name, and description", 404)
            return next(error)
        }
        let code = slugify(req.body.name, {trim: true, lower: true})
        const result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, req.body.name, req.body.description])
        const company = result.rows[0]
        return res.json({ company });
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Edit a Company fully, returns company
router.put("/:code", async function (req, res, next) {
    try {
        if (req.body.code === undefined || req.body.name === undefined || req.body.description === undefined) {
            let error = new ExpressError("Require code, name, and description", 404)
            return next(error)
        }
        const result = await db.query("UPDATE companies SET code=$1, name=$2, description=$3 WHERE code = $4 RETURNING code, name, description", [req.body.code, req.body.name, req.body.description, req.params.code])
        const company = result.rows[0]
        if (company) {
            return res.json({ company });
        }
        else {
            let error = new ExpressError("Company not found", 404)
            return next(error)
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Edit a Company partially, returns company
router.patch("/:code", async function (req, res, next) {
    try {

        let company;

        if (req.body.name) {
            const result = await db.query("UPDATE companies SET name=$1 WHERE code = $2 RETURNING code, name, description", [req.body.name, req.params.code])
            company = result.rows[0]
        }
        if (req.body.description) {
            const result = await db.query("UPDATE companies SET description=$1 WHERE code = $2 RETURNING code, name, description", [req.body.description, req.params.code])
            company = result.rows[0]
        }
        if (req.body.code) {
            const result = await db.query("UPDATE companies SET code=$1 WHERE code = $2 RETURNING code, name, description", [req.body.code, req.params.code])
            company = result.rows[0]
        }
        
        if (company) {
            return res.json({ company });
        }
        else {
            let error = new ExpressError("Company not found", 404)
            return next(error)
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});

//Delete a Company, returns message confirming deletion
router.delete("/:code", async function (req, res, next) {
    try {
        const result = await db.query("DELETE FROM companies WHERE code=$1", [req.params.code])
        if (result.rowCount === 1) {
            return res.json({ status: "deleted" })
        }
        //Feature not implemented
        // else if (result.rowCount > 1) {
            
        //     return res.json({ status: "Multiple companies deleted" })
        // }
        else {
            let error = new ExpressError("Company not found", 404)
            return next(error)
        }
    } catch (err) {
        let error = new ExpressError(err.message, err.status || 500)
        return next(error)
    }
});




module.exports = router;