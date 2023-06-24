/** Database setup for BizTime. */
const { Client } = require("pg");
const { DB_PASS } = require("./secrets/secrets.js")

let DB_USER = 'postgres'
let DB_NAME;

if (process.env.NODE_ENV === "test") {
    DB_NAME = "biztime_test";
} else {
    DB_NAME = "biztime";
}


let db = new Client({
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
});


db.connect();

module.exports = db;