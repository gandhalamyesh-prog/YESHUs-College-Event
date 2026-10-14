
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "college"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("Connected to MySQL database: college");
});

// Validate event fields
function validateEvent(req, res, next) {
    const { event_name, event_type, event_date, venue } = req.body;

    if (
        typeof event_name !== "string" || !event_name.trim() ||
        typeof event_type !== "string" || !event_type.trim() ||
        typeof event_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(event_date) ||
        typeof venue !== "string" || !venue.trim()
    ) {
        return res.status(400).json({
            message: "Enter a valid event name, event type, event date and venue."
        });
    }

    next();
}

// GET: Display all events
app.get("/events", (req, res) => {
    db.query(
        "SELECT * FROM events ORDER BY event_id",
        (err, rows) => {
            if (err) {
                console.error("Fetch error:", err.message);
                return res.status(500).json({ message: err.message });
            }

            res.json(rows);
        }
    );
});

// GET: Display one event
app.get("/events/:id", (req, res) => {
    db.query(
        "SELECT * FROM events WHERE event_id = ?",
        [req.params.id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            res.json(rows[0]);
        }
    );
});

// POST: Add an event
app.post("/events", validateEvent, (req, res) => {
    const {
        event_name,
        event_type,
        event_date,
        venue,
        description
    } = req.body;

    const sql = `
        INSERT INTO events
        (event_name, event_type, event_date, venue, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            event_name.trim(),
            event_type.trim(),
            event_date,
            venue.trim(),
            description ? description.trim() : null
        ],
        (err, result) => {
            if (err) {
                console.error("Add event error:", err.message);
                return res.status(500).json({
                    message: "Unable to add event: " + err.message
                });
            }

            res.status(201).json({
                message: "Event added successfully!",
                event_id: result.insertId
            });
        }
    );
});

// PUT: Update an event
app.put("/events/:id", validateEvent, (req, res) => {
    const {
        event_name,
        event_type,
        event_date,
        venue,
        description
    } = req.body;

    const sql = `
        UPDATE events
        SET event_name = ?,
            event_type = ?,
            event_date = ?,
            venue = ?,
            description = ?
        WHERE event_id = ?
    `;

    db.query(
        sql,
        [
            event_name.trim(),
            event_type.trim(),
            event_date,
            venue.trim(),
            description ? description.trim() : null,
            req.params.id
        ],
        (err, result) => {
            if (err) {
                console.error("Update event error:", err.message);
                return res.status(500).json({
                    message: "Unable to update event: " + err.message
                });
            }

            if (result.affectedRows === 0) {
                return db.query(
                    "SELECT event_id FROM events WHERE event_id = ?",
                    [req.params.id],
                    (checkErr, rows) => {
                        if (checkErr) {
                            return res.status(500).json({
                                message: checkErr.message
                            });
                        }

                        if (rows.length === 0) {
                            return res.status(404).json({
                                message: "Event ID not found"
                            });
                        }

                        res.json({
                            message: "No changes were made to the event."
                        });
                    }
                );
            }

            res.json({
                message: "Event updated successfully!"
            });
        }
    );
});

// DELETE: Delete an event
app.delete("/events/:id", (req, res) => {
    db.query(
        "DELETE FROM events WHERE event_id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error("Delete event error:", err.message);
                return res.status(500).json({
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Event ID not found"
                });
            }

            res.json({
                message: "Event deleted successfully!"
            });
        }
    );
});

// Start server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
})