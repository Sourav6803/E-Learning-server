require("dotenv").config();
import mongoose, { Document, model, Schema } from "mongoose";

export interface FaqItem extends Document {
  question: string;
  answer: string;
}

export interface Category extends Document {
  title: string;
}

export interface BannerImage extends Document {
  public_id: string;
  url: string;
}

export interface Layout extends Document {
  type: string;
  faq: FaqItem[];
  categories: Category[];
  banner: {
    image: BannerImage;
    title: string;
    subTitle: string;
  };
}

const faqSchema = new Schema<FaqItem>(
  {
    question: {
      type: String,
    },

    answer: {
      type: String,
    },
  },
  { timestamps: true }
);

const categorySchema = new Schema<Category>({
  title: String,
});

const bannerImageSchema = new Schema<BannerImage>({
  public_id: { type: String },
  url: { type: String },
});

const layoutScheema = new Schema<Layout>({
  type: { type: String },
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: {
      public_id: String,
      url: String,
    },
    title: { type: String },
    subTitle: { type: String },
  },
});

const layoutModel = model<Layout>("Layout", layoutScheema);

export default layoutModel;
