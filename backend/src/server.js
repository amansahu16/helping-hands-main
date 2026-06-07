import express from "express"
import app from "./app.js"
const app = express()

const PORT = process.env.PORT;


app.use(express.json())

app.get("/", (req, res) => {
  res.send("Helping Hands API Running")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})