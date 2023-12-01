import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Mailer from '@/modules/Mailer';
import User from '@/app/schemas/User';
import authConfig from '@/config/auth';

const router = new Router();

const generateToken = (params) => {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
};

router.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'Usuário já existe' });
      } else {
        User.create({ email, name, password })
          .then((user) => {
            user.password = undefined;
            return res.send({ user });
          })
          .catch((error) => {
            console.error('Error ao criar usuário', error);
            return res.status(400).send({ error: 'Registro falhou' });
          });
      }
    })

    .catch((error) => {
      console.error('Error ao consultar usuário no banco de dados', error);
      return res.status(500).send({ error: 'Registro falhou' });
    });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })

    .select('+password')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = generateToken({ uid: user.id });
              return res.send({ token: token, tokenExpiration: '1d' });
            } else {
              return res.status(400).send({ error: 'Senha inválida' });
            }
          })
          .catch((error) => {
            console.error('Erro ao verificar senha', error);
            return res.status(500).send({ error: 'Login falhou' });
          });
      } else {
        return res.status(404).send({ error: 'Usuário não encontrado' });
      }
    })
    .catch((error) => {
      console.error('Erro ao logar', error);
      return res.status(500).send({ error: 'Login falhou' });
    });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = new Date();
        expiration.setHours(new Date().getHours() + 3);

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            Mailer.sendMail(
              {
                to: email,
                from: 'webmaster@texteexpress.com',
                template: 'auth/forgot_password',
                context: { token },
              },
              (error) => {
                if (error) {
                  console.error('Erro ao enviar email', error);
                  return res
                    .status(400)
                    .send({ error: 'Falhou em mandar o email de recuperação' });
                } else {
                  return res.send();
                }
              },
            );
          })
          .catch((error) => {
            console.error(
              'Erro ao salvar o token de recuperação de senha',
              error,
            );
            return res.status(500).send({ error: 'Erro interno de servidor' });
          });
      } else {
        return res.status(404).send({ error: 'Usuário não encontrado' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Login falhou' });
    });
});

router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')

    .then((user) => {
      if (user) {
        if (
          token !== user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Token inválido' });
        } else {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.password = newPassword;

          user
            .save()
            .then(() => {
              res.send({ message: 'Senha alterada com sucesso' });
            })
            .catch((error) => {
              console.error('Erro ao salvar nova senha', error);
              return res
                .status(500)
                .send({ error: 'Erro interno de servidor' });
            });
        }
      } else {
        return res.status(404).send({ error: 'Usuário não encontrado' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Login falhou' });
    });
});

export default router;
