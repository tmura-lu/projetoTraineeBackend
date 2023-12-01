import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost/portifolio-pessoal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.Promise = global.Promise;

export default mongoose;
