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
const {
    splitDate,
    printRunLevel
} =require('./utils/utils');
const {
    logger
}=require('./utils/winstonOptions');

printRunLevel(config.get('Level'));

const app=express();
const requestLogger= fs.createWriteStream(path.join(__dirname, '/log/rquests.log'));


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
// Payments-------------------------
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

app.get('/api/paymentSum',authenticate,async (req, res)=>{
    let amount=[];
    let theDate;

    try {
        let user=await User.findOne({
            _id: req.user._id
        })
        if(!user){
            res.status(400).json({
                ERROR : 'User not found'
            });
        }

        user.payment.forEach((element) => {
            splitArr=splitDate(element.date);
            theDate=new persianDate([Number(splitArr[0]), Number(splitArr[1]) ,Number(splitArr[2])]);
            todayDate=new persianDate();
           
            if(theDate.isSameMonth(todayDate)){
                amount.push(element.amount);
            }
            
        });

        res.status(200).json({
            sum :`${_.sum(amount)}`
        });
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
});

app.get('/api/payment/:date',authenticate,async (req, res) =>{
    let param=req.params.date;
    let date= param.replaceAll('-','/');

    try {
        let user=await User.findOne({
            _id:req.user._id
        })
        let payments=[];
        if(!user){
            res.status(400).json({
                ERROR : 'User not found'
            });
        }
        
user.payment.forEach((element) =>{
if(element.date=== date){
payments.push(element);
}

});
res.status(200).send(payments);
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
});

// Receives---------------------------
app.post('/api/receive',authenticate,async (req, res) =>{
    try {
        const body= _.pick(req.body, ['info','amount']);
        let user=await User.findOneAndUpdate({
            _id: req.user._id
        },{
            $push:{
                receive:{
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
           Message : 'Receive has been saved.'
        })
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        })
    }
    });

app.get('/api/receive',authenticate,async (req, res,next)=>{
        try {
            let user=await User.findOne({
                _id: req.user._id
            })
            if(!user){
               res.status(400).json({
                   ERROR : 'User not found'
               });
           }
           res.status(200).send(user.receive)
        } catch (error) {
           res.status(400).json({
               ERROR : `something went wrong ${error}`
           });
        }
       });

app.delete('/api/receive/:id',authenticate,async (req, res)=>{
    let id=req.params.id;
    try {
       let user=await User.findOneAndUpdate({
           _id: req.user._id,
           'receive._id': id
       },{
           $pull:{
            receive:{
                   _id :id
               }
           }
       });
       if(!user){
        res.status(400).json({
            ERROR : 'User not found'
        });
    }
    res.status(200).send(user.receive)
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
})

app.patch('/api/receive',authenticate,async (req, res) =>{
    let body=_.pick(req.body, ['id', 'info', 'amount', 'date']);
    try {
        let user=await User.findOneAndUpdate({
            _id: req.user._id,
            'receive._id':body.id
        },{
            $set:{
                'receive.$.info':body.info,
                'receive.$.amount': body.amount,
                'receive.$.date': body.date
            }
        });
        if(!user){
            res.status(400).json({
                ERROR : 'User not found'
            });
        }

        res.status(200).json({
            Message: 'receive updated'
        });
    } catch (error) {
        res.status(400).json({
            ERROR : `something went wrong ${error}`
        });
    }
})

app.listen(config.get('PORT'),()=>{
   
    logger.log({
        level: 'info',
        message : `server running on port ${config.get('PORT')}`
    });
});