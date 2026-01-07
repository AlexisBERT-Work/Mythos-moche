import express from "express";
import dotenv from "dotenv";


dotenv.config( {
    quiet:true,
})

const app = express()
const SERVER_PORT = process.env.SERVER_PORT


app.listen(SERVER_PORT , () => {
    console.log(`Listen to Port: http://localhost:${SERVER_PORT}`)
}) 