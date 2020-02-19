const jwt = require('./jwt')

const authUtil = {
/* jwt token을 이용해 authentification, data transfer를 수행하는 미들웨어 */
    // token을 검사하는 함수
    validToken: (req, res, next) => {
        // request header로부터 token을 받는다.
        const token = req.headers.token;
        // token이 없다면 false
        if(!token) {
            return res.status(404).send('empty jwt token');
        } else {
            // token을 verify 하고 return 값을 user에 담는다.
            const user = jwt.verify(token);   
            if(user == -3)
                return res.status(404).send('expired token');   
            else if(user == -2 || user == -1)
                return res.status(404).send('invalid token');
            else     
                req.decoded = user;            
            // request의 decoded에 user 정보를 담고 다음 함수에 넘긴다. 
            next();
        }
    },
    checkNoToken: (req, res, next) => {
        if(req.headers.token) {
            return res.status(404).send('already have token');
        } else {
            next();
        }
    }
};

module.exports = authUtil;