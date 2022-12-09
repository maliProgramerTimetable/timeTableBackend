//requirements
const express = require('express')
const admin = require('firebase-admin')
const serviceAccount = require('./constants/serviceAccountKey.json')
const cors = require('cors')

//init
let port = process.env.PORT || 8001
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
})
const app = express()
app.use(express.json())
app.use(cors())

//routes
const generateTT = require('./src/generate_tt')

// Middleware
app.post('/generate', generateTT)

app.listen(port, () => console.log(`Server running on port ${port}`))