import jwt from 'jsonwebtoken';
import authConfig from '@/config/auth';

export default (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const tokenData = authHeader.split(' ');
    if (tokenData.length !== 2) {
      return res.status(401).send({ error: 'Token mal formatado' });
    }

    const [scheme, token] = tokenData;
    if (scheme.indexOf('Bearer') < 0) {
      return res.status(401).send({ error: 'Token mal formatado' });
    }
    jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: 'Token invalido' });
      } else {
        req.uid = decoded.uid;
        return next();
      }
    });
  } else {
    return res.status(401).send({ error: 'Token nao fornecido' });
  }
};
