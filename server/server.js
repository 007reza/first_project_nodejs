process.env.NODE_CONFIG_DIR=__dirname + '/config';

const config=require('config');
const express=require('express');
const _=require('lodash');
const morgan = require('morgan');
const helmet = require('helmet');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const persianDate= require('persian-date');
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

persianDate.toLocale('en');
let date=new persianDate().format('YYYY/M/DD');

app.use(express.json());
app.use(helmet());
app.use(morgan('combined',{stream: requestLogger}));

app.post('/api/users',async (req,res)=>{
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

app.post('/api/payment',authenticate,async (req, res) =>{
try {
    const body= _.pick(req.body, ['info','amount']);
    let user=await User.findOneAndUpdate({
        _id: req.user._id
    },{
        $push:{
            payment:{
                amount: body.amount,
                info : body.info,
                date
            }
        }
    });
    if(!user){
        res.status(400).json({
            ERROR : 'User not found'
        });
    }
    res.status(200).json({
       Message : 'Payment has been saved.'
    })
} catch (error) {
    res.status(400).json({
        ERROR : `something went wrong ${error}`
    })
}
});

app.get('/api/payment',authenticate,async (req, res,next)=>{
 try {
     let user=await User.findOne({
         _id: req.user._id
     })
     if(!user){
        res.status(400).json({
            ERROR : 'User not found'
        });
    }
    res.status(200).send(user.payment)
 } catch (error) {
    res.status(400).json({
        ERROR : `something went wrong ${error}`
    });
 }
});

app.delete('/api/payment/:id',authenticate,async (req, res)=>{
    let id=req.params.id;
    try {
       let user=await User.findOneAndUpdate({
           _id: req.user._id,
           'payment._id': id
       },{
           $pull:{
               payment:{
                   _id :id
               }
           }
       });
       if(!user){
        res.status(400).json({
            ERROR : 'User not found'
        });
    }
    res.status(200).send(user.payment)
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
})

app.patch('/api/payment',authenticate,async (req, res) =>{
    let body=_.pick(req.body, ['id', 'info', 'amount', 'date']);
    try {
        let user=await User.findOneAndUpdate({
            _id: req.user._id,
            'payment._id':body.id
        },{
            $set:{
                'payment.$.info':body.info,
                'payment.$.amount': body.amount,
                'payment.$.date': body.date
            }
        });
        if(!user){
            res.status(400).json({
                ERROR : 'User not found'
            });
        }

        res.status(200).json({
            Message: 'Pament updated'
        });
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
})

app.listen(config.get('PORT'),()=>{
    //console.log(`server is runing on port ${config.get('PORT')}`);
    logger.log({
        level: 'info',
        message : `server running on port ${config.get('PORT')}`
    });
});