import { Router } from 'express';
import Project from '@/app/schemas/Project';
import Slugify from '@/utils/Slugify';
import AuthMiddleware from '@/app/middlewares/Auth';
import Multer from '@/app/middlewares/Multer';

const router = new Router();

router.get('/', (req, res) => {
  Project.find()
    .then((data) => {
      const projects = data.map((project) => {
        return {
          title: project.title,
          category: project.category,
          slug: project.slug,
          featuredImage: project.featuredImage,
        };
      });
      res, send(projects);
    })
    .catch((error) => {
      console.error('Erro ao obter projeto no banco de dados', error);
      res.status(400).send({
        error:
          'Nao foi possivel obter os dados do projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.get('/:projectSlug', (req, res) => {
  Project.findOne({ slug: req.params.projectSlug })
    .then((project) => {
      res.send(project);
    })
    .catch((error) => {
      console.error('Erro ao obter projeto no banco de dados', error);
      res.status(400).send({
        error:
          'Nao foi possivel obter os dados do projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.post('/', AuthMiddleware, (req, res) => {
  const { title, description, category } = req.body;
  Project.create({ title, description, category })
    .then((project) => {
      res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Erro ao salvar o novo projeto no banco de dados', error);
      res.status(400).send({
        error:
          'Nao foi possivel salvar seu projeto. Verifique os dados e tente novamente.',
      });
    });
});
router.put('/:projectId', AuthMiddleware, (req, res) => {
  const { title, description, category } = req.body;
  let slug = undefined;
  if (title) {
    slug = Slugify(title);
  }
  Project.findByIdAndUpdate(
    req.params.projectId,
    { title, slug, description, category },
    { new: true },
  )
    .then((project) => {
      res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Erro ao salvar o novo projeto no banco de dados', error);
      res.status(400).send({
        error:
          'Nao foi possivel atualizar seu projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.delete('/:projectId', AuthMiddleware, (req, res) => {
  Project.findByIdAndRemove(req.params.projectId)
    .then(() => {
      res.send({ message: 'Projeto removido com sucesso' });
    })
    .catch((error) => {
      console.error('Erro ao remover o projeto no banco de dados', error);
      res.status(400).send({
        error:
          'Nao foi possivel remover seu projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.post(
  '/featured-image/:projectId',
  [AuthMiddleware, Multer.single('featuredImage')],
  (req, res) => {
    const { file } = req;
    if (file) {
      Project.findByIdAndUpdate(
        req.params.projectId,
        {
          $set: {
            featuredImage: file.path,
          },
        },
        { new: true },
      )
        .then((project) => {
          res.send({ project });
        })
        .catch((error) => {
          console.error('Erro ao salvar a imagem do projeto', error);
          res.status(500).send({
            error: 'Ocorreu um erro, tente novamente.',
          });
        });
    } else {
      res
        .status(400)
        .send({ error: 'Não foi possível salvar a imagem do projeto.' });
    }
  },
);

router.post('/images/:projectId', Multer.array('images'), (req, res) => {
  const { files } = req;

  if (files && files.length > 0) {
    const images = [];
    files.forEach((file) => {
      images.push(file.path);
    });
    Project.findByIdAndUpdate(
      req.params.projectId,
      {
        $set: { images },
      },
      { new: true },
    )
      .then((project) => {
        res.send({ project });
      })
      .catch((error) => {
        console.error('Erro ao salvar imagens ao projeto', error);
        res.status(500).send({
          error: 'Ocorreu um erro, tente novamente.',
        });
      });
  } else {
    return res.status(400).send({ error: 'Nenhuma imagem enviada' });
  }
});

export default router;
