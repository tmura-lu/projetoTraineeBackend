import mongoose from '@/database';
import Slugify from '@/utils/Slugify';
const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  featuredImage: {
    type: String,
    required: true,
  },
  images: [{ type: String }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ProjectSchema.pre('save', function (next) {
  const title = this.title;
  this.slug = Slugify(title);
  next();
});

export default mongoose.model('Project', ProjectSchema);
