process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");
const db = require("../db.js");

let testCompany1;
let testCompany2;
let testInvoice1;
let testInvoice2;
let testInvoice3;



beforeEach(async function () {
    {
        let result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", ['isle', 'The Island Company', 'For all your island needs']);
        testCompany1 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", ['far', 'Far Far Away Inc', 'Vacation getaway resorts']);
        testCompany2 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *, paid_date::Text, add_date::Text", ['isle', '100'])
        testInvoice1 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *, paid_date::Text, add_date::Text", ['far', '200'])
        testInvoice2 = result.rows[0];
    }
    {
        let result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *, paid_date::Text, add_date::Text", ['far', '300'])
        testInvoice3 = result.rows[0];
    }
    

});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function () {
    // close db connection
    await db.end();
});

describe("GET /invoices",function(){
    test("Gets invoice list", async function(){
        const resp = await request(app).get(`/invoices`);
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({invoices:[testInvoice1, testInvoice2, testInvoice3]});
    })

});


describe("GET /invoices/:code",function(){
    test("Gets specific invoice", async function(){
        {
            let resp = await request(app).get(`/invoices/${testInvoice1.id}`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({invoice:testInvoice1});
        }
        {
            let resp = await request(app).get(`/invoices/${testInvoice2.id}`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({invoice:testInvoice2});
        }

    })

    test("Gets non existant invoice", async function(){
        let resp = await request(app).get(`/invoices/-1`);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Invoice not found",
            status: 404
        }});
    })

});


describe("POST /invoices",function(){
    test("Adds invoices to database", async function(){
        const resp = await request(app).post(`/invoices`).send({comp_code:testCompany1.code, amt:800});
        expect(resp.statusCode).toBe(200)
        expect(resp.body.invoice.comp_code).toEqual(testCompany1.code);
        expect(resp.body.invoice.amt).toEqual(800);
        expect(resp.body.invoice.paid).toEqual(false);
        expect(resp.body.invoice.paid_date).toEqual(null);
    })

    test("Attempting to add company with incomplete info", async function(){
        const resp = await request(app).post(`/invoices`).send({amt:800});
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{message:"Require comp_code, and amt",  status: 404}});
    })

});


describe("PUT /invoices/:id",function(){
    test("Alters company entirely", async function(){
        let resp = await request(app).put(`/invoices/${testInvoice3.id}`).send({paid:false,amt:500});
        expect(resp.statusCode).toBe(200)
        expect(resp.body.invoice.comp_code).toEqual(testCompany2.code);
        expect(resp.body.invoice.amt).toEqual(500);
        expect(resp.body.invoice.paid).toEqual(false);
        expect(resp.body.invoice.paid_date).toEqual(null);
    })

    test("Attempting to alter invoice with incomplete info", async function(){
        let resp = await request(app).put(`/invoices/${testInvoice3.id}`).send({});
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{message:"Require amt and paid",  status: 404}});
    })

    test("Attempting to alter fake invoice", async function(){
        let resp = await request(app).put(`/invoices/-1`).send({paid:true, amt:500});
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Invoice not found",
            status: 404
        }});
    })

});


describe("DELETE /invoices/:code",function(){
    test("Deletes an invoice", async function(){
        {
            let resp = await request(app).delete(`/invoices/${testInvoice1.id}`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({status:"deleted"});
        }
        {
            let resp = await request(app).get(`/invoices/${testInvoice1.id}`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Invoice not found",
                status: 404
            }});
        }
    })

    test("Deletes a nonexistent invoice", async function(){
        const resp = await request(app).delete(`/invoices/-1`);
        expect(resp.statusCode).toBe(404)
        expect(resp.body).toEqual({error:{
            message:"Invoice not found",
            status: 404
        }});
    })

});


describe("GET /invoices/companies/code",function(){
    test("Gets a list of company invoices", async function(){
        {
            let resp = await request(app).get(`/invoices/companies/${testCompany1.code}`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({company:{...testCompany1, invoices:[testInvoice1]}});
        }
        {
            let resp = await request(app).get(`/invoices/companies/${testCompany2.code}`);
            expect(resp.statusCode).toBe(200)
            expect(resp.body).toEqual({company:{...testCompany2, invoices:[testInvoice2, testInvoice3]}});
        }
    })

    test("Gets a list of fake company invoices", async function(){
        {
            let resp = await request(app).get(`/invoices/companies/fake`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Company not found",
                status: 404
            }});
        }
    })
});