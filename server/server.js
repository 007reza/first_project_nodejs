process.env.NODE_CONFIG_DIR=__dirname + '/config';

const config=require('config');
const express=require('express');
const _=require('lodash');
const morgan = require('morgan');
const helmet = require('helmet');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const {authenticate}= require('./middleWare/authenticate');
const {User}=require('./model/user');



console.log(`*** ${String(config.get('Level')).toUpperCase()} ***`);

const app=express();
const requestLogger= fs.createWriteStream(path.join(__dirname, '/log/rquests.log'));
const logger = winston.createLogger({
    transports : [
        new winston.transports.Console(),
        new winston.transports.File({filename : path.join(__dirname, '/log/server-status.log' )})
    ]
})

app.use(express.json());
app.use(helmet());
app.use(morgan('combined',{stream: requestLogger}));

app.post('/api/users',authenticate,async (req,res)=>{
    try {
        const body=_.pick(req.body, ['fullname' ,'email' , 'password']);
        let user=new User(body);
        await user.save();
        res.status(200).send(user);         
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
});

app.post('/api/login',async (req,res) => {
    try {
        const body=_.pick(req.body,['email','password']);
        let user=await  User.findByCredentials(body.email , body.password);
        let token=await user.generateAuthToken();
        res.header('x-auth',token).send(token).status(200);
    
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
 
});

app.listen(config.get('PORT'),()=>{
    //console.log(`server is runing on port ${config.get('PORT')}`);
    logger.log({
        level: 'info',
        message : `server running on port ${config.get('PORT')}`
    })
});