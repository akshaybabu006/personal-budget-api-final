const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
var randtoken = require('rand-token') 
var cors =require('cors');
const compression = require('compression');

var refreshTokens = {} 
const port = process.env.port || 3000;
const secretKey = 'My super secret key';
const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256']
});



const app = express();
app.use(express.json())
app.use(compression());
app.use(cors({origin:'http://localhost:4200'}))

app.use((req, res, next ) => {
    res.setHeader('Acess-Controll-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Acess-Controll-Allow-Headers', 'Content-type,Authorization');
    next();
});

var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'password',
    database : 'personal_budget',
    port: 3306
});
connection.connect();

app.post('/api/signup', async (req, res) => {
    try{
        // const date = new Date().toJSON().slice(0,10);
        // const {username, password} = req.body;
        const username = req.query.username;
        const password = req.query.password;
        const hashPassword = await bcrypt.hash(password, 10);
        console.log(username);
        console.log(password);
        console.log("inside insert!");
            connection.query('INSERT INTO users (name, password) VALUES (?,?)',[username,hashPassword],
             function (err, result) {
              if (err){
                res.status(405).json({ success: false, error: err })
              }else{
                console.log("1 record inserted");
                res.status(201).json({success: true})
              }
              
            });
        
    } catch(e) {
        res.status(404).json({ success: false, error: e })
      }
});

app.post('/api/budget',jwtMW, async (req, res) => {
    try{
        // const date = new Date().toJSON().slice(0,10);
        // const {username, password} = req.body;
        const id = req.query.id;
        const month = req.query.month;
        console.log(id);
        console.log("inside budget");
            connection.query('SELECT title,budget,allocatedBudget FROM personal_budget.budget where userid=? AND month=?',[id,month],
             function (err, result) {
              if (err){
                res.status(404).json({ success: false, error: err })
              }else{
                    console.log("retrieved ");
                    res.status(201).json(result);
              }
              
            });
        
    } catch(e) {
        res.status(404).json({ success: false, error: e })
      }
});

app.post('/api/budgetupdate',jwtMW, async (req, res) => {
    try{
        const id = req.query.id;
        const month = req.query.month;
        const category = req.query.category;
        const budget = req.query.budget;
        console.log(category);
        console.log(budget);
        console.log("inside budget update");
            connection.query('UPDATE personal_budget.budget SET budget=? WHERE userid = ? AND title=? AND month =?',[budget,id,category,month],
             function (err, result) {
              if (err){
                console.log("Failed to update ");
                res.status(404).json({ success: false, error: err })
              }else{
                    console.log("Updated");
                    res.status(201).json(result);
              }
              
            });
        
    } catch(e) {
        res.status(404).json({ success: false, error: e })
      }
});

app.post('/api/budgetinsert',jwtMW, async (req, res) => {
    try{
        const id = req.query.id;
        const month = req.query.month;
        const category = req.query.category;
        const allocatedBudget = req.query.allocatedBudget;
        console.log(category);
        console.log(allocatedBudget);
        console.log("inside budget update");
            connection.query('insert into personal_budget.budget (title,allocatedBudget,userid,month) values (?,?,?,?)',[category,allocatedBudget,id,month],
             function (err, result) {
              if (err){
                console.log("Failed to insert ");
                res.status(404).json({ success: false, error: err })
              }else{
                    console.log("Inserted");
                    res.status(201).json(result);
              }
              
            });
        
    } catch(e) {
        res.status(404).json({ success: false, error: e })
      }
});

//This is just a test api
app.get('/', async(req, res)=>{
    // connection.connect();

    connection.query('SELECT * FROM users', function(error, result, fields){
        // connection.end();
        if(error) throw error;
        res.status(201).json(result);
    });

});

app.post('/api/refreshtoken',jwtMW,async(req, res)=>{
    try{
        console.log("refresh token")
        var username = req.query.username
        var refreshToken = req.query.refreshToken
        var id = req.query.id;
        console.log(username)
        console.log(refreshToken)
        console.log(id)
        if((refreshToken in refreshTokens) && (refreshTokens[refreshToken] == username)) {
            console.log("verified")
            let token = jwt.sign({id: id, username: username}, secretKey, { expiresIn: '80000'});//chnge the time here 
               console.log(token);
               console.log('token generated');
                    res.status(201).json({
                        success: true,
                        err: null,
                        token:token,
                        id:id
                    });
          }
          else {
            console.log("not - 401 verified")
            res.send(401)
          }
     }catch(e) {
        console.log("not - 404 verified")
        res.status(404).send({ error: e })
      }
    });

app.post('/api/login', async(req, res)=>{
    try{
        // const{username, password} = req.body;
        const username = req.query.username;
        const password = req.query.password;
            connection.query('SELECT id,password FROM users WHERE name=?',[username],
             function (err, result, fields) {
                
              if (err) throw err;
            //   const{hashPass}= result.toJSON
            console.log(result);
            if(result.length>0){
                console.log(username);
            console.log(username);
              console.log(password);
              const id = result[0].id;
              console.log(id);
              bcrypt.compare(password, result[0].password, function(err, result) {
                if (result) {
                  console.log("It matches!")
                  let token = jwt.sign({id: id, username: username}, secretKey, { expiresIn: '60000'});//reduce one zerochnge the time here 
                  var refreshToken = randtoken.uid(256);
                  refreshTokens[refreshToken] = username 
                    res.status(201).json({
                        success: true,
                        err: null,
                        token:token,
                        refreshToken: refreshToken,
                        id:id
                    });
                //   res.status(201).send()
                }
                else {
                  console.log("Invalid password!");
                //   res.status(404).send("Invalid password!")
                  res.status(401).json({
                    success: false,
                    token: null,
                    err: 'Username or password is incorrect'
                });
                }
              });

            }else{
                res.status(401).json({
                    success: false,
                    token: null,
                    err: 'Username or password is incorrect'
                });

            }
            
        });
        
    } catch(e) {
        res.status(404).send({ error: e })
      }
});

app.use(function (err, req, res , next){
    if(err.name === 'UnauthorizedError'){
        res.status(400).json({
            success: false,
            officialError: err,
            err: 'Invalid username or password'
        });
    }else{
        next(err);
    }
});

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});