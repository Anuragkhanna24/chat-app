import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser ,createUser} from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.post('/', auth, createUser); 
export default router;