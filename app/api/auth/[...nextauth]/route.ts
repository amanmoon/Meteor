import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import NextAuth from 'next-auth';

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
    ],
    session: {
        strategy: 'jwt', // Using JWT to store session data
    },

    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.name = profile.name;
                token.email = profile.email;
                token.picture = profile.image;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.image = token.picture;
            return session;
        },
    },
});

export { handler as GET, handler as POST };