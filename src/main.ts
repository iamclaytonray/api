import { ApolloServer, AuthenticationError } from 'apollo-server';

import { authRequest } from './core/AuthController';
import { resolvers } from './resolvers';
import { typeDefs } from './typeDefs';

const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    if (req.body.operationName === 'Login') {
      return { user: null };
    }

    const user = await authRequest(req);

    if (!user) {
      throw new AuthenticationError('Unauthenticated');
    }

    return { user };
  },
});

server.listen(PORT).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
