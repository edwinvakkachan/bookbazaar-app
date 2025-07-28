const express = require('express');
const app = express();
const env = require('dotenv').config();


app.listen(process.env.PORT,()=>{
    console.log('server is running in the port 3000')
})

module.exports = app;