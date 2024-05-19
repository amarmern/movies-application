const express = require('express');

const movieController = require('../Controllers/moviesController');

const router = express.Router();

router.route('/movie-stats').get(movieController.getMovieStats);
router.route('/movie-by-genre/:genre').get(movieController.getMovieByGenre);

router
  .route('/')
  .get(movieController.getAllMovies)
  .post(movieController.createMovie);

router
  .route('/:id')
  .get(movieController.getMovie)
  .patch(movieController.updateMovie)
  .delete(movieController.deleteMovie);

module.exports = router;
