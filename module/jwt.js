const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;

const options = {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: "pmos"
}

module.exports = {
    sign: (json) => {
        const payload = {
            id : json.id,
            name : json.name,
            type: json.type
        };
        const result = jwt.sign(payload, secretKey, options);
        return result;
    },    
    verify: (token) => {
        let decoded;
        try{
            decoded = jwt.verify(token, secretKey);
        } catch (err){
            if (err.message === 'jwt expired') {
                console.log('expired token');
                return -3;
            } else if (err.message === 'invalid token') {
                console.log('invalid token');
                return -2;
            } else {
                console.log("error");
                return -1;
            }
        }
        return decoded;
        }
    } 
