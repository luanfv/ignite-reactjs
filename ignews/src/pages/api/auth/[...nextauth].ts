import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { query } from 'faunadb';

import { fauna } from '../../../services/fauna';

export default NextAuth({
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      scope: 'read:user',
    }),
  ],
  callbacks: {
    async signIn(user, account, profile) {
      try {
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index('user_by_email'),
                  query.Casefold(user.email),
                ),
              ),
            ),
            query.Create(
              query.Collection('users'),
              {
                data: {
                email: user.email
                }
              },
            ),
            query.Get(
              query.Match(
                query.Index('user_by_email'),
                query.Casefold(user.email),
              ),
            )
          ),
        );

        return true;
      } catch {
        return false;
      }
    },
  }
});