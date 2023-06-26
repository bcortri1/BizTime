process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");
const db = require("../db.js");
const slugify = require("slugify");

let testCompany1;
let testCompany2;

let testCompany3 = {code: slugify("Tesla Inc", {trim: true, lower: true}), name:"Tesla Inc", description:"A company owned by Elon Musk..." };
let testIndustry1;
let testIndustry2;

beforeEach(async function () {
    {
        let result = await db.query("INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *", ['tour', 'Tourism']);
        testIndustry1 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *", ['serv', 'Service']);
        testIndustry2 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", ['isle', 'The Island Company', 'For all your island needs']);
        testCompany1 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", ['far', 'Far Far Away Inc', 'Vacation getaway resorts']);
        testCompany2 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING *", ['isle', 'tour']);
    }
    {
        let result = await db.query("INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING *", ['isle', 'serv']);
    }

});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies_industries");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM industries");

});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /companies",function(){
    test("Gets company list", async function(){
        const resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({companies:[testCompany1, testCompany2]});
    })

});

describe("GET /companies/:code",function(){
    test("Gets specific company", async function(){
        {
            let resp = await request(app).get(`/companies/isle`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({company:{...testCompany1, industries:[testIndustry1.name, testIndustry2.name]}});
        }
        {
            let resp = await request(app).get(`/companies/far`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({company:{...testCompany2, industries:[null]}});
        }

    })

    test("Gets non existant company", async function(){
        let resp = await request(app).get(`/companies/dell`);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Company not found",
            status: 404
        }});
    })

});

describe("POST /companies",function(){
    test("Adds company to database", async function(){
        const resp = await request(app).post(`/companies`).send(testCompany3);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({company:testCompany3});
    })

    test("Attempting to add company with incomplete info", async function(){
        const resp = await request(app).post(`/companies`).send({ name:"Tesla Inc" });
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{message:"Require name, and description",  status: 404}});
    })

});


describe("PUT /companies/:code",function(){
    test("Alters company entirely", async function(){
        let resp = await request(app).put(`/companies/isle`).send(testCompany3);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({company:testCompany3});
        resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body.companies).toContainEqual(testCompany2);
        expect(resp.body.companies).toContainEqual(testCompany3);
    })

    test("Attempting to alter company with incomplete info", async function(){
        let resp = await request(app).put(`/companies/isle`).send({ description:"A company owned by Elon Musk..." });
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{message:"Require code, name, and description",  status: 404}});
        resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body.companies).toContainEqual(testCompany1);
        expect(resp.body.companies).toContainEqual(testCompany2);
    })

    test("Gets non existant company", async function(){
        let resp = await request(app).put(`/companies/dell`).send(testCompany3);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Company not found",
            status: 404
        }});
    })

});

describe("PATCH /companies/:code",function(){
    test("Alters company entirely", async function(){
        let resp = await request(app).patch(`/companies/isle`).send(testCompany3);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({company:testCompany3});
        resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body.companies).toContainEqual(testCompany2);
        expect(resp.body.companies).toContainEqual(testCompany3);
    })

    test("Attempting to alter company with incomplete info", async function(){
        let resp = await request(app).patch(`/companies/isle`).send({ name:"Tesla Inc", description:"A company owned by Elon Musk..." });
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({company:{code:"isle",  name:"Tesla Inc", description:"A company owned by Elon Musk..." }});
        resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body.companies).toContainEqual(testCompany2)
        expect(resp.body.companies).toContainEqual({code:"isle",  name:"Tesla Inc", description:"A company owned by Elon Musk..." });
    })

    test("Gets non existant company", async function(){
        let resp = await request(app).patch(`/companies/dell`).send(testCompany3);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Company not found",
            status: 404
        }});
    })

});

describe("DELETE /companies/:code",function(){
    test("Deletes a company", async function(){
        const resp = await request(app).delete(`/companies/isle`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({status:"deleted"});
    })

    test("Deletes a nonexistent company", async function(){
        const resp = await request(app).delete(`/companies/dell`);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Company not found",
            status: 404
        }});
    })

});