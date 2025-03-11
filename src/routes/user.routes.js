import { Router } from 'express';
import Joi from 'joi';
import UserController from '../controllers/user.controller.js';
import { protect, authorize, validateDayGroup } from '../middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-]+$/).required(),
  role: Joi.string().valid('admin', 'leader', 'member').required(),
  dayGroup: Joi.when('role', {
    is: Joi.valid('leader', 'member'),
    then: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday').required(),
    otherwise: Joi.forbidden()
  })
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2),
  email: Joi.string().email(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s-]+$/),
  dayGroup: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
}).min(1);

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

const manageTeamSchema = Joi.object({
  memberIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended').required()
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Routes
router.post('/',
  protect,
  authorize('admin'),
  validateRequest(createUserSchema),
  UserController.createUser
);

router.get('/',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  UserController.getUsers
);

router.get('/:userId',
  protect,
  authorize('admin', 'leader'),
  validateDayGroup,
  UserController.getUserById
);

router.patch('/:userId',
  protect,
  authorize('admin'),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

router.post('/password',
  protect,
  validateRequest(updatePasswordSchema),
  UserController.updatePassword
);

router.post('/team',
  protect,
  authorize('leader'),
  validateRequest(manageTeamSchema),
  validateDayGroup,
  UserController.manageTeamMembers
);

router.patch('/:userId/status',
  protect,
  authorize('admin'),
  validateRequest(updateStatusSchema),
  UserController.updateUserStatus
);

export default router; 