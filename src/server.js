
const express = require('express');
const authRoute = require('./routes/auth');
const servicesRoute = require('./routes/services');
const transactionsRoute = require('./routes/transaction');
const detailsRoute = require('./routes/details');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(authRoute);
app.use(servicesRoute);
app.use(transactionsRoute);
app.use(detailsRoute);

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});



/*
// Entry Point of the API Server 
const express = require('express');
const dotenv = require('dotenv');

// dotenv.config();
const port = 3000;
  
// Creates an Express application. 
//    The express() function is a top-level 
//    function exported by the express module.
const app = express();

const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'banksystem',
    password: 'naveen',
    dialect: 'postgres',
    port: 5432
});
  

    To handle the HTTP Methods Body Parser 
   is used, Generally used to extract the 
   entire body portion of an incoming 
   request stream and exposes it on req.body 

// const bodyParser = require('body-parser');
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }));
  

pool.connect((err, client, release) => {
    if (err) {
        return console.error(
            'Error acquiring client', err.stack)
    }
    client.query('SELECT NOW()', (err, result) => {
        release()
        if (err) {
            return console.error(
                'Error executing query', err.stack)
        }
        console.log("Connected to Database !")
    })
})
  


app.get("/", async(req, res) => {
    // // Creating a new user
    // const new_data = await prisma.user.create({
    //     data: {
    //         Username: "253",
    //         FullName: "John Doe",
    //         Password: "123456"
    //     },
    // });

    // console.log(new_data + " < new entry");

    // Getting all users
    // const users = await prisma.user.findMany();
    // const users = prisma.user.findMany();
    
    // const names = users.map((user) -> user.name);
    
    // console.log(`${users.length} -> ${names.join(", ")} `);
    
    // console.log(`${users} ${users.length} -> data`)

    res.send(`data`)
})


app.listen(port, () => console.log(`listening on port ${port}`));
**/