const express = require('express');

const movieController = require('../Controllers/moviesController');
const authController = require('../Controllers/authController');

const router = express.Router();

router.route('/movie-stats').get(movieController.getMovieStats);
router.route('/movie-by-genre/:genre').get(movieController.getMovieByGenre);

router
  .route('/')
  .get(authController.protect, movieController.getAllMovies)
  .post(movieController.createMovie);

router
  .route('/:id')
  .get(authController.protect, movieController.getMovie)
  .patch(movieController.updateMovie)
  .delete(
    authController.protect,
    authController.restrict('admin'),
    movieController.deleteMovie
  );

module.exports = router;
