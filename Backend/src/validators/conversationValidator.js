import Joi from 'joi';

export const createConversationSchema = Joi.object({
  participantId: Joi.string().required().messages({
    'any.required': 'Participant ID is required',
  }),
  kyberCiphertext: Joi.string().optional(),
});
