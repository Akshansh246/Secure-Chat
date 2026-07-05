import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  encryptedBlob: Joi.string().required().messages({
    'any.required': 'Encrypted message blob is required',
  }),
  conversationId: Joi.string().required().messages({
    'any.required': 'Conversation ID is required',
  }),
});
