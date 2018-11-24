const path= require('path');
const winston=require('winston');


const logger = winston.createLogger({
    transports : [
        new winston.transports.Console(),
        new winston.transports.File({filename : path.join(__dirname, '../log/server-status.log' )})
    ]
});

module.exports ={
    logger
};