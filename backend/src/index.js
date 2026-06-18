import "./loadEnv.js";
import express from "express";
import connectDB from "./db/index.js";
import app from "./app.js";

// Start Express server immediately
app.listen(process.env.PORT || 8000, () => {
    console.log(` Server is running at port : ${process.env.PORT || 8000}`);
});

// Run DB connection check in the background
connectDB().catch((err) => {
    console.error("PostgresSQL database initialization failed: ", err);
});
