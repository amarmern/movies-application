const mongoose = require('mongoose');
const validator = require('validator');
const movieSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      maxlength: [100, 'Movie name must not have more than 100 characters'],
      minlength: [4, 'Movie name must have at least 4 charachters'],
      trim: true,
      //Validator npm use
      // validate: [validator.isAlpha, 'Name should only contain alphabet'],
    },
    description: {
      type: String,
      required: [true, 'description is required FIeld'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'duration is required'],
    },
    ratings: {
      type: Number,
      // min: [1, 'Rating mudt be 1.0 or more'],
      // max: [10, 'Rating should not not be more than 10'],
      //custom validation
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message: 'Ratings ({VALUE}) should be above 1 and below 10',
      },
    },
    totalRating: {
      type: Number,
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
    },
    releaseDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    genres: {
      type: [String],
      required: [true, 'Genres are required'],
      // enum: {
      //      values: ["Action", "Adventure", "Sci-Fi", "Thriller", "Crime", "Drama", "Comedy", "Romance", "Biography"],
      //      message: "This genre does not exist"
      // }
    },
    director: {
      type: [String],
      required: [true, 'Directors are required'],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover Image is required'],
    },
    actors: {
      type: [String],
      required: [true, 'actors are required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movieSchema.virtual('durationInHours').get(function () {
  return this.duration / 60;
});

movieSchema.pre('save', function (next) {
  console.log(this);
  next();
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
