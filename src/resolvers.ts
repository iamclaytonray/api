import * as AuthController from './core/AuthController';

export const resolvers = {
  Query: {
    // Auth
    currentUser: AuthController.getCurrentUser,
    verifyResetPasswordToken: AuthController.verifyResetPasswordToken,
  },
  Mutation: {
    // Auth
    login: AuthController.login,
    register: AuthController.register,
    forgotPassword: AuthController.forgotPassword,
    resetPassword: AuthController.resetPassword,
    resendEmailVerification: AuthController.resendEmailVerification,
  },
  Node: {
    __resolveType: (): any => {
      return null;
    },
  },
};
