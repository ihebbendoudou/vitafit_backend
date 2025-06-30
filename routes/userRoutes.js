const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


router.post('/users', userController.addUser);
router.get('/users', userController.getAllUsers);
router.get('/users/search', userController.searchUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.put('/users/password/:id', userController.updatePassword);
router.delete('/users/:id', userController.deleteUser);


module.exports = router;
