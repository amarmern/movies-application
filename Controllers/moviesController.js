const Apifeatures = require('../Utils/ApiFeatures');
const CustomError = require('../Utils/CustomError');
const asyncErrorHandler = require('../Utils/asyncErrorHandler');
const Movie = require('./../Models/movieModel');
//ROUTE HANDLER FUNCTIONS
exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {
  //try {
  const features = new Apifeatures(Movie.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let movies = await features.query;

  // const movies = await Movie.find(req.query);

  // const movies = await Movie.find()
  //   .where('name')
  //   .equals(req.query.name)
  //   .where('ratings')
  //   .equals(req.query.ratings);

  // const excludeFields = ['sort', 'page', 'limit', 'fields'];
  // const queryObj = { ...req.query };
  // excludeFields.forEach((el) => delete queryObj[el]);
  // console.log(queryObj);
  // const movies = await Movie.find(queryObj);

  res.status(200).json({
    status: 'success',
    length: movies.length,
    data: {
      movies,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message,
  //   });
  // }
});

exports.getMovie = asyncErrorHandler(async (req, res, next) => {
  //try {
  //const movie = await Movie.find({ _id: req.params.id });
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    // if movie not found then it will the error module
    const error = new CustomError(
      `movie that id ${req.params.id} is not found`,
      404
    );
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: {
      movie,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message,
  //   });
  // }
});

exports.createMovie = asyncErrorHandler(async (req, res, next) => {
  // try {
  const movie = await Movie.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      movie,
    },
  });
  // } catch (err) {
  //   const error = new CustomError(err.message, 400);
  //   next(error);

  // res.status(400).json({
  //   status: 'fail',
  //   message: err.message,
  // });
  //}
});

exports.updateMovie = asyncErrorHandler(async (req, res, next) => {
  //try {
  const updateMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updateMovie) {
    // if movie not found then it will the error module
    const error = new CustomError(
      `movie that id ${req.params.id} is not found`,
      404
    );
    return next(error);
  }

  res.status(200).json({
    status: 'success',
    data: {
      updateMovie,
    },
  });
  // } catch (err) {
  //   const error = new CustomError(err.message, 404);
  //   next(error);

  //   // res.status(404).json({
  //   //   status: 'fail',
  //   //   message: err.message,
  //   // });
  // }
});

exports.deleteMovie = asyncErrorHandler(async (req, res, next) => {
  //try {
  await Movie.findByIdAndDelete(req.params.id);

  if (!movie) {
    // if movie not found then it will the error module
    const error = new CustomError(
      `movie that id ${req.params.id} is not found`,
      404
    );
    return next(error);
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
  // } catch (err) {
  //   const error = new CustomError(err.message, 404);
  //   next(error);

  //   // res.status(404).json({
  //   //   status: 'fail',
  //   //   message: err.message,
  //   // });
  // }
});

exports.getMovieStats = asyncErrorHandler(async (req, res, next) => {
  //try {
  const stats = await Movie.aggregate([
    { $match: { ratings: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$releaseYear',
        avgRating: { $avg: '$ratings' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        priceTotal: { $sum: '$price' },
        movieCount: { $sum: 1 },
      },
    },
    {
      $sort: { minPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    count: stats.length,
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   const error = new CustomError(err.message, 404);
  //   next(error);
  //   // res.status(404).json({
  //   //   status: 'fail',
  //   //   message: err.message,
  //   // });
  // }
});

exports.getMovieByGenre = asyncErrorHandler(async (req, res, next) => {
  //try {
  const genre = req.params.genre;
  const movie = await Movie.aggregate([
    { $unwind: '$genres' },
    {
      $group: {
        _id: '$genres',
        movieCount: { $sum: 1 },
        movies: { $push: '$name' },
      },
    },
    { $addFields: { genre: '$_id' } },
    {
      $project: {
        _id: 0,
      },
    },
    { $sort: { movieCount: -1 } },
    //{ $limit: 6 },
    { $match: { genre: genre } },
  ]);
  res.status(200).json({
    status: 'success',
    count: movie.length,
    data: {
      movie,
    },
  });
  // } catch (err) {
  //   const error = new CustomError(err.message, 404);
  //   next(error);
  //   // res.status(404).json({
  //   //   status: 'fail',
  //   //   message: err.message,
  //   // });
  // }
});
