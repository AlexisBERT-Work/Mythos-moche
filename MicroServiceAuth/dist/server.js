import express from "express";
import dotenv from "dotenv";
import auth from "./services/Auth";
import { connectDatabase } from "./data/connectDatabase";
dotenv.config({
    quiet: true,
});
const SERVER_PORT = process.env.SERVER_PORT || 3000;
const app = express();
app.use(express.json());
app.use("/", auth);
(async () => {
    try {
        await connectDatabase();
        app.listen(SERVER_PORT, () => {
            console.log(`Listen to Port: http://localhost:${SERVER_PORT}`);
        });
    }
    catch (err) {
        console.error("Failed to connect to database", err);
        process.exit(1);
    }
})();
