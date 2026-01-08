import express from "express";
import dotenv from "dotenv";
import bestiaire from "./MicroServiceBestiaire/src/services/Creature";
import Temoignage from "./MicroServiceBestiaire/src/services/Temoignage";
import auth from "./MicroServiceAuth/src/services/Auth";
import { connectDatabase as connectAuthDatabase } from "./MicroServiceAuth/src/data/connectDatabase";
import { connectDatabase as connectBestiaireDatabase } from "./MicroServiceBestiaire/src/data/connectDatabase";

dotenv.config({
    quiet: true,
});

const SERVER_PORT = process.env.SERVER_PORT;

const app = express();

app.use(express.json());
app.use("/", bestiaire);
app.use("/", Temoignage);
app.use("/", auth);

(async () => {
    try {
        await connectAuthDatabase();
        await connectBestiaireDatabase();

        app.listen(SERVER_PORT, () => {
            console.log(`Listen to Port: http://localhost:${SERVER_PORT}`);
        });
    } catch (err) {
        console.error("Failed to connect to database", err);
        process.exit(1);
    }
})();