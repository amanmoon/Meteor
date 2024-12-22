'use client';

import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function Page() {
  const { data: session } = useSession();

  function OAuthGoogleSignIn() {
    signIn('google');
  }

  function OAuthSignOut() {
    signOut();
  }
  console.log(session);
  return (
    <>
      <h1>Hello, Next.js!</h1>

      {!session ? (<>
        <button onClick={OAuthGoogleSignIn}>Sign In with Google</button>
      </>
      ) : (
        <>
          <button onClick={OAuthSignOut}>Sign Out</button>
          {session.user.image && (<>
            <img
              src={session.user.image}
              style={{ width: '1000px', height: '1000px', borderRadius: '50%' }}
            /></>
          )}
        </>
      )}
    </>
  );
}
