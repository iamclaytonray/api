import { gql } from 'apollo-server';

export const typeDefs = gql`
  ##### Scalars

  scalar DateTime
  scalar Json

  ##### Interfaces

  interface Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type User implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    avatarUri: String
    stripeCustomerId: String
    stripeSubscriptionId: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    password: String!
    token: String!
  }

  input ResendEmailVerificationInput {
    email: String!
  }

  input VerifyResetPasswordTokenInput {
    token: String!
  }

  type SuccessPayload {
    success: Boolean
  }

  type Query {
    currentUser: User
    verifyResetPasswordToken(
      input: VerifyResetPasswordTokenInput!
    ): SuccessPayload!
  }

  type Mutation {
    # Auth
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    forgotPassword(input: ForgotPasswordInput!): SuccessPayload!
    resetPassword(input: ResetPasswordInput!): SuccessPayload!
    resendEmailVerification(
      input: ResendEmailVerificationInput!
    ): SuccessPayload!
  }
`;
