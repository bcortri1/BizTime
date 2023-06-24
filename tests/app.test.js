process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");
const db = require("../db.js");

afterAll(async function () {
    // close db connection
    await db.end();
});


describe("404 handler test",function(){
    test("Gets random webpages", async function(){
        {
            let resp = await request(app).get(`/random`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Not Found",
                status: 404
            }});
        }
        {
            let resp = await request(app).post(`/random`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Not Found",
                status: 404
            }});
        }
        {
            let resp = await request(app).patch(`/random`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Not Found",
                status: 404
            }});
        }
        {
            let resp = await request(app).put(`/random`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Not Found",
                status: 404
            }});
        }
        {
            let resp = await request(app).delete(`/random`);
            expect(resp.statusCode).toBe(404)
            expect(resp.body).toEqual({error:{
                message:"Not Found",
                status: 404
            }});
        }
    })
});