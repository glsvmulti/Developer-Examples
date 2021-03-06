"use strict";

let express = require("express"),
    router = express.Router(),
    pool = require('../db');

// GET 
router.get("/", async (req, res, next) => {
    // Set the query string parameters
    let read_count = req.query.r;
    let write_count = req.query.w;
    let connection_id = req.query.c;
    let conn;
    try {
        // Establish connection to SkySQL using the db.js module
        conn = await pool.getConnection(connection_id);

        let reads = ""; 
        let writes = "";

        // Create 0-N read queries
        for (let i = 0; i < read_count; i++) {
            reads += "select * from orders limit 1;";
        }

        // Create 0-N write queries
        let transaction_id = Date.now().toString();
        for (let i = 0; i < write_count; i++) {
            writes += "insert into orders (description) values('order - " + transaction_id + "');";
        }

        // Start latency timer
        var start = Date.now();

        // Asynchronously execute read and write queries
        await Promise.all([conn.query(reads), conn.query(writes)]);

        // Calculate latency 
        var delta = Date.now() - start;

        // Return the results
        res.send({ execution_time: delta });
    } catch (err) {
        throw err;
    } finally {
        // Release (close) the connection 
        if (conn) return conn.release();
    }
});

module.exports = router;